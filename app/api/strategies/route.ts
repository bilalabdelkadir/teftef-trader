import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/strategies - List user's custom strategies
export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const strategies = await prisma.userStrategy.findMany({
      where: { userId: session.user.id },
      include: {
        _count: {
          select: { contents: true, signals: true },
        },
        contents: {
          include: {
            content: {
              select: { id: true, name: true, status: true, content: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(strategies);
  } catch (error) {
    console.error("Failed to fetch strategies:", error);
    return NextResponse.json(
      { error: "Failed to fetch strategies" },
      { status: 500 }
    );
  }
}

// POST /api/strategies - Create new custom strategy
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description, baseStrategy, customPrompt, contentIds } =
      await request.json();

    if (!name) {
      return NextResponse.json(
        { error: "Strategy name is required" },
        { status: 400 }
      );
    }

    // Check for duplicate name
    const existing = await prisma.userStrategy.findUnique({
      where: {
        userId_name: {
          userId: session.user.id,
          name,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A strategy with this name already exists" },
        { status: 409 }
      );
    }

    // Create strategy with optional content links
    const strategy = await prisma.userStrategy.create({
      data: {
        userId: session.user.id,
        name,
        description,
        baseStrategy,
        customPrompt,
        ...(contentIds?.length > 0 && {
          contents: {
            create: contentIds.map((contentId: string) => ({
              contentId,
            })),
          },
        }),
      },
      include: {
        contents: {
          include: {
            content: {
              select: { id: true, name: true, status: true },
            },
          },
        },
      },
    });

    return NextResponse.json(strategy, { status: 201 });
  } catch (error) {
    console.error("Failed to create strategy:", error);
    return NextResponse.json(
      { error: "Failed to create strategy" },
      { status: 500 }
    );
  }
}
