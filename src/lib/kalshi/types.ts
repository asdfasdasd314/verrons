export type KalshiMarket = {
  ticker: string
  created_time: string
  close_time: string
  title?: string
  event_ticker?: string
  open_interest_fp?: string
  volume_fp?: string
  volume_24h_fp?: string
  rules_primary?: string
  rules_secondary?: string
  status?: string
  subtitle?: string
}

export type GetMarketResponse = {
  market: KalshiMarket
}

export type MarketUnixBounds = {
  ticker: string
  createdTime: string
  closeTime: string
  createdUnix: number
  closeUnix: number
}

export type KalshiBidAskDistribution = {
  open_dollars: string
  low_dollars: string
  high_dollars: string
  close_dollars: string
}

export type KalshiPriceDistribution = {
  open_dollars?: string | null
  low_dollars?: string | null
  high_dollars?: string | null
  close_dollars?: string | null
  mean_dollars?: string | null
  previous_dollars?: string | null
  min_dollars?: string | null
  max_dollars?: string | null
}

export type KalshiCandlestick = {
  end_period_ts: number
  yes_bid: KalshiBidAskDistribution
  yes_ask: KalshiBidAskDistribution
  price: KalshiPriceDistribution
  volume_fp: string
  open_interest_fp: string
}

export type GetMarketCandlesticksResponse = {
  ticker: string
  candlesticks: KalshiCandlestick[]
}

export type PeriodInterval = 1 | 60 | 1440

export type MarketCandlesticks = {
  market: KalshiMarket
  bounds: MarketUnixBounds
  seriesTicker: string
  periodInterval: PeriodInterval
  startTs: number
  endTs: number
  candlesticks: KalshiCandlestick[]
}
