import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { analyzeMarket } from "@/lib/ai-analysis";

// Calculate validUntil based on interval
function getValidityDuration(interval: string): number {
  const durations: Record<string, number> = {
    "1m": 5 * 60 * 1000, // 5 minutes
    "5m": 15 * 60 * 1000, // 15 minutes
    "15m": 30 * 60 * 1000, // 30 minutes
    "1h": 60 * 60 * 1000, // 1 hour
    "4h": 4 * 60 * 60 * 1000, // 4 hours
    "1d": 24 * 60 * 60 * 1000, // 24 hours
  };
  return durations[interval] || durations["1h"];
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { symbol, strategy, interval = "1h", strategyId } = await request.json();

    if (!symbol) {
      return NextResponse.json(
        { error: "Symbol is required" },
        { status: 400 }
      );
    }

    // If strategyId is provided, verify ownership
    if (strategyId) {
      const userStrategy = await prisma.userStrategy.findFirst({
        where: {
          id: strategyId,
          userId: session.user.id,
          isActive: true,
        },
      });

      if (!userStrategy) {
        return NextResponse.json(
          { error: "Strategy not found or inactive" },
          { status: 404 }
        );
      }
    }

    // Get user settings for account size and risk
    const settings = await prisma.userSettings.findUnique({
      where: { userId: session.user.id },
    });

    const accountSize = settings?.accountSize || 10000;
    const riskPercentage = settings?.riskPerTrade || 1;
    const analysisStrategy =
      strategy || settings?.defaultStrategy || "ai_decide";

    // Run AI analysis with custom strategy support
    const result = await analyzeMarket(
      symbol,
      analysisStrategy,
      accountSize,
      riskPercentage,
      interval,
      {
        strategyId,
        userId: session.user.id,
      }
    );

    // Save the signal to database if it's a valid setup
    if (result.signal.hasValidSetup) {
      const validityMs = getValidityDuration(interval);
      const validUntil = new Date(Date.now() + validityMs);

      await prisma.tradeSignal.create({
        data: {
          userId: session.user.id,
          symbol: result.symbol,
          market: result.market,
          direction: result.signal.direction,
          entryPrice: result.signal.entryPrice,
          stopLoss: result.signal.stopLoss,
          takeProfit: result.signal.takeProfit,
          riskReward: result.riskReward,
          positionSize: result.positionSize,
          confidence: result.signal.confidence,
          reasoning: result.signal.reasoning,
          strategy: result.strategy,
          validUntil,
          interval,
          strategyId: result.strategyId,
          ragContext: result.ragContext,
        },
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze market" },
      { status: 500 }
    );
  }
}
