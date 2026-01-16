/**
 * Local technical indicator calculations
 * Used as fallback since Finnhub indicators may not support forex/crypto
 */

/**
 * Calculate Simple Moving Average (SMA)
 * @param data - Array of closing prices (oldest to newest)
 * @param period - Number of periods for the SMA
 * @returns Array of SMA values
 */
export function calculateSMA(data: number[], period: number): number[] {
  if (data.length < period) {
    return [];
  }

  const result: number[] = [];

  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j];
    }
    result.push(sum / period);
  }

  return result;
}

/**
 * Calculate Exponential Moving Average (EMA)
 * @param data - Array of closing prices (oldest to newest)
 * @param period - Number of periods for the EMA
 * @returns Array of EMA values
 */
export function calculateEMA(data: number[], period: number): number[] {
  if (data.length < period) {
    return [];
  }

  const result: number[] = [];
  const multiplier = 2 / (period + 1);

  // First EMA is SMA of first 'period' values
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i];
  }
  let ema = sum / period;
  result.push(ema);

  // Calculate EMA for remaining values
  for (let i = period; i < data.length; i++) {
    ema = (data[i] - ema) * multiplier + ema;
    result.push(ema);
  }

  return result;
}

/**
 * Calculate Relative Strength Index (RSI)
 * @param data - Array of closing prices (oldest to newest)
 * @param period - Number of periods for RSI (default 14)
 * @returns Array of RSI values
 */
export function calculateRSI(data: number[], period: number = 14): number[] {
  if (data.length < period + 1) {
    return [];
  }

  const gains: number[] = [];
  const losses: number[] = [];

  // Calculate price changes
  for (let i = 1; i < data.length; i++) {
    const change = data[i] - data[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }

  const result: number[] = [];

  // Calculate first average gain and loss
  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 0; i < period; i++) {
    avgGain += gains[i];
    avgLoss += losses[i];
  }
  avgGain /= period;
  avgLoss /= period;

  // First RSI value
  if (avgLoss === 0) {
    result.push(100);
  } else {
    const rs = avgGain / avgLoss;
    result.push(100 - 100 / (1 + rs));
  }

  // Calculate subsequent RSI values using smoothed averages
  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;

    if (avgLoss === 0) {
      result.push(100);
    } else {
      const rs = avgGain / avgLoss;
      result.push(100 - 100 / (1 + rs));
    }
  }

  return result;
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 * @param data - Array of closing prices (oldest to newest)
 * @param fastPeriod - Fast EMA period (default 12)
 * @param slowPeriod - Slow EMA period (default 26)
 * @param signalPeriod - Signal line period (default 9)
 * @returns Object with macd, signal, and histogram arrays
 */
export function calculateMACD(
  data: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): { macd: number[]; signal: number[]; histogram: number[] } {
  if (data.length < slowPeriod) {
    return { macd: [], signal: [], histogram: [] };
  }

  const fastEMA = calculateEMA(data, fastPeriod);
  const slowEMA = calculateEMA(data, slowPeriod);

  // Align the EMAs - slow EMA starts later
  const offset = slowPeriod - fastPeriod;
  const alignedFastEMA = fastEMA.slice(offset);

  // Calculate MACD line
  const macdLine: number[] = [];
  for (let i = 0; i < slowEMA.length; i++) {
    macdLine.push(alignedFastEMA[i] - slowEMA[i]);
  }

  // Calculate signal line (EMA of MACD)
  const signalLine = calculateEMA(macdLine, signalPeriod);

  // Align MACD with signal - signal starts after signalPeriod
  const signalOffset = signalPeriod - 1;
  const alignedMACD = macdLine.slice(signalOffset);

  // Calculate histogram
  const histogram: number[] = [];
  for (let i = 0; i < signalLine.length; i++) {
    histogram.push(alignedMACD[i] - signalLine[i]);
  }

  return {
    macd: alignedMACD,
    signal: signalLine,
    histogram,
  };
}
