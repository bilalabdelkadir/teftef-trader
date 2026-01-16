import { getCache, setCache, generateCacheKey, CACHE_TTL } from "./cache";

const TWELVE_DATA_BASE_URL = "https://api.twelvedata.com";
const API_KEY = process.env.TEWELEVE_DATA;

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

class TwelveDataError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number
  ) {
    super(message);
    this.name = "TwelveDataError";
  }
}

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

async function fetchTwelveData<T>(
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
    throw new TwelveDataError("TEWELEVE_DATA API key is not configured");
  }

  const url = new URL(`${TWELVE_DATA_BASE_URL}${endpoint}`);
  url.searchParams.set("apikey", API_KEY);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url.toString(), {
    next: { revalidate: 60 }, // Cache for 1 minute
  });

  // Handle rate limit - try to return cached data
  if (response.status === 429) {
    if (cacheKey) {
      const cached = await getCache<T>(cacheKey);
      if (cached) {
        console.log(`Rate limited, returning stale cache for ${cacheKey}`);
        return cached;
      }
    }
    throw new TwelveDataError(
      "Rate limit exceeded. Please wait before making more requests.",
      "RATE_LIMIT",
      429
    );
  }

  if (!response.ok) {
    throw new TwelveDataError(
      `API request failed: ${response.statusText}`,
      undefined,
      response.status
    );
  }

  const data = await response.json();

  if (data.status === "error") {
    throw new TwelveDataError(data.message, data.code);
  }

  // Cache the result
  if (cacheKey && cacheTTL) {
    await setCache(cacheKey, data, cacheTTL);
    console.log(`Cached ${cacheKey} for ${cacheTTL}s`);
  }

  return data;
}

export async function getPrice(symbol: string): Promise<PriceData> {
  const formattedSymbol = formatSymbol(symbol);
  const cacheKey = generateCacheKey("price", formattedSymbol);

  const data = await fetchTwelveData<{ price: string }>(
    "/price",
    { symbol: formattedSymbol },
    cacheKey,
    CACHE_TTL.PRICE
  );

  return {
    symbol: formattedSymbol,
    price: parseFloat(data.price),
    timestamp: Date.now(),
  };
}

export async function getPrices(
  symbols: string[]
): Promise<Record<string, PriceData>> {
  const formattedSymbols = symbols.map(formatSymbol);
  const cacheKey = generateCacheKey("prices", formattedSymbols.join(","));

  const data = await fetchTwelveData<Record<string, { price: string }>>(
    "/price",
    { symbol: formattedSymbols.join(",") },
    cacheKey,
    CACHE_TTL.PRICE
  );

  const result: Record<string, PriceData> = {};

  for (const symbol of formattedSymbols) {
    const priceData = data[symbol];
    if (priceData) {
      result[symbol] = {
        symbol,
        price: parseFloat(priceData.price),
        timestamp: Date.now(),
      };
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

  const data = await fetchTwelveData<TimeSeriesResponse>(
    "/time_series",
    {
      symbol: formattedSymbol,
      interval,
      outputsize: outputSize.toString(),
    },
    cacheKey,
    CACHE_TTL.TIME_SERIES
  );

  // Parse numeric values
  data.values = data.values.map((v) => ({
    datetime: v.datetime,
    open: parseFloat(v.open as unknown as string),
    high: parseFloat(v.high as unknown as string),
    low: parseFloat(v.low as unknown as string),
    close: parseFloat(v.close as unknown as string),
    volume: parseFloat(v.volume as unknown as string),
  }));

  return data;
}

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

  const data = await fetchTwelveData<{
    values: { datetime: string; rsi: string }[];
  }>(
    "/rsi",
    {
      symbol: formattedSymbol,
      interval,
      time_period: timePeriod.toString(),
      outputsize: outputSize.toString(),
    },
    cacheKey,
    CACHE_TTL.INDICATOR
  );

  return data.values.map((v) => ({
    datetime: v.datetime,
    value: parseFloat(v.rsi),
  }));
}

export async function getMACD(
  symbol: string,
  interval: string = "1h",
  outputSize: number = 30
): Promise<MACDData[]> {
  const formattedSymbol = formatSymbol(symbol);
  const cacheKey = generateCacheKey("macd", formattedSymbol, interval, outputSize);

  const data = await fetchTwelveData<{
    values: {
      datetime: string;
      macd: string;
      macd_signal: string;
      macd_hist: string;
    }[];
  }>(
    "/macd",
    {
      symbol: formattedSymbol,
      interval,
      outputsize: outputSize.toString(),
    },
    cacheKey,
    CACHE_TTL.INDICATOR
  );

  return data.values.map((v) => ({
    datetime: v.datetime,
    macd: parseFloat(v.macd),
    macd_signal: parseFloat(v.macd_signal),
    macd_hist: parseFloat(v.macd_hist),
  }));
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

  const data = await fetchTwelveData<{
    values: { datetime: string; sma: string }[];
  }>(
    "/sma",
    {
      symbol: formattedSymbol,
      interval,
      time_period: timePeriod.toString(),
      outputsize: outputSize.toString(),
    },
    cacheKey,
    CACHE_TTL.INDICATOR
  );

  return data.values.map((v) => ({
    datetime: v.datetime,
    value: parseFloat(v.sma),
  }));
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

  const data = await fetchTwelveData<{
    values: { datetime: string; ema: string }[];
  }>(
    "/ema",
    {
      symbol: formattedSymbol,
      interval,
      time_period: timePeriod.toString(),
      outputsize: outputSize.toString(),
    },
    cacheKey,
    CACHE_TTL.INDICATOR
  );

  return data.values.map((v) => ({
    datetime: v.datetime,
    value: parseFloat(v.ema),
  }));
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
