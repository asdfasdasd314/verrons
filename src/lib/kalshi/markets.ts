import {
  fetchLastMarketCandlesticks,
  seriesTickerFromMarket,
} from './candlesticks'
import { kalshiGet } from './client'
import type {
  GetMarketResponse,
  KalshiMarket,
  MarketCandlesticks,
  MarketUnixBounds,
  PeriodInterval,
} from './types'

export function isoToUnixSeconds(iso: string): number {
  const ms = Date.parse(iso)
  if (Number.isNaN(ms)) {
    throw new Error(`Invalid ISO timestamp: ${iso}`)
  }
  return Math.floor(ms / 1000)
}

export function nowUnixSeconds(): number {
  return Math.floor(Date.now() / 1000)
}

/** Candlestick fetches cannot extend past the present for open markets. */
export function effectiveCandlestickEndUnix(closeUnix: number): number {
  return Math.min(closeUnix, nowUnixSeconds())
}

export function marketToBounds(market: KalshiMarket): MarketUnixBounds {
  return {
    ticker: market.ticker,
    createdTime: market.created_time,
    closeTime: market.close_time,
    createdUnix: isoToUnixSeconds(market.created_time),
    closeUnix: isoToUnixSeconds(market.close_time),
  }
}

export async function fetchMarket(ticker: string): Promise<GetMarketResponse> {
  const encoded = encodeURIComponent(ticker.trim())
  return kalshiGet<GetMarketResponse>(`/markets/${encoded}`)
}

export async function getMarketUnixBounds(
  ticker: string,
): Promise<MarketUnixBounds> {
  const { market } = await fetchMarket(ticker)
  return marketToBounds(market)
}

export async function getMarketCandlesticks(
  ticker: string,
  periodInterval: PeriodInterval,
): Promise<MarketCandlesticks> {
  const { market } = await fetchMarket(ticker)
  const bounds = marketToBounds(market)
  const seriesTicker = seriesTickerFromMarket(bounds.ticker)
  const endTs = effectiveCandlestickEndUnix(bounds.closeUnix)

  const result = await fetchLastMarketCandlesticks({
    seriesTicker,
    ticker: bounds.ticker,
    createdUnix: bounds.createdUnix,
    endTs,
    periodInterval,
  })

  return {
    market,
    bounds,
    seriesTicker,
    periodInterval: result.periodInterval,
    startTs: result.startTs,
    endTs: result.endTs,
    candlesticks: result.candlesticks,
  }
}
