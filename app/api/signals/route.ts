import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const market = searchParams.get("market");
    const status = searchParams.get("status");
    const timeFilter = searchParams.get("timeFilter");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: Record<string, unknown> = {
      userId: session.user.id,
    };

    if (market) {
      where.market = market;
    }

    if (status) {
      where.status = status;
    }

    // Time-based filtering
    if (timeFilter === "today") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      where.createdAt = { gte: today };
    } else if (timeFilter === "yesterday") {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      where.createdAt = { gte: yesterday, lt: today };
    } else if (timeFilter === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      where.createdAt = { gte: weekAgo };
    }

    const signals = await prisma.tradeSignal.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json(signals);
  } catch (error) {
    console.error("Signals fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch signals" },
      { status: 500 }
    );
  }
}
