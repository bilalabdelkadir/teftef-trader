/**
 * Technical indicator default values
 */

export const INDICATOR_DEFAULTS = {
  // RSI
  RSI_PERIOD: 14,
  RSI_OVERBOUGHT: 70,
  RSI_OVERSOLD: 30,

  // MACD
  MACD_FAST: 12,
  MACD_SLOW: 26,
  MACD_SIGNAL: 9,

  // Bollinger Bands
  BOLLINGER_PERIOD: 20,
  BOLLINGER_STD_DEV: 2,

  // Moving Averages
  SMA_PERIOD: 20,
  EMA_SHORT_PERIOD: 20,
  EMA_LONG_PERIOD: 50,

  // ATR
  ATR_PERIOD: 14,

  // Stochastic
  STOCHASTIC_K: 14,
  STOCHASTIC_D: 3,
} as const;

// Timeframe definitions
export const TIMEFRAMES = [
  { id: "1m", name: "1 Minute", minutes: 1 },
  { id: "5m", name: "5 Minutes", minutes: 5 },
  { id: "15m", name: "15 Minutes", minutes: 15 },
  { id: "30m", name: "30 Minutes", minutes: 30 },
  { id: "1h", name: "1 Hour", minutes: 60 },
  { id: "4h", name: "4 Hours", minutes: 240 },
  { id: "1day", name: "Daily", minutes: 1440 },
] as const;

export type TimeframeId = typeof TIMEFRAMES[number]["id"];
