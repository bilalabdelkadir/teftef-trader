import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getMarketFromSymbol } from "@/lib/ai-analysis";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { markets, assets, strategy, accountSize, riskPerTrade } = body;

    // Validate input
    if (!markets?.length || !assets?.length) {
      return NextResponse.json(
        { error: "Please select at least one market and asset" },
        { status: 400 }
      );
    }

    if (!accountSize || accountSize < 100) {
      return NextResponse.json(
        { error: "Account size must be at least $100" },
        { status: 400 }
      );
    }

    if (!riskPerTrade || riskPerTrade < 0.1 || riskPerTrade > 10) {
      return NextResponse.json(
        { error: "Risk per trade must be between 0.1% and 10%" },
        { status: 400 }
      );
    }

    // Create or update user settings
    await prisma.userSettings.upsert({
      where: { userId: session.user.id },
      update: {
        accountSize,
        riskPerTrade,
        defaultStrategy: strategy,
        onboardingDone: true,
      },
      create: {
        userId: session.user.id,
        accountSize,
        riskPerTrade,
        defaultStrategy: strategy,
        onboardingDone: true,
      },
    });

    // Delete existing watchlist items and create new ones
    await prisma.watchlist.deleteMany({
      where: { userId: session.user.id },
    });

    // Create watchlist entries
    const watchlistData = assets.map((symbol: string) => ({
      userId: session.user.id,
      symbol,
      market: getMarketFromSymbol(symbol),
    }));

    await prisma.watchlist.createMany({
      data: watchlistData,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Onboarding error:", error);
    return NextResponse.json(
      { error: "Failed to save onboarding data" },
      { status: 500 }
    );
  }
}
