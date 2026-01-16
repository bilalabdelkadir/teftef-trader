/**
 * Error handling utilities
 */

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const ERROR_CODES = {
  UNAUTHORIZED: "UNAUTHORIZED",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION: "VALIDATION",
  NETWORK: "NETWORK",
  SERVER: "SERVER",
  ANALYSIS_FAILED: "ANALYSIS_FAILED",
  RATE_LIMITED: "RATE_LIMITED",
} as const;

export const ERROR_MESSAGES: Record<string, string> = {
  [ERROR_CODES.UNAUTHORIZED]: "Please log in to continue",
  [ERROR_CODES.NOT_FOUND]: "The requested resource was not found",
  [ERROR_CODES.VALIDATION]: "Please check your input and try again",
  [ERROR_CODES.NETWORK]: "Unable to connect. Please check your internet connection",
  [ERROR_CODES.SERVER]: "Something went wrong. Please try again later",
  [ERROR_CODES.ANALYSIS_FAILED]: "Failed to analyze market. Please try again",
  [ERROR_CODES.RATE_LIMITED]: "Too many requests. Please wait a moment and try again",
};

/**
 * Get a user-friendly error message from any error type
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof Error) {
    // Check for common network errors
    if (error.message.includes("fetch")) {
      return ERROR_MESSAGES[ERROR_CODES.NETWORK];
    }
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return ERROR_MESSAGES[ERROR_CODES.SERVER];
}

/**
 * Create standardized API error responses
 */
export function createErrorResponse(
  code: keyof typeof ERROR_CODES,
  customMessage?: string
) {
  const message = customMessage || ERROR_MESSAGES[code];
  const statusCode = getStatusCodeForError(code);

  return {
    error: message,
    code,
    statusCode,
  };
}

function getStatusCodeForError(code: string): number {
  switch (code) {
    case ERROR_CODES.UNAUTHORIZED:
      return 401;
    case ERROR_CODES.NOT_FOUND:
      return 404;
    case ERROR_CODES.VALIDATION:
      return 400;
    case ERROR_CODES.RATE_LIMITED:
      return 429;
    default:
      return 500;
  }
}

/**
 * Check if an error is a specific type
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Wrap an async function with error handling
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  fallbackMessage: string = ERROR_MESSAGES[ERROR_CODES.SERVER]
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(fallbackMessage, ERROR_CODES.SERVER, 500);
  }
}
