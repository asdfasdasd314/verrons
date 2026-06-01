import type {
  CandlestickData,
  HistogramData,
  LineData,
  UTCTimestamp,
} from 'lightweight-charts'
import { kalshiGet } from './client'
import { VOLUME_DOWN_COLOR, VOLUME_UP_COLOR } from './chartColors'
import type { GetTradesResponse, KalshiTrade } from './types'

export const TRADES_PAGE_SIZE = 1000
export const TRADES_PAGE_COUNT = 5

/** @deprecated use TRADES_PAGE_SIZE */
export const LAST_N_TRADES = TRADES_PAGE_SIZE

type ParsedTrade = {
  time: UTCTimestamp
  price: number
  volume: number
}

export type TradeCandle = {
  time: UTCTimestamp
  open: number
  high: number
  low: number
  close: number
  volume: number
}

function parseDollar(value: string | null | undefined): number | null {
  if (value == null || value === '') return null
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : null
}

function parseVolume(value: string | null | undefined): number | null {
  if (value == null || value === '') return null
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : null
}

/** Sub-second precision from trade timestamp. */
export function tradeToChartTime(createdTime: string): UTCTimestamp | null {
  const ms = Date.parse(createdTime)
  if (Number.isNaN(ms)) return null
  return (ms / 1000) as UTCTimestamp
}

function parseTrades(trades: KalshiTrade[]): ParsedTrade[] {
  const parsed: ParsedTrade[] = []

  for (const trade of trades) {
    const time = tradeToChartTime(trade.created_time)
    const price = parseDollar(trade.yes_price_dollars)
    const volume = parseVolume(trade.count_fp) ?? 0
    if (time === null || price === null) continue

    parsed.push({ time, price, volume })
  }

  return parsed
}

/** Minimum step between chart times (~1e9 s); avoids float ULP stalls. */
const MIN_TIME_STEP = 1e-6

/**
 * Count in a 1–9 digit system (no zeroes): 1…9, 11, 12, …, 19, 21, …
 * So 10 rolls to 11 because "10" contains a zero.
 */
function noZeroSuffix(n: number): string {
  let suffix = ''
  let value = n

  while (value > 0) {
    const digit = ((value - 1) % 9) + 1
    suffix = String(digit) + suffix
    value = Math.floor((value - 1) / 9)
  }

  return suffix
}

function timeWithSuffix(baseMs: number, suffixIndex: number): UTCTimestamp {
  const baseStr = (baseMs / 1000).toFixed(3)
  if (suffixIndex === 0) return parseFloat(baseStr) as UTCTimestamp
  return parseFloat(baseStr + noZeroSuffix(suffixIndex)) as UTCTimestamp
}

function ensureStrictlyAscendingTimes<T extends { time: UTCTimestamp }>(
  items: T[],
): T[] {
  const result: T[] = []
  let lastTime = -Infinity
  let collisionSuffix = 0

  for (const item of items) {
    let time = item.time as number

    if (time <= lastTime) {
      collisionSuffix++
      const bumped = parseFloat(String(lastTime) + noZeroSuffix(collisionSuffix))
      time = bumped > lastTime ? bumped : lastTime + MIN_TIME_STEP * collisionSuffix
    } else {
      collisionSuffix = 0
    }

    lastTime = time
    result.push({ ...item, time: time as UTCTimestamp })
  }

  return result
}

function parseTradesWithUniqueTimes(trades: KalshiTrade[]): ParsedTrade[] {
  const parsed: ParsedTrade[] = []
  const seenByMs = new Map<number, number>()

  for (const trade of trades) {
    const ms = Date.parse(trade.created_time)
    if (Number.isNaN(ms)) continue
    const price = parseDollar(trade.yes_price_dollars)
    const volume = parseVolume(trade.count_fp) ?? 0
    if (price === null) continue

    const duplicateIndex = seenByMs.get(ms) ?? 0
    seenByMs.set(ms, duplicateIndex + 1)

    parsed.push({
      time: timeWithSuffix(ms, duplicateIndex),
      price,
      volume,
    })
  }

  return ensureStrictlyAscendingTimes(parsed)
}

export function tradesToLineData(trades: KalshiTrade[]): LineData<UTCTimestamp>[] {
  return parseTradesWithUniqueTimes(trades).map(({ time, price }) => ({
    time,
    value: price,
  }))
}

export function tradesToLineVolumeData(
  trades: KalshiTrade[],
): HistogramData<UTCTimestamp>[] {
  const points = parseTradesWithUniqueTimes(trades)
  const volumeData: HistogramData<UTCTimestamp>[] = []

  for (let i = 0; i < points.length; i++) {
    const { time, price, volume } = points[i]
    if (volume <= 0) continue
    const prevPrice = i > 0 ? points[i - 1].price : price
    volumeData.push({
      time,
      value: volume,
      color: price >= prevPrice ? VOLUME_UP_COLOR : VOLUME_DOWN_COLOR,
    })
  }

  return volumeData
}

function ohlcFromBucket(bucket: ParsedTrade[]): TradeCandle | null {
  if (bucket.length === 0) return null

  const prices = bucket.map((t) => t.price)
  return {
    time: bucket[bucket.length - 1].time,
    open: bucket[0].price,
    close: bucket[bucket.length - 1].price,
    high: Math.max(...prices),
    low: Math.min(...prices),
    volume: bucket.reduce((sum, t) => sum + t.volume, 0),
  }
}

/** Every N consecutive trades → one OHLC candle (first=open, last=close). */
function aggregateByTickCount(trades: ParsedTrade[], n: number): TradeCandle[] {
  const bars: TradeCandle[] = []

  for (let i = 0; i < trades.length; i += n) {
    const bar = ohlcFromBucket(trades.slice(i, i + n))
    if (bar) bars.push(bar)
  }

  return bars
}

export function tradesToCandles(
  trades: KalshiTrade[],
  ticksPerBar: number,
): TradeCandle[] {
  const parsed = parseTrades(trades)
  if (parsed.length === 0) return []

  const bars = aggregateByTickCount(parsed, ticksPerBar)

  return ensureStrictlyAscendingTimes(bars)
}

export function tradeCandlesToChartData(
  bars: TradeCandle[],
): CandlestickData<UTCTimestamp>[] {
  return bars.map(({ time, open, high, low, close }) => ({
    time,
    open,
    high,
    low,
    close,
  }))
}

export function tradeCandlesToVolumeData(
  bars: TradeCandle[],
): HistogramData<UTCTimestamp>[] {
  return bars
    .filter((bar) => bar.volume > 0)
    .map((bar) => ({
      time: bar.time,
      value: bar.volume,
      color: bar.close >= bar.open ? VOLUME_UP_COLOR : VOLUME_DOWN_COLOR,
    }))
}

async function fetchMarketTradesPage(
  ticker: string,
  limit: number,
  maxTs?: number,
): Promise<GetTradesResponse> {
  const params = new URLSearchParams({
    ticker: ticker.trim(),
    limit: String(limit),
  })
  if (maxTs !== undefined) {
    params.set('max_ts', String(maxTs))
  }

  return kalshiGet<GetTradesResponse>(`/markets/trades?${params}`)
}

function oldestTradeUnix(trades: KalshiTrade[]): number | null {
  let oldestMs = Infinity

  for (const trade of trades) {
    const ms = Date.parse(trade.created_time)
    if (!Number.isNaN(ms) && ms < oldestMs) oldestMs = ms
  }

  if (!Number.isFinite(oldestMs)) return null
  return Math.floor(oldestMs / 1000)
}

export async function fetchLastMarketTrades(
  ticker: string,
  pages = TRADES_PAGE_COUNT,
  pageSize = TRADES_PAGE_SIZE,
): Promise<KalshiTrade[]> {
  const byId = new Map<string, KalshiTrade>()
  let maxTs: number | undefined

  for (let page = 0; page < pages; page++) {
    const { trades } = await fetchMarketTradesPage(ticker, pageSize, maxTs)
    if (trades.length === 0) break

    for (const trade of trades) {
      byId.set(trade.trade_id, trade)
    }

    if (trades.length < pageSize) break

    const oldestUnix = oldestTradeUnix(trades)
    if (oldestUnix === null) break
    if (maxTs !== undefined && oldestUnix >= maxTs) break

    maxTs = oldestUnix
  }

  return [...byId.values()].sort(
    (a, b) => Date.parse(a.created_time) - Date.parse(b.created_time),
  )
}

/** Build chart-ready candle + volume series from raw trades. */
export function tradesToChartSeries(trades: KalshiTrade[], ticksPerBar: number) {
  const candles = tradesToCandles(trades, ticksPerBar)
  return {
    candles,
    chartData: tradeCandlesToChartData(candles),
    volumeData: tradeCandlesToVolumeData(candles),
  }
}
