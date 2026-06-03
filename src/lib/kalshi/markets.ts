import { kalshiGet } from './client'
import { activeGasEvent, type ActiveGasEvent } from './gasEvent'
import { parseMovieTitle } from './movieTitle'
import type { EventMarketGroup, GetMarketsResponse, KalshiMarket } from './types'

const KXRT_SERIES_TICKER = 'KXRT'

export async function fetchMarketsForEvent(eventTicker: string): Promise<KalshiMarket[]> {
  const markets: KalshiMarket[] = []
  let cursor = ''

  do {
    const params = new URLSearchParams({
      limit: '1000',
      event_ticker: eventTicker,
    })
    if (cursor) {
      params.set('cursor', cursor)
    }

    const data = await kalshiGet<GetMarketsResponse>(`/markets?${params}`)
    markets.push(...data.markets)
    cursor = data.cursor
  } while (cursor)

  return markets
}

export async function fetchActiveGasMarkets(from: Date = new Date()): Promise<{
  event: ActiveGasEvent
  markets: KalshiMarket[]
}> {
  const event = activeGasEvent(from)
  const markets = await fetchMarketsForEvent(event.eventTicker)
  return { event, markets }
}

/** @deprecated Use fetchActiveGasMarkets instead. */
export async function fetchTomorrowGasMarkets(from: Date = new Date()): Promise<{
  eventTicker: string
  markets: KalshiMarket[]
}> {
  const { event, markets } = await fetchActiveGasMarkets(from)
  return { eventTicker: event.eventTicker, markets }
}

export async function fetchOpenKxrtMarkets(): Promise<KalshiMarket[]> {
  const markets: KalshiMarket[] = []
  let cursor = ''

  do {
    const params = new URLSearchParams({
      limit: '1000',
      series_ticker: KXRT_SERIES_TICKER,
      status: 'open',
    })
    if (cursor) {
      params.set('cursor', cursor)
    }

    const data = await kalshiGet<GetMarketsResponse>(`/markets?${params}`)
    markets.push(...data.markets)
    cursor = data.cursor
  } while (cursor)

  return markets
}

export function groupMarketsByEvent(markets: KalshiMarket[]): EventMarketGroup[] {
  const groups = new Map<string, EventMarketGroup>()

  for (const market of markets) {
    const existing = groups.get(market.event_ticker)
    if (existing) {
      existing.marketCount += 1
      continue
    }

    groups.set(market.event_ticker, {
      event_ticker: market.event_ticker,
      movieTitle: parseMovieTitle(market.title ?? market.event_ticker),
      marketCount: 1,
    })
  }

  return Array.from(groups.values()).sort((a, b) =>
    a.movieTitle.localeCompare(b.movieTitle),
  )
}

export function logEventMarketGroups(groups: EventMarketGroup[]): void {
  for (const group of groups) {
    console.log(
      `[KXRT] ${group.movieTitle} — ${group.marketCount} markets`,
    )
  }
  console.log(`[KXRT] ${groups.length} events, ${groups.reduce((n, g) => n + g.marketCount, 0)} markets total`)
}

export async function fetchOpenKxrtEventGroups(): Promise<EventMarketGroup[]> {
  const markets = await fetchOpenKxrtMarkets()
  const groups = groupMarketsByEvent(markets)
  logEventMarketGroups(groups)
  return groups
}
