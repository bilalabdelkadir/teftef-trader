import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const signal = await prisma.tradeSignal.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!signal) {
      return NextResponse.json({ error: "Signal not found" }, { status: 404 });
    }

    // Compute staleness
    const now = new Date();
    const isStale = signal.validUntil ? now > signal.validUntil : false;
    const minutesOld = Math.floor(
      (now.getTime() - signal.createdAt.getTime()) / (1000 * 60)
    );

    return NextResponse.json({
      ...signal,
      isStale,
      minutesOld,
    });
  } catch (error) {
    console.error("Signal fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch signal" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { status } = await request.json();

    // Check if the signal belongs to the user
    const signal = await prisma.tradeSignal.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!signal) {
      return NextResponse.json({ error: "Signal not found" }, { status: 404 });
    }

    const updated = await prisma.tradeSignal.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Signal update error:", error);
    return NextResponse.json(
      { error: "Failed to update signal" },
      { status: 500 }
    );
  }
}
