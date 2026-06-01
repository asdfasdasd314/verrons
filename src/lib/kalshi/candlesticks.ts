import type {
  CandlestickData,
  HistogramData,
  UTCTimestamp,
} from 'lightweight-charts'
import { kalshiGet } from './client'
import { VOLUME_DOWN_COLOR, VOLUME_UP_COLOR } from './chartColors'
import type {
  GetMarketCandlesticksResponse,
  KalshiCandlestick,
  PeriodInterval,
  ChartTimeframe,
} from './types'

export { VOLUME_DOWN_COLOR, VOLUME_UP_COLOR } from './chartColors'

export const LAST_N_CANDLES = 5000

export const TIMEFRAME_OPTIONS: { label: string; interval: ChartTimeframe }[] = [
  { label: '1T', interval: 'tick' },
  { label: '5T', interval: 'tick-5' },
  { label: '10T', interval: 'tick-10' },
  { label: '1m', interval: 1 },
  { label: '1h', interval: 60 },
  { label: '1d', interval: 1440 },
]

/** @deprecated use TIMEFRAME_OPTIONS */
export const PERIOD_OPTIONS = TIMEFRAME_OPTIONS.filter(
  (o): o is { label: string; interval: PeriodInterval } =>
    typeof o.interval === 'number',
)

function parseDollar(value: string | null | undefined): number | null {
  if (value == null || value === '') return null
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : null
}

type OhlcValues = {
  open: number
  high: number
  low: number
  close: number
}

function ohlcFromDistribution(
  source: KalshiCandlestick['price'] | KalshiCandlestick['yes_ask'],
): OhlcValues | null {
  const open = parseDollar(source?.open_dollars)
  const high = parseDollar(source?.high_dollars)
  const low = parseDollar(source?.low_dollars)
  const close = parseDollar(source?.close_dollars)

  if (open === null || high === null || low === null || close === null) {
    return null
  }

  if (open === 0 && high === 0 && low === 0 && close === 0) {
    return null
  }

  return {
    open,
    high: Math.max(high, open, close, low),
    low: Math.min(low, open, close, high),
    close,
  }
}

/** Trade `price` first; fall back to `yes_ask` when there was no print in the bar. */
export function resolveCandleOhlc(candle: KalshiCandlestick): OhlcValues | null {
  return ohlcFromDistribution(candle.price) ?? ohlcFromDistribution(candle.yes_ask)
}

/** Kalshi OHLC → lightweight-charts candlestick series (ascending, unique times). */
export function candlesticksToChartData(
  candlesticks: KalshiCandlestick[],
): CandlestickData<UTCTimestamp>[] {
  const byTime = new Map<number, CandlestickData<UTCTimestamp>>()

  for (const candle of candlesticks) {
    const ohlc = resolveCandleOhlc(candle)
    if (!ohlc) continue

    byTime.set(candle.end_period_ts, {
      time: candle.end_period_ts as UTCTimestamp,
      ...ohlc,
    })
  }

  return [...byTime.values()].sort((a, b) => (a.time as number) - (b.time as number))
}

function parseVolume(value: string | null | undefined): number | null {
  if (value == null || value === '') return null
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : null
}

/** Volume histogram bars colored by candle direction (close vs open). */
export function candlesticksToVolumeData(
  candlesticks: KalshiCandlestick[],
): HistogramData<UTCTimestamp>[] {
  const byTime = new Map<number, HistogramData<UTCTimestamp>>()

  for (const candle of candlesticks) {
    const volume = parseVolume(candle.volume_fp)
    if (volume === null || volume <= 0) continue

    const ohlc = resolveCandleOhlc(candle)
    if (!ohlc) continue

    const isUp = ohlc.close >= ohlc.open

    byTime.set(candle.end_period_ts, {
      time: candle.end_period_ts as UTCTimestamp,
      value: volume,
      color: isUp ? VOLUME_UP_COLOR : VOLUME_DOWN_COLOR,
    })
  }

  return [...byTime.values()].sort((a, b) => (a.time as number) - (b.time as number))
}

export function seriesTickerFromMarket(marketTicker: string): string {
  return marketTicker.split('-')[0]
}

/** Seconds spanned by `count` candles at `periodInterval` minutes each. */
export function candleRangeSeconds(
  count: number,
  periodInterval: PeriodInterval,
): number {
  return count * periodInterval * 60
}

/** Last N candles ending at `endTs`, not before `createdUnix`. */
export function computeLastNCandlestickRange(
  createdUnix: number,
  endTs: number,
  periodInterval: PeriodInterval,
  count = LAST_N_CANDLES,
): { startTs: number; endTs: number } {
  const rangeSeconds = candleRangeSeconds(count, periodInterval)
  const startTs = Math.max(createdUnix, endTs - rangeSeconds)
  return { startTs, endTs }
}

export type FetchMarketCandlesticksParams = {
  seriesTicker: string
  ticker: string
  startTs: number
  endTs: number
  periodInterval: PeriodInterval
}

function candlestickPath({
  seriesTicker,
  ticker,
  startTs,
  endTs,
  periodInterval,
}: FetchMarketCandlesticksParams): string {
  const params = new URLSearchParams({
    start_ts: String(startTs),
    end_ts: String(endTs),
    period_interval: String(periodInterval),
  })

  return `/series/${encodeURIComponent(seriesTicker)}/markets/${encodeURIComponent(ticker)}/candlesticks?${params}`
}

export async function fetchMarketCandlesticks(
  params: FetchMarketCandlesticksParams,
): Promise<GetMarketCandlesticksResponse> {
  return kalshiGet<GetMarketCandlesticksResponse>(candlestickPath(params))
}

/** Fetches up to `LAST_N_CANDLES` candles for the given interval (single request). */
export async function fetchLastMarketCandlesticks(
  params: Omit<FetchMarketCandlesticksParams, 'startTs' | 'endTs'> & {
    createdUnix: number
    endTs: number
  },
) {
  const { createdUnix, endTs, periodInterval, seriesTicker, ticker } = params
  const { startTs, endTs: rangeEnd } = computeLastNCandlestickRange(
    createdUnix,
    endTs,
    periodInterval,
  )

  const page = await fetchMarketCandlesticks({
    seriesTicker,
    ticker,
    startTs,
    endTs: rangeEnd,
    periodInterval,
  })

  return {
    ticker,
    periodInterval,
    startTs,
    endTs: rangeEnd,
    candlesticks: page.candlesticks,
  }
}
