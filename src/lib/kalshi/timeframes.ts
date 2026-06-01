import type { ChartTimeframe, TickTimeframe } from './types'

export function isTickTimeframe(
  timeframe: ChartTimeframe,
): timeframe is TickTimeframe {
  return timeframe === 'tick' || timeframe === 'tick-5' || timeframe === 'tick-10'
}

export function isSingleTradeLineTimeframe(
  timeframe: ChartTimeframe,
): timeframe is 'tick' {
  return timeframe === 'tick'
}

export function ticksPerBar(timeframe: TickTimeframe): number {
  if (timeframe === 'tick-5') return 5
  if (timeframe === 'tick-10') return 10
  return 1
}
