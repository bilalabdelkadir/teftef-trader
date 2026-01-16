/**
 * Default values and limits for the application
 */

// Account and risk defaults
export const DEFAULTS = {
  ACCOUNT_SIZE: 10000,
  RISK_PER_TRADE: 1, // percentage
  DEFAULT_STRATEGY: "ai_decide",
  SIGNALS_LIMIT: 20,
  HIGH_CONFIDENCE_THRESHOLD: 70,
  TIME_SERIES_OUTPUT_SIZE: 100,
  INDICATOR_OUTPUT_SIZE: 30,
  DEFAULT_INTERVAL: "1h",
} as const;

// Validation limits
export const LIMITS = {
  MIN_ACCOUNT_SIZE: 100,
  MAX_ACCOUNT_SIZE: 100000000, // 100 million
  MIN_RISK_PER_TRADE: 0.1,
  MAX_RISK_PER_TRADE: 10,
  MIN_PASSWORD_LENGTH: 8,
  MIN_NAME_LENGTH: 2,
} as const;

// Confidence thresholds for UI display
export const CONFIDENCE_THRESHOLDS = {
  HIGH: 80,
  MEDIUM: 60,
  LOW: 0,
} as const;

export function getConfidenceLevel(confidence: number): "high" | "medium" | "low" {
  if (confidence >= CONFIDENCE_THRESHOLDS.HIGH) return "high";
  if (confidence >= CONFIDENCE_THRESHOLDS.MEDIUM) return "medium";
  return "low";
}

export function getConfidenceColor(confidence: number): string {
  const level = getConfidenceLevel(confidence);
  switch (level) {
    case "high":
      return "text-green-500";
    case "medium":
      return "text-yellow-500";
    case "low":
      return "text-red-500";
  }
}

export function getConfidenceLabel(confidence: number): string {
  const level = getConfidenceLevel(confidence);
  switch (level) {
    case "high":
      return "High";
    case "medium":
      return "Medium";
    case "low":
      return "Low";
  }
}
