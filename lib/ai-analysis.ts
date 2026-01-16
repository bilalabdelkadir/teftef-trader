import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateObject } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { STRATEGY_PROMPTS, buildAgentSystemPrompt } from "./prompts";
import { retrieveTradingContext, type RetrievalContext } from "./rag";
import {
  getMarketData,
  type TimeSeriesResponse,
  type TechnicalIndicator,
  type MACDData,
} from "./market-data";
import {
  getMarketFromSymbol,
  DEFAULTS,
  INDICATOR_DEFAULTS,
} from "./constants";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

const TradeSignalSchema = z.object({
  hasValidSetup: z
    .boolean()
    .describe("Whether there is a valid trade setup based on the analysis"),
  direction: z
    .enum(["BUY", "SELL"])
    .describe("Trade direction - BUY for long, SELL for short"),
  entryPrice: z.number().describe("Recommended entry price for the trade"),
  stopLoss: z.number().describe("Stop loss price level"),
  takeProfit: z.number().describe("Take profit price level"),
  confidence: z
    .number()
    .min(0)
    .max(100)
    .describe("Confidence score from 0-100 based on setup quality"),
  reasoning: z
    .string()
    .describe(
      "Detailed explanation of the trade setup and why it was identified"
    ),
  keyLevels: z
    .object({
      support: z.array(z.number()).describe("Key support levels identified"),
      resistance: z
        .array(z.number())
        .describe("Key resistance levels identified"),
    })
    .describe("Important price levels"),
  marketStructure: z
    .string()
    .describe("Current market structure analysis (bullish, bearish, ranging)"),
});

export type TradeSignal = z.infer<typeof TradeSignalSchema>;

export interface AnalysisResult {
  symbol: string;
  market: string;
  strategy: string;
  signal: TradeSignal;
  riskReward: number;
  positionSize: number;
  timestamp: Date;
  strategyId?: string;
  ragContext?: string;
}

function formatMarketDataForPrompt(data: {
  symbol: string;
  interval: string;
  timeSeries: TimeSeriesResponse;
  indicators: {
    rsi: TechnicalIndicator[];
    macd: MACDData[];
    sma20: TechnicalIndicator[];
    ema50: TechnicalIndicator[];
  };
}): string {
  const { timeSeries, indicators } = data;
  const recentCandles = timeSeries.values.slice(0, 50);
  const currentPrice = recentCandles[0]?.close || 0;

  const candleData = recentCandles
    .slice(0, 20)
    .map(
      (c) =>
        `${c.datetime}: O=${c.open.toFixed(5)} H=${c.high.toFixed(5)} L=${c.low.toFixed(5)} C=${c.close.toFixed(5)}`
    )
    .join("\n");

  const rsiData = indicators.rsi
    .slice(0, 10)
    .map((r) => `${r.datetime}: ${r.value.toFixed(2)}`)
    .join(", ");

  const macdData = indicators.macd
    .slice(0, 10)
    .map(
      (m) =>
        `${m.datetime}: MACD=${m.macd.toFixed(5)} Signal=${m.macd_signal.toFixed(5)} Hist=${m.macd_hist.toFixed(5)}`
    )
    .join("\n");

  const sma20Current = indicators.sma20[0]?.value || 0;
  const ema50Current = indicators.ema50[0]?.value || 0;

  return `
SYMBOL: ${data.symbol}
TIMEFRAME: ${data.interval}
CURRENT PRICE: ${currentPrice}

RECENT PRICE DATA (OHLC):
${candleData}

TECHNICAL INDICATORS:

RSI (${INDICATOR_DEFAULTS.RSI_PERIOD}): ${rsiData}
Current RSI: ${indicators.rsi[0]?.value.toFixed(2) || "N/A"}

MACD (${INDICATOR_DEFAULTS.MACD_FAST}, ${INDICATOR_DEFAULTS.MACD_SLOW}, ${INDICATOR_DEFAULTS.MACD_SIGNAL}):
${macdData}

MOVING AVERAGES:
SMA 20: ${sma20Current.toFixed(5)} (Price ${currentPrice > sma20Current ? "above" : "below"} SMA20)
EMA 50: ${ema50Current.toFixed(5)} (Price ${currentPrice > ema50Current ? "above" : "below"} EMA50)

PRICE STATISTICS (Last 50 candles):
High of Range: ${Math.max(...recentCandles.map((c) => c.high)).toFixed(5)}
Low of Range: ${Math.min(...recentCandles.map((c) => c.low)).toFixed(5)}
Average Volume: ${(recentCandles.reduce((sum, c) => sum + c.volume, 0) / recentCandles.length).toFixed(0)}
`;
}

export function calculateRiskReward(
  direction: "BUY" | "SELL",
  entry: number,
  stopLoss: number,
  takeProfit: number
): number {
  if (direction === "BUY") {
    const risk = entry - stopLoss;
    const reward = takeProfit - entry;
    return risk > 0 ? reward / risk : 0;
  } else {
    const risk = stopLoss - entry;
    const reward = entry - takeProfit;
    return risk > 0 ? reward / risk : 0;
  }
}

export function calculatePositionSize(
  accountSize: number,
  riskPercentage: number,
  entryPrice: number,
  stopLoss: number
): number {
  const riskAmount = accountSize * (riskPercentage / 100);
  const pipsAtRisk = Math.abs(entryPrice - stopLoss);

  if (pipsAtRisk === 0) return 0;

  const positionSize = riskAmount / pipsAtRisk;

  return Math.round(positionSize * 100) / 100;
}

// getMarketFromSymbol is now imported from constants and re-exported
export { getMarketFromSymbol };

/**
 * Analyze market with custom strategy support
 */
export async function analyzeMarket(
  symbol: string,
  strategy: string = DEFAULTS.DEFAULT_STRATEGY,
  accountSize: number = DEFAULTS.ACCOUNT_SIZE,
  riskPercentage: number = DEFAULTS.RISK_PER_TRADE,
  interval: string = DEFAULTS.DEFAULT_INTERVAL,
  options?: {
    strategyId?: string;
    userId?: string;
  }
): Promise<AnalysisResult> {
  const { strategyId, userId } = options || {};

  // Get market data
  const marketData = await getMarketData(symbol, interval);

  // Get strategy context if using custom strategy
  let strategyContext: RetrievalContext | null = null;
  let customStrategyData: {
    baseStrategy: string | null;
    customPrompt: string | null;
  } | null = null;

  if (strategyId) {
    // Fetch the custom strategy details
    const userStrategy = await prisma.userStrategy.findUnique({
      where: { id: strategyId },
      select: {
        baseStrategy: true,
        customPrompt: true,
      },
    });

    if (userStrategy) {
      customStrategyData = userStrategy;
      // Retrieve the strategy content (full text, no vector search)
      strategyContext = await retrieveTradingContext(symbol, strategyId);
    }
  } else if (userId) {
    // Get all user's content
    strategyContext = await retrieveTradingContext(symbol, undefined, userId);
  }

  // Build the system prompt
  const baseStrategy = customStrategyData?.baseStrategy || strategy;
  const customPrompt = customStrategyData?.customPrompt || null;
  const formattedContext = strategyContext?.formattedContext || null;

  const strategyPrompt = buildAgentSystemPrompt(
    baseStrategy,
    customPrompt,
    formattedContext
  );

  // Format the market data
  const formattedData = formatMarketDataForPrompt(marketData);

  // Create the AI model
  const model = openrouter("google/gemini-2.0-flash-001");

  // Generate the analysis
  const { object: signal } = await generateObject({
    model,
    schema: TradeSignalSchema,
    system: strategyPrompt,
    prompt: `Analyze the following market data and determine if there is a valid trade setup.

${formattedData}

If there is a valid setup, provide specific entry, stop loss, and take profit levels.
If there is no clear setup, set hasValidSetup to false but still provide your analysis.

Be conservative with confidence scores:
- 80-100: Exceptional setup with multiple confluences
- 60-79: Good setup with solid reasoning
- 40-59: Marginal setup, proceed with caution
- 0-39: No clear setup or too risky

Always consider risk management and never suggest trades without clear invalidation levels.`,
  });

  // Calculate risk/reward
  const riskReward = calculateRiskReward(
    signal.direction,
    signal.entryPrice,
    signal.stopLoss,
    signal.takeProfit
  );

  // Calculate position size
  const positionSize = calculatePositionSize(
    accountSize,
    riskPercentage,
    signal.entryPrice,
    signal.stopLoss
  );

  const market = getMarketFromSymbol(symbol);

  return {
    symbol,
    market,
    strategy: strategyId ? "custom" : strategy,
    signal,
    riskReward: Math.round(riskReward * 100) / 100,
    positionSize,
    timestamp: new Date(),
    strategyId,
    ragContext: formattedContext || undefined,
  };
}

export async function batchAnalyze(
  symbols: string[],
  strategy: string = DEFAULTS.DEFAULT_STRATEGY,
  accountSize: number = DEFAULTS.ACCOUNT_SIZE,
  riskPercentage: number = DEFAULTS.RISK_PER_TRADE,
  options?: {
    strategyId?: string;
    userId?: string;
  }
): Promise<AnalysisResult[]> {
  const results: AnalysisResult[] = [];

  // Process sequentially to avoid rate limits
  for (const symbol of symbols) {
    try {
      const result = await analyzeMarket(
        symbol,
        strategy,
        accountSize,
        riskPercentage,
        "1h",
        options
      );
      results.push(result);
    } catch (error) {
      console.error(`Failed to analyze ${symbol}:`, error);
    }
  }

  return results;
}

export async function getHighConfidenceSignals(
  symbols: string[],
  strategy: string = DEFAULTS.DEFAULT_STRATEGY,
  minConfidence: number = DEFAULTS.HIGH_CONFIDENCE_THRESHOLD,
  accountSize: number = DEFAULTS.ACCOUNT_SIZE,
  riskPercentage: number = DEFAULTS.RISK_PER_TRADE,
  options?: {
    strategyId?: string;
    userId?: string;
  }
): Promise<AnalysisResult[]> {
  const results = await batchAnalyze(
    symbols,
    strategy,
    accountSize,
    riskPercentage,
    options
  );

  return results.filter(
    (r) => r.signal.hasValidSetup && r.signal.confidence >= minConfidence
  );
}
