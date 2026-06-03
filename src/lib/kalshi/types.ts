export type KalshiMarket = {
  ticker: string
  event_ticker: string
  title?: string
  yes_sub_title: string
  floor_strike: number | null
  yes_bid_dollars: string
  yes_ask_dollars: string
  last_price_dollars: string
}

export type GetMarketsResponse = {
  markets: KalshiMarket[]
  cursor: string
}

export type EventMarketGroup = {
  event_ticker: string
  movieTitle: string
  marketCount: number
}

export type ScoreBucket = {
  label: string
  minScore: number
  maxScore: number
  center: number
  probability: number
}

export type ScoreDistribution = {
  buckets: ScoreBucket[]
  mean: number
  stdDev: number
}

export type RankedMovie = {
  event_ticker: string
  movieTitle: string
  marketCount: number
  distribution: ScoreDistribution
  movieScore: number
  rank: number
}
