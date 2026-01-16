/**
 * AI Provider Configuration
 *
 * Supports two providers:
 * 1. Google Gemini API (Direct) - Free tier via Google AI Studio (ai.google.dev)
 *    - 15 requests/minute, 1,500 requests/day
 *    - Set GOOGLE_GENERATIVE_AI_API_KEY in env
 *
 * 2. OpenRouter API (Fallback) - Paid API with multiple model access
 *    - Use this if Gemini quota is exhausted
 *    - Set OPENROUTER_API_KEY in env
 *
 * Configure via AI_PROVIDER env variable:
 * - "gemini" (default) - Uses direct Google Gemini API (free tier)
 * - "openrouter" - Uses OpenRouter API (paid, but more quota)
 */

import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { LanguageModel } from "ai";

// Provider types
export type AIProviderType = "gemini" | "openrouter";

// Default to Gemini (free tier) unless explicitly set to openrouter
export const AI_PROVIDER: AIProviderType =
  (process.env.AI_PROVIDER as AIProviderType) || "gemini";

// Initialize providers
const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

// Model identifiers for each provider
// Free tier models (Jan 2026): gemini-2.5-flash-lite (15 RPM, 1000 RPD), gemini-2.5-flash (10 RPM, 250 RPD)
// Note: gemini-2.0-flash is deprecated/paid-only - do NOT use for free tier
const MODEL_IDS = {
  gemini: "gemini-2.5-flash", // Free tier: 10 RPM, 250 RPD, 250K TPM
  openrouter: "google/gemini-2.0-flash-001", // OpenRouter (paid fallback)
} as const;

/**
 * Get the AI model based on configured provider
 *
 * Usage:
 * ```typescript
 * import { getAIModel } from "@/lib/ai-provider";
 *
 * const model = getAIModel();
 * const { object } = await generateObject({ model, schema, prompt });
 * ```
 *
 * To force a specific provider:
 * ```typescript
 * const model = getAIModel("openrouter"); // Use OpenRouter even if Gemini is default
 * ```
 */
export function getAIModel(provider?: AIProviderType): LanguageModel {
  const selectedProvider = provider || AI_PROVIDER;

  if (selectedProvider === "gemini") {
    // Direct Google Gemini API - FREE TIER
    // Get your API key at: https://ai.google.dev
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      console.warn(
        "GOOGLE_GENERATIVE_AI_API_KEY not set, falling back to OpenRouter"
      );
      return openrouter(MODEL_IDS.openrouter);
    }
    return google(MODEL_IDS.gemini);
  }

  // OpenRouter - Paid fallback (use if Gemini quota exhausted)
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error(
      "OPENROUTER_API_KEY not set. Please set it or use Gemini provider."
    );
  }
  return openrouter(MODEL_IDS.openrouter);
}

/**
 * Get provider info for logging/debugging
 */
export function getProviderInfo(): {
  provider: AIProviderType;
  model: string;
  isFree: boolean;
} {
  const provider = AI_PROVIDER;
  return {
    provider,
    model: MODEL_IDS[provider],
    isFree: provider === "gemini",
  };
}
