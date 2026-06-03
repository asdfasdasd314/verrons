import { formatGasPrice } from './gasEvent'
import type { KalshiMarket, ScoreBucket, ScoreDistribution, RankedMovie, EventMarketGroup } from './types'

export function marketYesAskProbability(market: KalshiMarket): number {
  const ask = Number.parseFloat(market.yes_ask_dollars)
  return Number.isFinite(ask) ? ask : 0
}

/** P(price > strike) for gas markets — uses live ask/mid when tradable, else last trade. */
export function marketGasYesProbability(market: KalshiMarket): number {
  const bid = Number.parseFloat(market.yes_bid_dollars)
  const ask = Number.parseFloat(market.yes_ask_dollars)
  const last = Number.parseFloat(market.last_price_dollars)

  const hasBid = Number.isFinite(bid) && bid > 0
  const hasAsk = Number.isFinite(ask) && ask > 0 && ask < 1
  const hasLast = Number.isFinite(last) && last > 0

  if (hasBid && hasAsk) {
    return (bid + ask) / 2
  }
  if (hasAsk) {
    return ask
  }
  if (hasBid) {
    return bid
  }
  if (hasLast) {
    return last
  }

  return Number.isFinite(ask) ? ask : 0
}

export function marketYesProbability(market: KalshiMarket): number {
  const bid = Number.parseFloat(market.yes_bid_dollars)
  const ask = Number.parseFloat(market.yes_ask_dollars)
  if (Number.isFinite(bid) && Number.isFinite(ask) && (bid > 0 || ask > 0)) {
    return (bid + ask) / 2
  }

  const last = Number.parseFloat(market.last_price_dollars)
  if (Number.isFinite(last)) {
    return last
  }

  return Number.isFinite(ask) ? ask : 0
}

function bucketCenter(minScore: number, maxScore: number): number {
  return (minScore + maxScore) / 2
}

function normalizeBuckets(buckets: ScoreBucket[]): ScoreBucket[] {
  const total = buckets.reduce((sum, bucket) => sum + bucket.probability, 0)
  if (total <= 0) {
    return buckets
  }

  return buckets.map((bucket) => ({
    ...bucket,
    probability: bucket.probability / total,
  }))
}

export function buildScoreDistribution(markets: KalshiMarket[]): ScoreDistribution | null {
  const strikeMarkets = markets
    .filter((market) => market.floor_strike != null)
    .sort((a, b) => a.floor_strike! - b.floor_strike!)

  if (strikeMarkets.length === 0) {
    return null
  }

  const aboveByStrike = strikeMarkets.map((market) => ({
    strike: market.floor_strike!,
    probability: marketYesProbability(market),
  }))

  const buckets: ScoreBucket[] = []

  const lowestStrike = aboveByStrike[0].strike
  const lowestAbove = aboveByStrike[0].probability
  if (lowestStrike > 0) {
    buckets.push({
      label: `<${lowestStrike}`,
      minScore: 0,
      maxScore: lowestStrike,
      center: bucketCenter(0, lowestStrike),
      probability: Math.max(0, 1 - lowestAbove),
    })
  }

  for (let index = 0; index < aboveByStrike.length - 1; index += 1) {
    const lower = aboveByStrike[index]
    const upper = aboveByStrike[index + 1]
    const minScore = lower.strike + 1
    const maxScore = upper.strike

    buckets.push({
      label: `${minScore}–${maxScore}`,
      minScore,
      maxScore,
      center: bucketCenter(minScore, maxScore),
      probability: Math.max(0, lower.probability - upper.probability),
    })
  }

  const highest = aboveByStrike[aboveByStrike.length - 1]
  if (highest.strike < 100) {
    const minScore = highest.strike + 1
    buckets.push({
      label: `>${minScore}`,
      minScore,
      maxScore: 100,
      center: bucketCenter(minScore, 100),
      probability: Math.max(0, highest.probability),
    })
  }

  const normalized = normalizeBuckets(buckets.filter((bucket) => bucket.probability > 0))
  if (normalized.length === 0) {
    return null
  }

  const mean = normalized.reduce(
    (sum, bucket) => sum + bucket.center * bucket.probability,
    0,
  )
  const variance = normalized.reduce(
    (sum, bucket) => sum + bucket.probability * (bucket.center - mean) ** 2,
    0,
  )

  return {
    buckets: normalized,
    mean,
    stdDev: Math.sqrt(variance),
  }
}

function typicalStrikeStep(strikes: number[]): number {
  if (strikes.length < 2) return 0.005

  const steps = strikes.slice(1).map((strike, index) => strike - strikes[index])
  return steps.reduce((sum, step) => sum + step, 0) / steps.length
}

export function buildContinuousStrikeDistribution(
  markets: KalshiMarket[],
  probabilityFn: (market: KalshiMarket) => number = marketGasYesProbability,
): ScoreDistribution | null {
  const strikeMarkets = markets
    .filter((market) => market.floor_strike != null)
    .sort((a, b) => a.floor_strike! - b.floor_strike!)

  if (strikeMarkets.length === 0) {
    return null
  }

  const aboveByStrike = strikeMarkets.map((market) => ({
    strike: market.floor_strike!,
    probability: probabilityFn(market),
  }))
  const step = typicalStrikeStep(aboveByStrike.map((entry) => entry.strike))
  const buckets: ScoreBucket[] = []

  const lowest = aboveByStrike[0]
  buckets.push({
    label: `<${formatGasPrice(lowest.strike)}`,
    minScore: lowest.strike - step,
    maxScore: lowest.strike,
    center: lowest.strike - step / 2,
    probability: Math.max(0, 1 - lowest.probability),
  })

  for (let index = 0; index < aboveByStrike.length - 1; index += 1) {
    const lower = aboveByStrike[index]
    const upper = aboveByStrike[index + 1]

    buckets.push({
      label: `${formatGasPrice(lower.strike)}–${formatGasPrice(upper.strike)}`,
      minScore: lower.strike,
      maxScore: upper.strike,
      center: (lower.strike + upper.strike) / 2,
      probability: Math.max(0, lower.probability - upper.probability),
    })
  }

  const highest = aboveByStrike[aboveByStrike.length - 1]
  buckets.push({
    label: `>${formatGasPrice(highest.strike)}`,
    minScore: highest.strike,
    maxScore: highest.strike + step,
    center: highest.strike + step / 2,
    probability: Math.max(0, highest.probability),
  })

  const normalized = normalizeBuckets(buckets.filter((bucket) => bucket.probability > 0))
  if (normalized.length === 0) {
    return null
  }

  const mean = normalized.reduce(
    (sum, bucket) => sum + bucket.center * bucket.probability,
    0,
  )
  const variance = normalized.reduce(
    (sum, bucket) => sum + bucket.probability * (bucket.center - mean) ** 2,
    0,
  )

  return {
    buckets: normalized,
    mean,
    stdDev: Math.sqrt(variance),
  }
}

export const DEFAULT_MEAN_STDEV_RATIO = 2

export function calculateMovieScore(
  mean: number,
  stdDev: number,
  ratio: number = DEFAULT_MEAN_STDEV_RATIO,
): number {
  const meanWeight = (ratio + 1) / 2
  const stdevWeight = 2 / (ratio + 1)
  const normalizer = Math.max(meanWeight, stdevWeight)
  const meanTerm = mean / 100
  const stdevTerm = 10 / (stdDev + 10)

  return (5 * (meanWeight * meanTerm + stdevWeight * stdevTerm)) / normalizer
}

export function rankMoviesByScore(
  markets: KalshiMarket[],
  groups: EventMarketGroup[],
  ratio: number = DEFAULT_MEAN_STDEV_RATIO,
): RankedMovie[] {
  const scored = groups
    .map((group) => {
      const eventMarkets = markets.filter(
        (market) => market.event_ticker === group.event_ticker,
      )
      const distribution = buildScoreDistribution(eventMarkets)
      if (!distribution) {
        return null
      }

      return {
        event_ticker: group.event_ticker,
        movieTitle: group.movieTitle,
        marketCount: group.marketCount,
        distribution,
        movieScore: calculateMovieScore(distribution.mean, distribution.stdDev, ratio),
      }
    })
    .filter((movie): movie is Omit<RankedMovie, 'rank'> => movie !== null)
    .sort((a, b) => b.movieScore - a.movieScore)

  return scored.map((movie, index) => ({
    ...movie,
    rank: index + 1,
  }))
}
