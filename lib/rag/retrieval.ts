/**
 * Simplified Strategy Retrieval
 *
 * Retrieves user's strategy content directly without vector search.
 * Just fetches the full text and includes it in the AI prompt.
 */

import { prisma } from "@/lib/db";

export interface RetrievalContext {
  formattedContext: string;
  contentNames: string[];
}

/**
 * Get strategy context by directly fetching linked content
 */
export async function retrieveTradingContext(
  symbol: string,
  strategyId?: string,
  userId?: string
): Promise<RetrievalContext> {
  let contents: { name: string; content: string }[] = [];

  if (strategyId) {
    // Get content linked to this strategy
    const strategy = await prisma.userStrategy.findUnique({
      where: { id: strategyId },
      include: {
        contents: {
          include: {
            content: {
              select: { name: true, content: true, status: true },
            },
          },
        },
      },
    });

    if (strategy) {
      contents = strategy.contents
        .filter((link) => link.content.status === "ready")
        .map((link) => ({
          name: link.content.name,
          content: link.content.content,
        }));
    }
  } else if (userId) {
    // Get all user's ready content
    const userContents = await prisma.strategyContent.findMany({
      where: { userId, status: "ready" },
      select: { name: true, content: true },
    });
    contents = userContents;
  }

  if (contents.length === 0) {
    return { formattedContext: "", contentNames: [] };
  }

  // Format all content into a single context string
  const formattedContext = contents
    .map((c) => `[${c.name}]\n${c.content}`)
    .join("\n\n---\n\n");

  return {
    formattedContext,
    contentNames: contents.map((c) => c.name),
  };
}
