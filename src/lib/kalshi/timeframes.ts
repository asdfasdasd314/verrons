import type { ChartTimeframe, TickTimeframe } from './types'

export type TimeframeOption = {
  label: string
  interval: ChartTimeframe
}

export type TimeframeGroup = {
  label: string
  options: TimeframeOption[]
}

export const TIMEFRAME_GROUPS: TimeframeGroup[] = [
  {
    label: 'Ticks',
    options: [
      { label: '1T', interval: 'tick' },
      { label: '5T', interval: 'tick-5' },
      { label: '10T', interval: 'tick-10' },
    ],
  },
  {
    label: 'Minutes',
    options: [{ label: '1m', interval: 1 }],
  },
  {
    label: 'Hours',
    options: [{ label: '1h', interval: 60 }],
  },
  {
    label: 'Days',
    options: [{ label: '1d', interval: 1440 }],
  },
]

export const TIMEFRAME_OPTIONS = TIMEFRAME_GROUPS.flatMap((group) => group.options)

export function timeframeToSelectValue(interval: ChartTimeframe): string {
  return String(interval)
}

export function timeframeFromSelectValue(value: string): ChartTimeframe | null {
  const match = TIMEFRAME_OPTIONS.find((option) => String(option.interval) === value)
  return match?.interval ?? null
}

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
