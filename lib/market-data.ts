/**
 * Unified Market Data Router
 *
 * Routes requests to the appropriate provider based on asset type:
 * - Stocks → Finnhub (free quotes, candles, extras)
 * - Forex → Twelve Data (free tier supports forex + indicators)
 * - Crypto → Twelve Data (free tier supports crypto + indicators)
 */

import * as finnhub from "./finnhub";
import * as twelvedata from "./twelve-data";
import {
  FOREX_SYMBOLS,
  CRYPTO_SYMBOLS,
  STOCK_SYMBOLS,
  getSymbolsByMarket,
} from "./constants";

// Re-export types (they're identical between providers)
export type {
  PriceData,
  OHLCVData,
  TimeSeriesResponse,
  TechnicalIndicator,
  MACDData,
} from "./finnhub";

// Re-export symbol lists for backward compatibility
export { FOREX_SYMBOLS, CRYPTO_SYMBOLS, STOCK_SYMBOLS, getSymbolsByMarket };

type Provider = "finnhub" | "twelvedata";

/**
 * Detect asset type and return the appropriate provider
 */
function getProvider(symbol: string): Provider {
  // Normalize symbol for comparison
  const normalizedSymbol = symbol.toUpperCase();

  // Check if it's a known stock symbol
  if ((STOCK_SYMBOLS as readonly string[]).includes(normalizedSymbol)) {
    return "finnhub";
  }

  // Check for forex patterns (contains /)
  if ((FOREX_SYMBOLS as readonly string[]).includes(normalizedSymbol)) {
    return "twelvedata";
  }

  // Check for crypto patterns
  if ((CRYPTO_SYMBOLS as readonly string[]).includes(normalizedSymbol)) {
    return "twelvedata";
  }

  // Default: if no slash, assume stock (Finnhub), otherwise Twelve Data
  if (!symbol.includes("/")) {
    return "finnhub";
  }

  return "twelvedata";
}

/**
 * Get current price for a symbol
 */
export async function getPrice(
  symbol: string
): Promise<finnhub.PriceData> {
  const provider = getProvider(symbol);
  console.log(`[market-data] getPrice(${symbol}) → ${provider}`);

  if (provider === "finnhub") {
    return finnhub.getPrice(symbol);
  }
  return twelvedata.getPrice(symbol);
}

/**
 * Get prices for multiple symbols
 */
export async function getPrices(
  symbols: string[]
): Promise<Record<string, finnhub.PriceData>> {
  const result: Record<string, finnhub.PriceData> = {};

  // Group symbols by provider
  const finnhubSymbols: string[] = [];
  const twelvedataSymbols: string[] = [];

  for (const symbol of symbols) {
    if (getProvider(symbol) === "finnhub") {
      finnhubSymbols.push(symbol);
    } else {
      twelvedataSymbols.push(symbol);
    }
  }

  // Fetch from both providers in parallel
  const [finnhubPrices, twelvedataPrices] = await Promise.all([
    finnhubSymbols.length > 0 ? finnhub.getPrices(finnhubSymbols) : {},
    twelvedataSymbols.length > 0 ? twelvedata.getPrices(twelvedataSymbols) : {},
  ]);

  // Merge results
  Object.assign(result, finnhubPrices, twelvedataPrices);

  return result;
}

/**
 * Get time series data for a symbol
 */
export async function getTimeSeries(
  symbol: string,
  interval: string = "1h",
  outputSize: number = 100
): Promise<finnhub.TimeSeriesResponse> {
  const provider = getProvider(symbol);
  console.log(`[market-data] getTimeSeries(${symbol}) → ${provider}`);

  if (provider === "finnhub") {
    return finnhub.getTimeSeries(symbol, interval, outputSize);
  }
  return twelvedata.getTimeSeries(symbol, interval, outputSize);
}

/**
 * Get RSI indicator
 */
export async function getRSI(
  symbol: string,
  interval: string = "1h",
  timePeriod: number = 14,
  outputSize: number = 30
): Promise<finnhub.TechnicalIndicator[]> {
  const provider = getProvider(symbol);
  console.log(`[market-data] getRSI(${symbol}) → ${provider}`);

  if (provider === "finnhub") {
    return finnhub.getRSI(symbol, interval, timePeriod, outputSize);
  }
  return twelvedata.getRSI(symbol, interval, timePeriod, outputSize);
}

/**
 * Get MACD indicator
 */
export async function getMACD(
  symbol: string,
  interval: string = "1h",
  outputSize: number = 30
): Promise<finnhub.MACDData[]> {
  const provider = getProvider(symbol);
  console.log(`[market-data] getMACD(${symbol}) → ${provider}`);

  if (provider === "finnhub") {
    return finnhub.getMACD(symbol, interval, outputSize);
  }
  return twelvedata.getMACD(symbol, interval, outputSize);
}

/**
 * Get SMA indicator
 */
export async function getSMA(
  symbol: string,
  interval: string = "1h",
  timePeriod: number = 20,
  outputSize: number = 30
): Promise<finnhub.TechnicalIndicator[]> {
  const provider = getProvider(symbol);
  console.log(`[market-data] getSMA(${symbol}) → ${provider}`);

  if (provider === "finnhub") {
    return finnhub.getSMA(symbol, interval, timePeriod, outputSize);
  }
  return twelvedata.getSMA(symbol, interval, timePeriod, outputSize);
}

/**
 * Get EMA indicator
 */
export async function getEMA(
  symbol: string,
  interval: string = "1h",
  timePeriod: number = 20,
  outputSize: number = 30
): Promise<finnhub.TechnicalIndicator[]> {
  const provider = getProvider(symbol);
  console.log(`[market-data] getEMA(${symbol}) → ${provider}`);

  if (provider === "finnhub") {
    return finnhub.getEMA(symbol, interval, timePeriod, outputSize);
  }
  return twelvedata.getEMA(symbol, interval, timePeriod, outputSize);
}

/**
 * Get comprehensive market data for analysis
 */
export async function getMarketData(symbol: string, interval: string = "1h") {
  const provider = getProvider(symbol);
  console.log(`[market-data] getMarketData(${symbol}) → ${provider}`);

  if (provider === "finnhub") {
    return finnhub.getMarketData(symbol, interval);
  }
  return twelvedata.getMarketData(symbol, interval);
}

// getSymbolsByMarket is now imported from constants and re-exported above

/**
 * Get the provider being used for a symbol (useful for debugging)
 */
export function getProviderForSymbol(symbol: string): Provider {
  return getProvider(symbol);
}
