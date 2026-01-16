import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/strategies/[id] - Get strategy details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const strategy = await prisma.userStrategy.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        contents: {
          include: {
            content: {
              select: {
                id: true,
                name: true,
                description: true,
                status: true,
                createdAt: true,
              },
            },
          },
        },
        _count: {
          select: { signals: true },
        },
      },
    });

    if (!strategy) {
      return NextResponse.json(
        { error: "Strategy not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(strategy);
  } catch (error) {
    console.error("Failed to fetch strategy:", error);
    return NextResponse.json(
      { error: "Failed to fetch strategy" },
      { status: 500 }
    );
  }
}

// PATCH /api/strategies/[id] - Update strategy
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { name, description, baseStrategy, customPrompt, isActive } =
      await request.json();

    // Verify ownership
    const existing = await prisma.userStrategy.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Strategy not found" },
        { status: 404 }
      );
    }

    // Check for duplicate name if name is being changed
    if (name && name !== existing.name) {
      const duplicate = await prisma.userStrategy.findUnique({
        where: {
          userId_name: {
            userId: session.user.id,
            name,
          },
        },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: "A strategy with this name already exists" },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.userStrategy.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(baseStrategy !== undefined && { baseStrategy }),
        ...(customPrompt !== undefined && { customPrompt }),
        ...(isActive !== undefined && { isActive }),
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

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update strategy:", error);
    return NextResponse.json(
      { error: "Failed to update strategy" },
      { status: 500 }
    );
  }
}

// DELETE /api/strategies/[id] - Delete strategy
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const existing = await prisma.userStrategy.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Strategy not found" },
        { status: 404 }
      );
    }

    // Delete strategy (cascade deletes links, signals keep strategyId as null)
    await prisma.userStrategy.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete strategy:", error);
    return NextResponse.json(
      { error: "Failed to delete strategy" },
      { status: 500 }
    );
  }
}
