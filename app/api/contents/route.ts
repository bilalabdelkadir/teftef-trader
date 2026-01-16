import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/contents - List user's content
export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contents = await prisma.strategyContent.findMany({
      where: { userId: session.user.id },
      include: {
        _count: {
          select: { strategies: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(contents);
  } catch (error) {
    console.error("Failed to fetch contents:", error);
    return NextResponse.json(
      { error: "Failed to fetch contents" },
      { status: 500 }
    );
  }
}

// POST /api/contents - Create new content
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, content, description } = await request.json();

    if (!name || !content) {
      return NextResponse.json(
        { error: "Name and content are required" },
        { status: 400 }
      );
    }

    // Create the content record - mark as ready immediately (no processing needed)
    const strategyContent = await prisma.strategyContent.create({
      data: {
        userId: session.user.id,
        name,
        content,
        description,
        status: "ready", // No vector processing needed
      },
    });

    return NextResponse.json(strategyContent, { status: 201 });
  } catch (error) {
    console.error("Failed to create content:", error);
    return NextResponse.json(
      { error: "Failed to create content" },
      { status: 500 }
    );
  }
}
