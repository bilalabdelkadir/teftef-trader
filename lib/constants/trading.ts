/**
 * Trading-related constants
 * Markets, assets, and strategies used across the application
 */

import {
  TrendingUp,
  Bitcoin,
  BarChart3,
  Brain,
  Target,
  Zap,
  type LucideIcon
} from "lucide-react";

export interface Market {
  id: string;
  name: string;
  icon: LucideIcon;
  description: string;
}

export interface Asset {
  symbol: string;
  name: string;
}

export interface Strategy {
  id: string;
  name: string;
  description: string;
  icon?: LucideIcon;
}

// Market definitions
export const MARKETS: Market[] = [
  {
    id: "forex",
    name: "Forex",
    icon: TrendingUp,
    description: "Major currency pairs",
  },
  {
    id: "crypto",
    name: "Crypto",
    icon: Bitcoin,
    description: "Top cryptocurrencies",
  },
  {
    id: "stocks",
    name: "Stocks",
    icon: BarChart3,
    description: "US equities",
  },
];

// Asset lists by market type
export const FOREX_SYMBOLS = [
  "EUR/USD",
  "GBP/USD",
  "USD/JPY",
  "AUD/USD",
  "USD/CAD",
  "NZD/USD",
] as const;

export const CRYPTO_SYMBOLS = [
  "BTC/USD",
  "ETH/USD",
  "SOL/USD",
  "XRP/USD",
] as const;

export const STOCK_SYMBOLS = [
  "AAPL",
  "TSLA",
  "GOOGL",
  "MSFT",
  "AMZN",
  "NVDA",
] as const;

// Detailed asset information with names
export const ASSETS: Record<string, Asset[]> = {
  forex: [
    { symbol: "EUR/USD", name: "Euro / US Dollar" },
    { symbol: "GBP/USD", name: "British Pound / US Dollar" },
    { symbol: "USD/JPY", name: "US Dollar / Japanese Yen" },
    { symbol: "AUD/USD", name: "Australian Dollar / US Dollar" },
    { symbol: "USD/CAD", name: "US Dollar / Canadian Dollar" },
    { symbol: "NZD/USD", name: "New Zealand Dollar / US Dollar" },
  ],
  crypto: [
    { symbol: "BTC/USD", name: "Bitcoin" },
    { symbol: "ETH/USD", name: "Ethereum" },
    { symbol: "SOL/USD", name: "Solana" },
    { symbol: "XRP/USD", name: "Ripple" },
  ],
  stocks: [
    { symbol: "AAPL", name: "Apple Inc." },
    { symbol: "TSLA", name: "Tesla Inc." },
    { symbol: "GOOGL", name: "Alphabet Inc." },
    { symbol: "MSFT", name: "Microsoft Corp." },
    { symbol: "AMZN", name: "Amazon.com Inc." },
    { symbol: "NVDA", name: "NVIDIA Corp." },
  ],
};

// Simple symbol list by market (for settings page)
export const AVAILABLE_ASSETS: Record<string, string[]> = {
  forex: [...FOREX_SYMBOLS],
  crypto: [...CRYPTO_SYMBOLS],
  stocks: [...STOCK_SYMBOLS],
};

// Strategy definitions with icons
export const STRATEGIES: Strategy[] = [
  {
    id: "ai_decide",
    name: "Let AI Decide",
    description: "AI chooses the best approach for each setup",
    icon: Zap,
  },
  {
    id: "ict_smc",
    name: "ICT / SMC",
    description: "Smart Money Concepts, Order Blocks, Liquidity",
    icon: Brain,
  },
  {
    id: "technical",
    name: "Technical Analysis",
    description: "Chart patterns, Support/Resistance, Trends",
    icon: BarChart3,
  },
  {
    id: "indicators",
    name: "Indicator-Based",
    description: "RSI, MACD, Moving Averages",
    icon: Target,
  },
];

// Simple strategy list (for settings page)
export const BASE_STRATEGIES = STRATEGIES.map(({ id, name, description }) => ({
  id,
  name,
  desc: description,
}));

// Market type detection
export type MarketType = "forex" | "crypto" | "stocks";

export function getMarketFromSymbol(symbol: string): MarketType {
  if (FOREX_SYMBOLS.includes(symbol as typeof FOREX_SYMBOLS[number])) {
    return "forex";
  }
  if (CRYPTO_SYMBOLS.includes(symbol as typeof CRYPTO_SYMBOLS[number])) {
    return "crypto";
  }
  return "stocks";
}

export function getSymbolsByMarket(market: string): string[] {
  switch (market.toLowerCase()) {
    case "forex":
      return [...FOREX_SYMBOLS];
    case "crypto":
      return [...CRYPTO_SYMBOLS];
    case "stocks":
      return [...STOCK_SYMBOLS];
    default:
      return [];
  }
}
