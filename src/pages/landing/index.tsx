import { useEffect, useMemo, useState } from 'react'
import {
  ChevronDown,
  Film,
  Fuel,
  Sparkles,
} from 'lucide-react'
import ScoreHistogram from '../../components/ScoreHistogram'
import { Badge } from '../../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { buildContinuousStrikeDistribution, rankMoviesByScore } from '../../lib/kalshi/distribution'
import {
  formatGasEventDate,
  formatGasPrice,
  gasMarketOpensAtLabel,
  type ActiveGasEvent,
} from '../../lib/kalshi/gasEvent'
import { fetchTodayAaaGasPrice } from '../../lib/aaa/fetchTodayGasPrice'
import {
  buildGasConsensusMathSteps,
  calculateGasMarketConsensus,
  formatGasConsensusHeadline,
} from '../../lib/aaa/gasConsensus'
import {
  fetchActiveGasMarkets,
  fetchOpenKxrtMarkets,
  groupMarketsByEvent,
  logEventMarketGroups,
} from '../../lib/kalshi/markets'
import type { KalshiMarket, RankedMovie, ScoreDistribution } from '../../lib/kalshi/types'

function GasCard({
  eventTicker,
  targetDateLabel,
  distribution,
  marketCount,
  todayGasPrice,
  isExpanded,
  onToggle,
}: {
  eventTicker: string
  targetDateLabel: string
  distribution: ScoreDistribution
  marketCount: number
  todayGasPrice: string | null
  isExpanded: boolean
  onToggle: () => void
}) {
  const consensus = useMemo(() => {
    if (!todayGasPrice) return null
    return calculateGasMarketConsensus(
      todayGasPrice,
      distribution.mean,
      distribution.stdDev,
    )
  }, [todayGasPrice, distribution.mean, distribution.stdDev])

  return (
    <Card
      className="cursor-pointer transition-all duration-200 hover:border-primary/50 bg-card border-border"
      onClick={onToggle}
    >
      <CardContent className="p-4">
        {consensus && (
          <div className="mb-4 pb-4 border-b border-border">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
              Market Consensus
            </div>
            <p className="text-sm font-medium text-foreground leading-snug">
              {formatGasConsensusHeadline(consensus)}
            </p>
          </div>
        )}

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                Kalshi AAA Gas
              </Badge>
              <span className="text-xs text-muted-foreground">{targetDateLabel}</span>
            </div>
            <h3 className="font-semibold text-foreground">US average gas price</h3>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span>
                Mean{' '}
                <span className="font-medium text-primary">
                  {formatGasPrice(distribution.mean)}
                </span>
              </span>
              <span>
                Std dev{' '}
                <span className="font-medium text-foreground">
                  {formatGasPrice(distribution.stdDev)}
                </span>
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {marketCount} strike {marketCount === 1 ? 'market' : 'markets'} · {eventTicker}
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-3xl font-bold text-primary">
              {formatGasPrice(distribution.mean)}
            </div>
            <div className="text-xs text-muted-foreground">Est. / gal</div>
          </div>
        </div>

        <div
          className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[48rem] mt-4 pt-4 border-t border-border' : 'max-h-0'}`}
        >
          {consensus && (
            <div className="mb-4 space-y-2">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">
                Consensus math
              </div>
              <div className="space-y-2 text-sm">
                {buildGasConsensusMathSteps(consensus).map((step) => (
                  <div
                    key={step.label}
                    className="grid grid-cols-1 sm:grid-cols-[9rem_1fr_auto] gap-1 sm:gap-3 bg-secondary/40 rounded-lg px-3 py-2"
                  >
                    <span className="text-muted-foreground">{step.label}</span>
                    <span className="font-mono text-xs text-muted-foreground">{step.expression}</span>
                    <span className="font-medium text-foreground sm:text-right">{step.result}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <ScoreHistogram
            distribution={distribution}
            meanLabel="Est. price"
            stdDevLabel="Std dev"
            formatValue={formatGasPrice}
          />
        </div>

        <div className="flex justify-center mt-3">
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          />
        </div>
      </CardContent>
    </Card>
  )
}

function MovieCard({
  movie,
  isExpanded,
  onToggle,
}: {
  movie: RankedMovie
  isExpanded: boolean
  onToggle: () => void
}) {
  return (
    <Card
      className="cursor-pointer transition-all duration-200 hover:border-primary/50 bg-card border-border"
      onClick={onToggle}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                #{movie.rank}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {movie.marketCount} {movie.marketCount === 1 ? 'market' : 'markets'}
              </span>
            </div>
            <h3 className="font-semibold text-foreground">{movie.movieTitle}</h3>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <span>Verrons score</span>
              <span className="font-medium text-primary">{movie.movieScore.toFixed(2)}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-primary">
              {movie.distribution.mean.toFixed(0)}
            </div>
            <div className="text-xs text-muted-foreground">Est. RT</div>
          </div>
        </div>

        <div
          className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[28rem] mt-4 pt-4 border-t border-border' : 'max-h-0'}`}
        >
          <ScoreHistogram distribution={movie.distribution} />
        </div>

        <div className="flex justify-center mt-3">
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          />
        </div>
      </CardContent>
    </Card>
  )
}

export default function LandingPage() {
  const [movieMarkets, setMovieMarkets] = useState<KalshiMarket[]>([])
  const [gasEvent, setGasEvent] = useState<ActiveGasEvent | null>(null)
  const [gasMarkets, setGasMarkets] = useState<KalshiMarket[]>([])
  const [todayGasPrice, setTodayGasPrice] = useState<string | null>(null)
  const [loadingMovies, setLoadingMovies] = useState(true)
  const [loadingGas, setLoadingGas] = useState(true)
  const [movieError, setMovieError] = useState<string | null>(null)
  const [gasError, setGasError] = useState<string | null>(null)
  const [expandedGas, setExpandedGas] = useState(false)
  const [expandedMovie, setExpandedMovie] = useState<string | null>(null)

  const rankedMovies = useMemo(
    () => rankMoviesByScore(movieMarkets, groupMarketsByEvent(movieMarkets)).slice(0, 5),
    [movieMarkets],
  )

  const gasDistribution = useMemo(
    () => buildContinuousStrikeDistribution(gasMarkets),
    [gasMarkets],
  )

  const gasTargetDateLabel = gasEvent
    ? formatGasEventDate(gasEvent.eventTicker)
    : 'Loading…'

  const gasPanelSubtitle = gasEvent?.isTomorrowsMarketOpen
    ? `Kalshi strikes for ${gasTargetDateLabel}`
    : `Today (${gasTargetDateLabel}), opens ${gasMarketOpensAtLabel()}`

  useEffect(() => {
    let cancelled = false

    fetchOpenKxrtMarkets()
      .then((data) => {
        if (!cancelled) {
          setMovieMarkets(data)
          logEventMarketGroups(groupMarketsByEvent(data))
          setLoadingMovies(false)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setMovieError(err instanceof Error ? err.message : 'Failed to load movie markets')
          setLoadingMovies(false)
        }
      })

    fetchTodayAaaGasPrice()
      .then((price) => {
        if (!cancelled) {
          setTodayGasPrice(price)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          console.warn(
            '[AAA] Failed to load today gas price:',
            err instanceof Error ? err.message : err,
          )
        }
      })

    fetchActiveGasMarkets()
      .then(({ event, markets }) => {
        if (!cancelled) {
          setGasEvent(event)
          setGasMarkets(markets)
          const distribution = buildContinuousStrikeDistribution(markets)
          if (distribution) {
            console.log(
              `[KXAAAGASD] ${event.eventTicker} — mean ${formatGasPrice(distribution.mean)}, std dev ${formatGasPrice(distribution.stdDev)}`,
            )
          }
          setLoadingGas(false)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setGasError(err instanceof Error ? err.message : 'Failed to load gas markets')
          setLoadingGas(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <a className="flex items-center gap-2.5" href="/">
              <img
                src="/verrons-logo.png"
                alt="Verrons"
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
              />
              <span className="text-xl font-bold text-foreground">Verrons</span>
            </a>
            <Badge variant="outline" className="border-primary/30 text-primary">
              <Sparkles className="h-3 w-3 mr-1" />
              Demo
            </Badge>
          </div>
        </div>
      </header>

      <section className="border-b border-border bg-secondary/30">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 text-balance">
              See Tomorrow Before It Happens
            </h1>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed text-pretty">
              Verrons pulls real-time probabilities from Kalshi prediction markets to estimate
              tomorrow&apos;s gas prices and rank upcoming movies so you can decide when to fill
              up and what to watch.
            </p>

            <Card className="bg-card border-border text-left">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-foreground">
                  <Sparkles className="h-4 w-4 text-primary" />
                  How It Works
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="flex gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
                    1
                  </div>
                  <p>
                    <span className="text-foreground font-medium">Gas panel</span> extracts
                    Kalshi&apos;s expected gasoline price and compares to national average; expand
                    to see the math behind the market confidence.
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
                    2
                  </div>
                  <p>
                    <span className="text-foreground font-medium">We convert</span> those
                    cumulative probabilities into a price distribution, then compute the mean and
                    standard deviation. Click the card to see the full histogram.
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
                    3
                  </div>
                  <p>
                    <span className="text-foreground font-medium">Movies panel</span> ranks open
                    Rotten Tomatoes markets by our composite score; expand any title for its
                    score distribution.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Fuel className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Predicted Gas Prices</h2>
                <p className="text-sm text-muted-foreground">{gasPanelSubtitle}</p>
              </div>
            </div>

            {loadingGas && (
              <p className="text-sm text-muted-foreground">Loading gas markets…</p>
            )}
            {gasError && <p className="text-sm text-red-400">{gasError}</p>}
            {!loadingGas && !gasError && gasMarkets.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No markets found for the active event
                {gasEvent ? ` (${gasEvent.eventTicker})` : ''}.
              </p>
            )}
            {!loadingGas && !gasError && gasMarkets.length > 0 && !gasDistribution && (
              <p className="text-sm text-muted-foreground">
                Markets loaded but could not build a distribution.
              </p>
            )}
            {!loadingGas && !gasError && gasDistribution && gasEvent && (
              <GasCard
                eventTicker={gasEvent.eventTicker}
                targetDateLabel={gasTargetDateLabel}
                distribution={gasDistribution}
                marketCount={gasMarkets.length}
                todayGasPrice={todayGasPrice}
                isExpanded={expandedGas}
                onToggle={() => setExpandedGas((value) => !value)}
              />
            )}
          </div>

          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Film className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Top Predicted Movies</h2>
                <p className="text-sm text-muted-foreground">Kalshi Rotten Tomatoes markets</p>
              </div>
            </div>

            {loadingMovies && (
              <p className="text-sm text-muted-foreground">Loading markets…</p>
            )}
            {movieError && <p className="text-sm text-red-400">{movieError}</p>}
            {!loadingMovies && !movieError && rankedMovies.length === 0 && (
              <p className="text-sm text-muted-foreground">No open events found.</p>
            )}
            {!loadingMovies && !movieError && rankedMovies.length > 0 && (
              <div className="space-y-4">
                {rankedMovies.map((movie) => (
                  <MovieCard
                    key={movie.movieTitle}
                    movie={movie}
                    isExpanded={expandedMovie === movie.movieTitle}
                    onToggle={() =>
                      setExpandedMovie(
                        expandedMovie === movie.movieTitle ? null : movie.movieTitle,
                      )
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-card/50 mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>Verrons: real-time prediction market intelligence</p>
            <p>Data sourced from Kalshi</p>
          </div>
          <p className="text-center text-sm text-muted-foreground mt-4">
            Built by{' '}
            <a
              href="https://github.com/asdfasdasd314"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              James Hollingsworth
            </a>
          </p>
        </div>
      </footer>
    </main>
  )
}
