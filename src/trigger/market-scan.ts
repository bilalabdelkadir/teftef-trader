import { logger, schedules, task } from '@trigger.dev/sdk/v3';
import { PrismaClient } from '@/lib/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { analyzeMarket } from '@/lib/ai-analysis';
import { sendTradeSignalEmail } from '@/lib/email';

// Create Prisma client for trigger task
function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const marketScanTask = schedules.task({
  id: 'market-scan',
  cron: '0 7,13 * * 1-5', // 7am & 1pm UTC, weekdays only
  maxDuration: 3600, // 1 hour max
  run: async () => {
    const prisma = createPrismaClient();

    try {
      logger.info('Starting market scan');

      // Get all users with onboarding done and email alerts enabled
      const usersWithSettings = await prisma.userSettings.findMany({
        where: {
          onboardingDone: true,
          emailAlerts: true,
        },
        include: {
          user: true,
        },
      });

      logger.info(`Found ${usersWithSettings.length} users to scan for`);

      // Get unique symbols across all watchlists
      const allWatchlistItems = await prisma.watchlist.findMany({
        where: {
          userId: {
            in: usersWithSettings.map((s) => s.userId),
          },
        },
      });

      // Group watchlist items by symbol to avoid duplicate analysis
      const symbolToUsers = new Map<
        string,
        { userId: string; settings: (typeof usersWithSettings)[0] }[]
      >();

      for (const item of allWatchlistItems) {
        const settings = usersWithSettings.find(
          (s) => s.userId === item.userId
        );
        if (!settings) continue;

        const existing = symbolToUsers.get(item.symbol) || [];
        existing.push({ userId: item.userId, settings });
        symbolToUsers.set(item.symbol, existing);
      }

      const symbols = Array.from(symbolToUsers.keys());
      logger.info(`Analyzing ${symbols.length} unique symbols`);

      let signalsCreated = 0;
      let highConfidenceSignals = 0;

      // Analyze each symbol
      for (const symbol of symbols) {
        try {
          logger.info(`Analyzing ${symbol}`);

          // Run analysis with default settings
          const result = await analyzeMarket(
            symbol,
            'ai_decide',
            10000,
            1,
            '1h'
          );

          // Process all valid setups, mark low-confidence ones with "caution" status
          if (result.signal.hasValidSetup) {
            const isHighConfidence = result.signal.confidence >= 70;
            if (isHighConfidence) {
              highConfidenceSignals++;
            }

            // Create signal for each user watching this symbol
            const users = symbolToUsers.get(symbol) || [];

            for (const { userId, settings } of users) {
              // Calculate position size based on user's settings
              const accountSize = settings.accountSize;
              const riskPercentage = settings.riskPerTrade;
              const riskAmount = accountSize * (riskPercentage / 100);
              const pipsAtRisk = Math.abs(
                result.signal.entryPrice - result.signal.stopLoss
              );
              const positionSize = pipsAtRisk > 0 ? riskAmount / pipsAtRisk : 0;

              await prisma.tradeSignal.create({
                data: {
                  userId,
                  symbol: result.symbol,
                  market: result.market,
                  direction: result.signal.direction,
                  entryPrice: result.signal.entryPrice,
                  stopLoss: result.signal.stopLoss,
                  takeProfit: result.signal.takeProfit,
                  riskReward: result.riskReward,
                  positionSize: Math.round(positionSize * 100) / 100,
                  confidence: result.signal.confidence,
                  reasoning: result.signal.reasoning,
                  strategy: result.strategy,
                  // Mark low-confidence signals with "caution" status
                  status: isHighConfidence ? 'new' : 'caution',
                },
              });

              signalsCreated++;
              logger.info(
                `Created ${
                  isHighConfidence ? '' : 'CAUTION '
                }signal for user ${userId}: ${symbol} ${
                  result.signal.direction
                } (${result.signal.confidence}% confidence)`
              );

              // Log warning for low-confidence signals
              if (!isHighConfidence) {
                logger.warn(
                  `Low confidence signal for ${symbol}: confidence ${result.signal.confidence}% below 70% threshold`
                );
              }

              // Send email notification for all signals
              if (settings.emailAlerts && settings.user.email) {
                try {
                  await sendTradeSignalEmail({
                    to: settings.user.email,
                    userName: settings.user.name || 'Trader',
                    symbol: result.symbol,
                    direction: result.signal.direction,
                    entryPrice: result.signal.entryPrice,
                    stopLoss: result.signal.stopLoss,
                    takeProfit: result.signal.takeProfit,
                    riskReward: result.riskReward,
                    confidence: result.signal.confidence,
                    reasoning: result.signal.reasoning,
                  });
                  logger.info(
                    `Email sent to ${settings.user.email} for ${symbol} signal${
                      !isHighConfidence ? ' (low confidence)' : ''
                    }`
                  );
                } catch (emailError) {
                  logger.error(
                    `Failed to send email to ${settings.user.email}:`,
                    { emailError }
                  );
                }
              } else {
                logger.info(
                  `Email skipped for user ${userId}: emailAlerts=${
                    settings.emailAlerts
                  }, hasEmail=${!!settings.user.email}`
                );
              }
            }
          } else {
            // Log when AI finds no valid setup
            logger.info(
              `No valid setup for ${symbol}: ${
                result.signal.confidence
              }% confidence - ${result.signal.reasoning.slice(0, 100)}...`
            );
          }
        } catch (error) {
          logger.error(`Failed to analyze ${symbol}:`, { error });
          // Continue with other symbols
        }

        // Add small delay to avoid rate limits
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      logger.info('Market scan completed', {
        symbolsAnalyzed: symbols.length,
        highConfidenceSignals,
        signalsCreated,
      });

      return {
        success: true,
        symbolsAnalyzed: symbols.length,
        highConfidenceSignals,
        signalsCreated,
      };
    } finally {
      await prisma.$disconnect();
    }
  },
});
