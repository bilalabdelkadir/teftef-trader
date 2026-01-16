import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await prisma.userSettings.findUnique({
      where: { userId: session.user.id },
    });

    if (!settings) {
      return NextResponse.json({
        accountSize: 10000,
        riskPerTrade: 1,
        defaultStrategy: "ai_decide",
        emailAlerts: true,
        onboardingDone: false,
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Settings fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updates = await request.json();

    // Validate numeric fields
    if (updates.accountSize !== undefined && updates.accountSize < 100) {
      return NextResponse.json(
        { error: "Account size must be at least $100" },
        { status: 400 }
      );
    }

    if (updates.riskPerTrade !== undefined) {
      if (updates.riskPerTrade < 0.1 || updates.riskPerTrade > 10) {
        return NextResponse.json(
          { error: "Risk per trade must be between 0.1% and 10%" },
          { status: 400 }
        );
      }
    }

    const settings = await prisma.userSettings.upsert({
      where: { userId: session.user.id },
      update: updates,
      create: {
        userId: session.user.id,
        ...updates,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Settings update error:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
