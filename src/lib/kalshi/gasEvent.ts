const GAS_SERIES_PREFIX = 'KXAAAGASD'
const MONTH_CODES = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'] as const

export const GAS_MARKET_OPEN_HOUR_ET = 8
export const GAS_MARKET_TIMEZONE = 'America/New_York'

type EasternDateTime = {
  year: number
  month: number
  day: number
  hour: number
}

export type ActiveGasEvent = {
  eventTicker: string
  /** Calendar date (ET) that this market settles on. */
  targetYear: number
  targetMonth: number
  targetDay: number
  /** False before 8 AM ET — we show today's market instead of tomorrow's. */
  isTomorrowsMarketOpen: boolean
}

function getEasternDateTime(from: Date): EasternDateTime {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: GAS_MARKET_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  })

  const parts = Object.fromEntries(
    formatter
      .formatToParts(from)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  )

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
  }
}

function addCalendarDays(year: number, month: number, day: number, days: number) {
  const date = new Date(Date.UTC(year, month - 1, day))
  date.setUTCDate(date.getUTCDate() + days)
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  }
}

export function gasEventTickerForDateParts(
  year: number,
  month: number,
  day: number,
): string {
  const yearShort = year % 100
  const monthCode = MONTH_CODES[month - 1]
  const dayString = String(day).padStart(2, '0')
  return `${GAS_SERIES_PREFIX}-${yearShort}${monthCode}${dayString}`
}

/** @deprecated Use activeGasEvent instead. */
export function gasEventTickerForDate(date: Date): string {
  return gasEventTickerForDateParts(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
  )
}

/** @deprecated Use activeGasEvent instead. */
export function tomorrowGasEventTicker(from: Date = new Date()): string {
  return activeGasEvent(from).eventTicker
}

export function activeGasEvent(from: Date = new Date()): ActiveGasEvent {
  const eastern = getEasternDateTime(from)
  const isTomorrowsMarketOpen = eastern.hour >= GAS_MARKET_OPEN_HOUR_ET
  const dayOffset = isTomorrowsMarketOpen ? 1 : 0
  const target = addCalendarDays(eastern.year, eastern.month, eastern.day, dayOffset)

  return {
    eventTicker: gasEventTickerForDateParts(target.year, target.month, target.day),
    targetYear: target.year,
    targetMonth: target.month,
    targetDay: target.day,
    isTomorrowsMarketOpen,
  }
}

export function parseGasEventDate(eventTicker: string): Date | null {
  const match = eventTicker.match(/^KXAAAGASD-(\d{2})([A-Z]{3})(\d{2})$/)
  if (!match) return null

  const monthIndex = MONTH_CODES.indexOf(match[2] as (typeof MONTH_CODES)[number])
  if (monthIndex < 0) return null

  const day = Number.parseInt(match[3], 10)
  const year = 2000 + Number.parseInt(match[1], 10)

  return new Date(year, monthIndex, day)
}

export function formatGasEventDate(eventTicker: string): string {
  const date = parseGasEventDate(eventTicker)
  if (!date) return eventTicker

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatGasPrice(value: number): string {
  return `$${value.toFixed(3)}`
}

export function gasMarketOpensAtLabel(): string {
  return `${GAS_MARKET_OPEN_HOUR_ET}:00 AM ET`
}
