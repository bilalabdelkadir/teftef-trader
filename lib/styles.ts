import { cn } from "@/lib/utils";

/**
 * Reusable style utilities for consistent UI patterns
 */

// Card styles
export const cardStyles = {
  base: "rounded-lg border bg-card",
  interactive: "transition-colors hover:border-muted-foreground",
  selected: "border-primary bg-primary/5",
  muted: "border-muted",
};

// Button variant styles for selection states
export const buttonVariants = {
  selected: "border-primary bg-primary/5",
  unselected: "border-border hover:border-muted-foreground",
};

// Selection button styles (commonly used in onboarding, settings)
export function getSelectionStyles(isSelected: boolean) {
  return cn(
    "p-3 rounded-lg border text-sm text-left transition-colors",
    isSelected ? buttonVariants.selected : buttonVariants.unselected
  );
}

// Large selection button (for markets, strategies)
export function getLargeSelectionStyles(isSelected: boolean) {
  return cn(
    "flex items-center gap-4 p-4 rounded-lg border-2 transition-colors text-left",
    isSelected ? buttonVariants.selected : buttonVariants.unselected
  );
}

// Confidence color utilities
export function getConfidenceStyles(confidence: number): {
  textColor: string;
  bgColor: string;
} {
  if (confidence >= 80) {
    return { textColor: "text-green-500", bgColor: "bg-green-500/10" };
  }
  if (confidence >= 60) {
    return { textColor: "text-yellow-500", bgColor: "bg-yellow-500/10" };
  }
  return { textColor: "text-red-500", bgColor: "bg-red-500/10" };
}

// Direction styles (BUY/SELL)
export function getDirectionStyles(direction: "BUY" | "SELL" | string): {
  textColor: string;
  bgColor: string;
  borderColor: string;
} {
  const isBuy = direction === "BUY";
  return {
    textColor: isBuy ? "text-green-500" : "text-red-500",
    bgColor: isBuy ? "bg-green-500/10" : "bg-red-500/10",
    borderColor: isBuy ? "border-green-500/50" : "border-red-500/50",
  };
}

// Signal status styles
export function getSignalStatusStyles(status: string): string {
  switch (status) {
    case "new":
      return "border-primary/50 bg-primary/5";
    case "caution":
      return "border-yellow-500/50 bg-yellow-500/5";
    case "viewed":
      return "";
    default:
      return "";
  }
}

// Tab styles
export function getTabStyles(isActive: boolean): string {
  return cn(
    "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors",
    isActive
      ? "bg-background shadow-sm"
      : "text-muted-foreground hover:text-foreground"
  );
}

// Filter button styles
export function getFilterButtonStyles(isActive: boolean): string {
  return cn(
    "px-3 py-1.5 text-sm capitalize transition-colors",
    isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"
  );
}

// Age indicator dot styles
export function getAgeDotStyles(
  ageCategory: "today" | "yesterday" | "older"
): string {
  switch (ageCategory) {
    case "today":
      return "bg-green-500";
    case "yesterday":
      return "bg-yellow-500";
    default:
      return "bg-gray-400";
  }
}

// Price display formatting
export function formatPrice(price: number, isStock: boolean = false): string {
  return price.toFixed(isStock ? 2 : 5);
}

// Common layout classes
export const layoutClasses = {
  pageContainer: "min-h-screen bg-background",
  centeredContent: "flex items-center justify-center min-h-screen",
  mainContent: "container mx-auto px-4 py-6 space-y-6",
  narrowContent: "container mx-auto px-4 py-6 space-y-6 max-w-2xl",
  mediumContent: "container mx-auto px-4 py-6 space-y-6 max-w-3xl",
};

// Loading state styles
export const loadingStyles = {
  pulse: "animate-pulse text-muted-foreground",
  spinner: "animate-spin",
};
