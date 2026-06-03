import { parseAaaGasPriceString } from './scrapeGasPrice'
import { formatGasPrice } from '../kalshi/gasEvent'

export type GasFillRecommendation = 'wait' | 'fill_today'

export type GasMarketConsensus = {
  todayPrice: number
  kalshiMean: number
  priceDifference: number
  stdDev: number
  stdDeviationsAway: number
  confidence: number
  recommendation: GasFillRecommendation
}

export function stdDeviationsFromMean(
  value: number,
  mean: number,
  stdDev: number,
): number | null {
  if (!Number.isFinite(stdDev) || stdDev <= 0) {
    return null
  }

  return Math.abs(value - mean) / stdDev
}

export function confidenceFromStdDeviations(stdDeviationsAway: number): number {
  if (!Number.isFinite(stdDeviationsAway) || stdDeviationsAway < 0) {
    return 0
  }

  return 1 - 1 / (1 + stdDeviationsAway)
}

export function calculateGasMarketConsensus(
  todayPriceRaw: string,
  kalshiMean: number,
  kalshiStdDev: number,
): GasMarketConsensus | null {
  const todayPrice = parseAaaGasPriceString(todayPriceRaw)
  const stdDeviationsAway = stdDeviationsFromMean(todayPrice, kalshiMean, kalshiStdDev)
  if (stdDeviationsAway == null) {
    return null
  }

  const confidence = confidenceFromStdDeviations(stdDeviationsAway)
  const recommendation: GasFillRecommendation =
    kalshiMean < todayPrice ? 'wait' : 'fill_today'

  return {
    todayPrice,
    kalshiMean,
    priceDifference: Math.abs(todayPrice - kalshiMean),
    stdDev: kalshiStdDev,
    stdDeviationsAway,
    confidence,
    recommendation,
  }
}

export function formatGasConsensusMessage(consensus: GasMarketConsensus): string {
  const confidencePct = Math.round(consensus.confidence * 100)

  if (consensus.recommendation === 'wait') {
    return `${confidencePct}% confidence to wait until tomorrow to fill up`
  }

  return `${confidencePct}% confidence to fill up today`
}

export function formatGasConsensusHeadline(
  consensus: GasMarketConsensus,
): string {
  return `${formatGasConsensusMessage(consensus)} · Gas Price Today: ${formatGasPrice(consensus.todayPrice)}`
}

export type GasConsensusMathStep = {
  label: string
  expression: string
  result: string
}

export function buildGasConsensusMathSteps(
  consensus: GasMarketConsensus,
): GasConsensusMathStep[] {
  const confidencePct = (consensus.confidence * 100).toFixed(1)

  return [
    {
      label: 'Gas price today (AAA)',
      expression: 'scraped from gasprices.aaa.com',
      result: formatGasPrice(consensus.todayPrice),
    },
    {
      label: 'Kalshi implied price (mean)',
      expression: 'weighted mean of strike distribution',
      result: formatGasPrice(consensus.kalshiMean),
    },
    {
      label: 'Price difference',
      expression: `|${formatGasPrice(consensus.todayPrice)} − ${formatGasPrice(consensus.kalshiMean)}|`,
      result: formatGasPrice(consensus.priceDifference),
    },
    {
      label: 'Standard deviations away',
      expression: `${formatGasPrice(consensus.priceDifference)} ÷ ${formatGasPrice(consensus.stdDev)}`,
      result: consensus.stdDeviationsAway.toFixed(2),
    },
    {
      label: 'Confidence',
      expression: `1 − 1 ÷ (1 + ${consensus.stdDeviationsAway.toFixed(2)})`,
      result: `${confidencePct}%`,
    },
    {
      label: 'Recommendation',
      expression:
        consensus.kalshiMean < consensus.todayPrice
          ? 'Kalshi mean < today → wait for tomorrow'
          : 'Kalshi mean ≥ today → fill up today',
      result: formatGasConsensusMessage(consensus),
    },
  ]
}
