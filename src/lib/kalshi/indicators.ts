import type { LineData, UTCTimestamp } from 'lightweight-charts'

export type PricePoint = {
  time: UTCTimestamp
  value: number
}

/** Simple moving average of `value` over the last `period` points (inclusive). */
export function simpleMovingAverage(
  series: PricePoint[],
  period: number,
): LineData<UTCTimestamp>[] {
  const n = Math.floor(period)
  if (n < 1 || series.length === 0) return []

  const result: LineData<UTCTimestamp>[] = []
  let sum = 0

  for (let i = 0; i < series.length; i++) {
    sum += series[i].value
    if (i >= n) {
      sum -= series[i - n].value
    }
    if (i >= n - 1) {
      result.push({
        time: series[i].time,
        value: sum / n,
      })
    }
  }

  return result
}

/** Exponential moving average seeded with the first `period`-bar SMA. */
export function exponentialMovingAverage(
  series: PricePoint[],
  period: number,
): LineData<UTCTimestamp>[] {
  const n = Math.floor(period)
  if (n < 1 || series.length < n) return []

  const multiplier = 2 / (n + 1)
  const result: LineData<UTCTimestamp>[] = []

  let sum = 0
  for (let i = 0; i < n; i++) {
    sum += series[i].value
  }
  let ema = sum / n
  result.push({ time: series[n - 1].time, value: ema })

  for (let i = n; i < series.length; i++) {
    ema = (series[i].value - ema) * multiplier + ema
    result.push({ time: series[i].time, value: ema })
  }

  return result
}

function rsiValue(avgGain: number, avgLoss: number): number {
  if (avgLoss === 0) {
    return avgGain === 0 ? 50 : 100
  }
  const rs = avgGain / avgLoss
  return 100 - 100 / (1 + rs)
}

/** Wilder-smoothed RSI (0–100) over `period` bars. */
export function relativeStrengthIndex(
  series: PricePoint[],
  period: number,
): LineData<UTCTimestamp>[] {
  const n = Math.floor(period)
  if (n < 1 || series.length <= n) return []

  const result: LineData<UTCTimestamp>[] = []
  let avgGain = 0
  let avgLoss = 0

  for (let i = 1; i <= n; i++) {
    const change = series[i].value - series[i - 1].value
    avgGain += change > 0 ? change : 0
    avgLoss += change < 0 ? -change : 0
  }

  avgGain /= n
  avgLoss /= n
  result.push({ time: series[n].time, value: rsiValue(avgGain, avgLoss) })

  for (let i = n + 1; i < series.length; i++) {
    const change = series[i].value - series[i - 1].value
    const gain = change > 0 ? change : 0
    const loss = change < 0 ? -change : 0
    avgGain = (avgGain * (n - 1) + gain) / n
    avgLoss = (avgLoss * (n - 1) + loss) / n
    result.push({ time: series[i].time, value: rsiValue(avgGain, avgLoss) })
  }

  return result
}
