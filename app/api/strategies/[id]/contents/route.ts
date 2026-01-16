import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

type RouteParams = { params: Promise<{ id: string }> };

// POST /api/strategies/[id]/contents - Link content to strategy
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: strategyId } = await params;
    const { contentId } = await request.json();

    if (!contentId) {
      return NextResponse.json(
        { error: "Content ID is required" },
        { status: 400 }
      );
    }

    // Verify strategy ownership
    const strategy = await prisma.userStrategy.findFirst({
      where: {
        id: strategyId,
        userId: session.user.id,
      },
    });

    if (!strategy) {
      return NextResponse.json(
        { error: "Strategy not found" },
        { status: 404 }
      );
    }

    // Verify content ownership
    const content = await prisma.strategyContent.findFirst({
      where: {
        id: contentId,
        userId: session.user.id,
      },
    });

    if (!content) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    // Check if link already exists
    const existingLink = await prisma.strategyContentLink.findUnique({
      where: {
        strategyId_contentId: {
          strategyId,
          contentId,
        },
      },
    });

    if (existingLink) {
      return NextResponse.json(
        { error: "Content is already linked to this strategy" },
        { status: 409 }
      );
    }

    // Create the link
    const link = await prisma.strategyContentLink.create({
      data: {
        strategyId,
        contentId,
      },
      include: {
        content: {
          select: { id: true, name: true, status: true },
        },
      },
    });

    return NextResponse.json(link, { status: 201 });
  } catch (error) {
    console.error("Failed to link content:", error);
    return NextResponse.json(
      { error: "Failed to link content" },
      { status: 500 }
    );
  }
}

// DELETE /api/strategies/[id]/contents - Unlink content from strategy
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: strategyId } = await params;
    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get("contentId");

    if (!contentId) {
      return NextResponse.json(
        { error: "Content ID is required" },
        { status: 400 }
      );
    }

    // Verify strategy ownership
    const strategy = await prisma.userStrategy.findFirst({
      where: {
        id: strategyId,
        userId: session.user.id,
      },
    });

    if (!strategy) {
      return NextResponse.json(
        { error: "Strategy not found" },
        { status: 404 }
      );
    }

    // Delete the link
    await prisma.strategyContentLink.deleteMany({
      where: {
        strategyId,
        contentId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to unlink content:", error);
    return NextResponse.json(
      { error: "Failed to unlink content" },
      { status: 500 }
    );
  }
}
