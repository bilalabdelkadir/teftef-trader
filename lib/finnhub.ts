import { getCache, setCache, generateCacheKey, CACHE_TTL } from "./cache";
import {
  calculateRSI,
  calculateMACD,
  calculateSMA,
  calculateEMA,
} from "./indicators";

const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";
const API_KEY = process.env.FINNHUB_API_KEY;

export interface PriceData {
  symbol: string;
  price: number;
  timestamp: number;
}

export interface OHLCVData {
  datetime: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TimeSeriesResponse {
  meta: {
    symbol: string;
    interval: string;
    currency: string;
    exchange: string;
    type: string;
  };
  values: OHLCVData[];
}

export interface TechnicalIndicator {
  datetime: string;
  value: number;
}

export interface MACDData {
  datetime: string;
  macd: number;
  macd_signal: number;
  macd_hist: number;
}

// Finnhub candle response format
interface FinnhubCandleResponse {
  o: number[]; // Open prices
  h: number[]; // High prices
  l: number[]; // Low prices
  c: number[]; // Close prices
  v: number[]; // Volumes
  t: number[]; // Timestamps (UNIX)
  s: string; // Status ("ok" or "no_data")
}

// Finnhub quote response format
interface FinnhubQuoteResponse {
  c: number; // Current price
  d: number; // Change
  dp: number; // Percent change
  h: number; // High price of the day
  l: number; // Low price of the day
  o: number; // Open price of the day
  pc: number; // Previous close price
  t: number; // Timestamp
}

class FinnhubError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number
  ) {
    super(message);
    this.name = "FinnhubError";
  }
}

// Symbol type detection
function getSymbolType(symbol: string): "forex" | "crypto" | "stock" {
  const forexPairs = [
    "EUR/USD",
    "GBP/USD",
    "USD/JPY",
    "AUD/USD",
    "USD/CAD",
    "NZD/USD",
  ];
  const cryptoPairs = ["BTC/USD", "ETH/USD", "SOL/USD", "XRP/USD"];

  if (forexPairs.includes(symbol)) return "forex";
  if (cryptoPairs.includes(symbol)) return "crypto";
  return "stock";
}

// Convert symbol to Finnhub format
function toFinnhubSymbol(symbol: string): string {
  const type = getSymbolType(symbol);

  if (type === "forex") {
    // EUR/USD -> OANDA:EUR_USD
    return `OANDA:${symbol.replace("/", "_")}`;
  }

  if (type === "crypto") {
    // BTC/USD -> BINANCE:BTCUSDT
    const [base] = symbol.split("/");
    return `BINANCE:${base}USDT`;
  }

  // Stock symbols stay the same
  return symbol;
}

// Convert interval to Finnhub format
function toFinnhubInterval(interval: string): string {
  const intervalMap: Record<string, string> = {
    "1min": "1",
    "5min": "5",
    "15min": "15",
    "30min": "30",
    "1h": "60",
    "4h": "60", // Will need to aggregate
    "1day": "D",
    "1week": "W",
    "1month": "M",
  };
  return intervalMap[interval] || "60";
}

// Format symbol for display (from Finnhub format back to standard)
function formatSymbol(symbol: string): string {
  // Convert symbols like BTC/USD to BTC/USD (already correct format)
  // Convert symbols like EURUSD to EUR/USD for forex
  if (symbol.includes("/")) return symbol;
  if (symbol.length === 6 && !symbol.includes("/")) {
    // Likely forex pair like EURUSD
    return `${symbol.slice(0, 3)}/${symbol.slice(3)}`;
  }
  return symbol;
}

// Convert UNIX timestamp to ISO string
function unixToISO(timestamp: number): string {
  return new Date(timestamp * 1000).toISOString().slice(0, 19).replace("T", " ");
}

async function fetchFinnhub<T>(
  endpoint: string,
  params: Record<string, string>,
  cacheKey?: string,
  cacheTTL?: number
): Promise<T> {
  // Check cache first if cacheKey provided
  if (cacheKey) {
    const cached = await getCache<T>(cacheKey);
    if (cached) {
      console.log(`Cache hit for ${cacheKey}`);
      return cached;
    }
  }

  if (!API_KEY) {
    throw new FinnhubError("FINNHUB_API_KEY is not configured");
  }

  const url = new URL(`${FINNHUB_BASE_URL}${endpoint}`);
  url.searchParams.set("token", API_KEY);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url.toString(), {
    next: { revalidate: 60 },
  });

  // Handle rate limit
  if (response.status === 429) {
    if (cacheKey) {
      const cached = await getCache<T>(cacheKey);
      if (cached) {
        console.log(`Rate limited, returning stale cache for ${cacheKey}`);
        return cached;
      }
    }
    throw new FinnhubError(
      "Rate limit exceeded. Please wait before making more requests.",
      "RATE_LIMIT",
      429
    );
  }

  if (!response.ok) {
    throw new FinnhubError(
      `API request failed: ${response.statusText}`,
      undefined,
      response.status
    );
  }

  const data = await response.json();

  // Cache the result
  if (cacheKey && cacheTTL) {
    await setCache(cacheKey, data, cacheTTL);
    console.log(`Cached ${cacheKey} for ${cacheTTL}s`);
  }

  return data;
}

// Transform Finnhub candle response to our format
function transformCandleResponse(
  data: FinnhubCandleResponse,
  symbol: string,
  interval: string
): TimeSeriesResponse {
  if (data.s !== "ok" || !data.t || data.t.length === 0) {
    return {
      meta: {
        symbol,
        interval,
        currency: "USD",
        exchange: "",
        type: getSymbolType(symbol),
      },
      values: [],
    };
  }

  const values: OHLCVData[] = [];

  // Finnhub returns oldest first, we want newest first
  for (let i = data.t.length - 1; i >= 0; i--) {
    values.push({
      datetime: unixToISO(data.t[i]),
      open: data.o[i],
      high: data.h[i],
      low: data.l[i],
      close: data.c[i],
      volume: data.v[i] || 0,
    });
  }

  return {
    meta: {
      symbol,
      interval,
      currency: "USD",
      exchange: getSymbolType(symbol) === "crypto" ? "BINANCE" : "OANDA",
      type: getSymbolType(symbol),
    },
    values,
  };
}

export async function getPrice(symbol: string): Promise<PriceData> {
  const formattedSymbol = formatSymbol(symbol);
  const cacheKey = generateCacheKey("price", formattedSymbol);
  const finnhubSymbol = toFinnhubSymbol(formattedSymbol);
  const symbolType = getSymbolType(formattedSymbol);

  // For stocks, use quote endpoint
  if (symbolType === "stock") {
    const data = await fetchFinnhub<FinnhubQuoteResponse>(
      "/quote",
      { symbol: finnhubSymbol },
      cacheKey,
      CACHE_TTL.PRICE
    );

    return {
      symbol: formattedSymbol,
      price: data.c,
      timestamp: Date.now(),
    };
  }

  // For forex and crypto, get latest candle
  const now = Math.floor(Date.now() / 1000);
  const from = now - 3600; // Last hour

  const endpoint = symbolType === "forex" ? "/forex/candle" : "/crypto/candle";

  const data = await fetchFinnhub<FinnhubCandleResponse>(
    endpoint,
    {
      symbol: finnhubSymbol,
      resolution: "1",
      from: from.toString(),
      to: now.toString(),
    },
    cacheKey,
    CACHE_TTL.PRICE
  );

  if (data.s !== "ok" || !data.c || data.c.length === 0) {
    throw new FinnhubError(`No price data available for ${symbol}`);
  }

  return {
    symbol: formattedSymbol,
    price: data.c[data.c.length - 1], // Latest close price
    timestamp: Date.now(),
  };
}

export async function getPrices(
  symbols: string[]
): Promise<Record<string, PriceData>> {
  const result: Record<string, PriceData> = {};

  // Finnhub doesn't support batch prices, fetch individually
  // Use Promise.allSettled to handle partial failures
  const promises = symbols.map(async (symbol) => {
    try {
      const priceData = await getPrice(symbol);
      return { symbol: formatSymbol(symbol), priceData };
    } catch (error) {
      console.error(`Failed to get price for ${symbol}:`, error);
      return null;
    }
  });

  const results = await Promise.allSettled(promises);

  for (const res of results) {
    if (res.status === "fulfilled" && res.value) {
      result[res.value.symbol] = res.value.priceData;
    }
  }

  return result;
}

export async function getTimeSeries(
  symbol: string,
  interval: string = "1h",
  outputSize: number = 100
): Promise<TimeSeriesResponse> {
  const formattedSymbol = formatSymbol(symbol);
  const cacheKey = generateCacheKey(
    "time_series",
    formattedSymbol,
    interval,
    outputSize
  );
  const finnhubSymbol = toFinnhubSymbol(formattedSymbol);
  const finnhubInterval = toFinnhubInterval(interval);
  const symbolType = getSymbolType(formattedSymbol);

  // Check cache first
  const cached = await getCache<TimeSeriesResponse>(cacheKey);
  if (cached) {
    console.log(`Cache hit for ${cacheKey}`);
    return cached;
  }

  // Calculate time range based on interval and output size
  const now = Math.floor(Date.now() / 1000);
  let secondsPerCandle: number;

  switch (finnhubInterval) {
    case "1":
      secondsPerCandle = 60;
      break;
    case "5":
      secondsPerCandle = 300;
      break;
    case "15":
      secondsPerCandle = 900;
      break;
    case "30":
      secondsPerCandle = 1800;
      break;
    case "60":
      secondsPerCandle = 3600;
      break;
    case "D":
      secondsPerCandle = 86400;
      break;
    case "W":
      secondsPerCandle = 604800;
      break;
    case "M":
      secondsPerCandle = 2592000;
      break;
    default:
      secondsPerCandle = 3600;
  }

  // For 4h interval, we need to aggregate from 1h
  const actualInterval = interval === "4h" ? "60" : finnhubInterval;
  const multiplier = interval === "4h" ? 4 : 1;
  const from = now - secondsPerCandle * outputSize * multiplier * 2; // Fetch extra to ensure enough data

  // Determine endpoint based on symbol type
  let endpoint: string;
  if (symbolType === "forex") {
    endpoint = "/forex/candle";
  } else if (symbolType === "crypto") {
    endpoint = "/crypto/candle";
  } else {
    endpoint = "/stock/candle";
  }

  const data = await fetchFinnhub<FinnhubCandleResponse>(
    endpoint,
    {
      symbol: finnhubSymbol,
      resolution: actualInterval,
      from: from.toString(),
      to: now.toString(),
    }
  );

  let result = transformCandleResponse(data, formattedSymbol, interval);

  // Aggregate to 4h if needed
  if (interval === "4h" && result.values.length > 0) {
    result = aggregate4HCandles(result);
  }

  // Limit to requested output size
  result.values = result.values.slice(0, outputSize);

  // Cache the result
  await setCache(cacheKey, result, CACHE_TTL.TIME_SERIES);
  console.log(`Cached ${cacheKey} for ${CACHE_TTL.TIME_SERIES}s`);

  return result;
}

// Aggregate 1h candles to 4h
function aggregate4HCandles(data: TimeSeriesResponse): TimeSeriesResponse {
  const aggregated: OHLCVData[] = [];
  const hourlyValues = [...data.values].reverse(); // Work from oldest to newest

  for (let i = 0; i < hourlyValues.length; i += 4) {
    const chunk = hourlyValues.slice(i, i + 4);
    if (chunk.length === 0) break;

    aggregated.push({
      datetime: chunk[0].datetime,
      open: chunk[0].open,
      high: Math.max(...chunk.map((c) => c.high)),
      low: Math.min(...chunk.map((c) => c.low)),
      close: chunk[chunk.length - 1].close,
      volume: chunk.reduce((sum, c) => sum + c.volume, 0),
    });
  }

  return {
    ...data,
    values: aggregated.reverse(), // Back to newest first
  };
}

// Technical indicators - use local calculations since Finnhub indicators may not support forex/crypto
export async function getRSI(
  symbol: string,
  interval: string = "1h",
  timePeriod: number = 14,
  outputSize: number = 30
): Promise<TechnicalIndicator[]> {
  const formattedSymbol = formatSymbol(symbol);
  const cacheKey = generateCacheKey(
    "rsi",
    formattedSymbol,
    interval,
    timePeriod,
    outputSize
  );

  const cached = await getCache<TechnicalIndicator[]>(cacheKey);
  if (cached) {
    console.log(`Cache hit for ${cacheKey}`);
    return cached;
  }

  // Fetch enough candles for calculation
  const timeSeries = await getTimeSeries(
    formattedSymbol,
    interval,
    outputSize + timePeriod + 10
  );

  const closes = timeSeries.values.map((v) => v.close).reverse();
  const datetimes = timeSeries.values.map((v) => v.datetime).reverse();

  const rsiValues = calculateRSI(closes, timePeriod);

  const result: TechnicalIndicator[] = [];
  for (let i = 0; i < Math.min(outputSize, rsiValues.length); i++) {
    const idx = closes.length - rsiValues.length + i;
    result.push({
      datetime: datetimes[idx],
      value: rsiValues[i],
    });
  }

  // Return newest first
  result.reverse();

  await setCache(cacheKey, result, CACHE_TTL.INDICATOR);
  return result;
}

export async function getMACD(
  symbol: string,
  interval: string = "1h",
  outputSize: number = 30
): Promise<MACDData[]> {
  const formattedSymbol = formatSymbol(symbol);
  const cacheKey = generateCacheKey("macd", formattedSymbol, interval, outputSize);

  const cached = await getCache<MACDData[]>(cacheKey);
  if (cached) {
    console.log(`Cache hit for ${cacheKey}`);
    return cached;
  }

  // Fetch enough candles for MACD calculation (needs at least 26 + 9 periods)
  const timeSeries = await getTimeSeries(
    formattedSymbol,
    interval,
    outputSize + 50
  );

  const closes = timeSeries.values.map((v) => v.close).reverse();
  const datetimes = timeSeries.values.map((v) => v.datetime).reverse();

  const macdResult = calculateMACD(closes);

  const result: MACDData[] = [];
  for (let i = 0; i < Math.min(outputSize, macdResult.macd.length); i++) {
    const idx = closes.length - macdResult.macd.length + i;
    result.push({
      datetime: datetimes[idx],
      macd: macdResult.macd[i],
      macd_signal: macdResult.signal[i],
      macd_hist: macdResult.histogram[i],
    });
  }

  // Return newest first
  result.reverse();

  await setCache(cacheKey, result, CACHE_TTL.INDICATOR);
  return result;
}

export async function getSMA(
  symbol: string,
  interval: string = "1h",
  timePeriod: number = 20,
  outputSize: number = 30
): Promise<TechnicalIndicator[]> {
  const formattedSymbol = formatSymbol(symbol);
  const cacheKey = generateCacheKey(
    "sma",
    formattedSymbol,
    interval,
    timePeriod,
    outputSize
  );

  const cached = await getCache<TechnicalIndicator[]>(cacheKey);
  if (cached) {
    console.log(`Cache hit for ${cacheKey}`);
    return cached;
  }

  const timeSeries = await getTimeSeries(
    formattedSymbol,
    interval,
    outputSize + timePeriod + 10
  );

  const closes = timeSeries.values.map((v) => v.close).reverse();
  const datetimes = timeSeries.values.map((v) => v.datetime).reverse();

  const smaValues = calculateSMA(closes, timePeriod);

  const result: TechnicalIndicator[] = [];
  for (let i = 0; i < Math.min(outputSize, smaValues.length); i++) {
    const idx = closes.length - smaValues.length + i;
    result.push({
      datetime: datetimes[idx],
      value: smaValues[i],
    });
  }

  result.reverse();

  await setCache(cacheKey, result, CACHE_TTL.INDICATOR);
  return result;
}

export async function getEMA(
  symbol: string,
  interval: string = "1h",
  timePeriod: number = 20,
  outputSize: number = 30
): Promise<TechnicalIndicator[]> {
  const formattedSymbol = formatSymbol(symbol);
  const cacheKey = generateCacheKey(
    "ema",
    formattedSymbol,
    interval,
    timePeriod,
    outputSize
  );

  const cached = await getCache<TechnicalIndicator[]>(cacheKey);
  if (cached) {
    console.log(`Cache hit for ${cacheKey}`);
    return cached;
  }

  const timeSeries = await getTimeSeries(
    formattedSymbol,
    interval,
    outputSize + timePeriod + 10
  );

  const closes = timeSeries.values.map((v) => v.close).reverse();
  const datetimes = timeSeries.values.map((v) => v.datetime).reverse();

  const emaValues = calculateEMA(closes, timePeriod);

  const result: TechnicalIndicator[] = [];
  for (let i = 0; i < Math.min(outputSize, emaValues.length); i++) {
    const idx = closes.length - emaValues.length + i;
    result.push({
      datetime: datetimes[idx],
      value: emaValues[i],
    });
  }

  result.reverse();

  await setCache(cacheKey, result, CACHE_TTL.INDICATOR);
  return result;
}

// Get comprehensive market data for analysis
export async function getMarketData(symbol: string, interval: string = "1h") {
  const formattedSymbol = formatSymbol(symbol);
  const cacheKey = generateCacheKey("market_data", formattedSymbol, interval);

  // Check for cached market data first
  const cached = await getCache<{
    symbol: string;
    interval: string;
    timeSeries: TimeSeriesResponse;
    indicators: {
      rsi: TechnicalIndicator[];
      macd: MACDData[];
      sma20: TechnicalIndicator[];
      ema50: TechnicalIndicator[];
    };
  }>(cacheKey);

  if (cached) {
    console.log(`Cache hit for market data: ${cacheKey}`);
    return cached;
  }

  // Fetch all data (individual calls also check their own cache)
  const [timeSeries, rsi, macd, sma20, ema50] = await Promise.all([
    getTimeSeries(formattedSymbol, interval, 100),
    getRSI(formattedSymbol, interval, 14, 30),
    getMACD(formattedSymbol, interval, 30),
    getSMA(formattedSymbol, interval, 20, 30),
    getEMA(formattedSymbol, interval, 50, 30),
  ]);

  const result = {
    symbol: formattedSymbol,
    interval,
    timeSeries,
    indicators: {
      rsi,
      macd,
      sma20,
      ema50,
    },
  };

  // Cache the combined result
  await setCache(cacheKey, result, CACHE_TTL.MARKET_DATA);
  console.log(`Cached market data: ${cacheKey}`);

  return result;
}

// Symbol lists for each market
export const FOREX_SYMBOLS = [
  "EUR/USD",
  "GBP/USD",
  "USD/JPY",
  "AUD/USD",
  "USD/CAD",
  "NZD/USD",
];

export const CRYPTO_SYMBOLS = ["BTC/USD", "ETH/USD", "SOL/USD", "XRP/USD"];

export const STOCK_SYMBOLS = ["AAPL", "TSLA", "GOOGL", "MSFT", "AMZN", "NVDA"];

export function getSymbolsByMarket(market: string): string[] {
  switch (market.toLowerCase()) {
    case "forex":
      return FOREX_SYMBOLS;
    case "crypto":
      return CRYPTO_SYMBOLS;
    case "stocks":
      return STOCK_SYMBOLS;
    default:
      return [];
  }
}
