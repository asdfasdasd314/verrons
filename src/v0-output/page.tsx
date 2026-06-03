"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Film,
  Trophy,
  ChevronDown,
  Sparkles,
  BarChart3,
  Activity,
} from "lucide-react"

type Movie = {
  id: number
  title: string
  releaseDate: string
  predictedScore: number
  marketVolume: string
  trend: "up" | "down" | "stable"
  trendValue: string
  genre: string
  odds: {
    fresh: number
    rotten: number
  }
  marketActivity: string
  recentShift: string
}

type SportsMatch = {
  id: number
  sport: string
  teams: string
  date: string
  marketTightness: number
  popularityScore: number
  trend: "up" | "down" | "stable"
  trendValue: string
  odds: {
    team1: number
    team2: number
    draw?: number
  }
  volume: string
  bigMoves: string
}

const movies: Movie[] = [
  {
    id: 1,
    title: "Horizon: Chapter 3",
    releaseDate: "Jul 12, 2026",
    predictedScore: 89,
    marketVolume: "$2.4M",
    trend: "up",
    trendValue: "+12%",
    genre: "Sci-Fi",
    odds: { fresh: 89, rotten: 11 },
    marketActivity: "Very High",
    recentShift: "Fresh odds up 8% in 24h",
  },
  {
    id: 2,
    title: "The Last Frontier",
    releaseDate: "Aug 3, 2026",
    predictedScore: 76,
    marketVolume: "$1.8M",
    trend: "stable",
    trendValue: "+2%",
    genre: "Drama",
    odds: { fresh: 76, rotten: 24 },
    marketActivity: "Medium",
    recentShift: "Stable last 48h",
  },
  {
    id: 3,
    title: "Neon Knights",
    releaseDate: "Jul 28, 2026",
    predictedScore: 82,
    marketVolume: "$3.1M",
    trend: "up",
    trendValue: "+18%",
    genre: "Action",
    odds: { fresh: 82, rotten: 18 },
    marketActivity: "High",
    recentShift: "Major buy pressure detected",
  },
  {
    id: 4,
    title: "Echoes of Tomorrow",
    releaseDate: "Sep 15, 2026",
    predictedScore: 67,
    marketVolume: "$890K",
    trend: "down",
    trendValue: "-5%",
    genre: "Thriller",
    odds: { fresh: 67, rotten: 33 },
    marketActivity: "Low",
    recentShift: "Sell-off after trailer",
  },
  {
    id: 5,
    title: "Midnight in Paris 2",
    releaseDate: "Oct 1, 2026",
    predictedScore: 91,
    marketVolume: "$4.2M",
    trend: "up",
    trendValue: "+7%",
    genre: "Romance",
    odds: { fresh: 91, rotten: 9 },
    marketActivity: "Very High",
    recentShift: "Woody Allen directing buzz",
  },
]

const sportsMatches: SportsMatch[] = [
  {
    id: 1,
    sport: "NBA",
    teams: "Lakers vs Celtics",
    date: "Jun 8, 2026",
    marketTightness: 94,
    popularityScore: 98,
    trend: "up",
    trendValue: "+15%",
    odds: { team1: 48, team2: 52 },
    volume: "$8.2M",
    bigMoves: "Heavy Celtics action last 6h",
  },
  {
    id: 2,
    sport: "NFL",
    teams: "Chiefs vs 49ers",
    date: "Feb 7, 2027",
    marketTightness: 88,
    popularityScore: 95,
    trend: "stable",
    trendValue: "+3%",
    odds: { team1: 54, team2: 46 },
    volume: "$12.5M",
    bigMoves: "Steady accumulation",
  },
  {
    id: 3,
    sport: "Soccer",
    teams: "Man City vs Real Madrid",
    date: "Jun 15, 2026",
    marketTightness: 91,
    popularityScore: 89,
    trend: "up",
    trendValue: "+22%",
    odds: { team1: 42, team2: 35, draw: 23 },
    volume: "$15.8M",
    bigMoves: "Draw odds spiking",
  },
  {
    id: 4,
    sport: "MLB",
    teams: "Yankees vs Dodgers",
    date: "Oct 20, 2026",
    marketTightness: 72,
    popularityScore: 82,
    trend: "down",
    trendValue: "-8%",
    odds: { team1: 44, team2: 56 },
    volume: "$3.1M",
    bigMoves: "Dodgers momentum fading",
  },
  {
    id: 5,
    sport: "UFC",
    teams: "Jones vs Aspinall",
    date: "Jul 4, 2026",
    marketTightness: 67,
    popularityScore: 91,
    trend: "up",
    trendValue: "+31%",
    odds: { team1: 62, team2: 38 },
    volume: "$6.7M",
    bigMoves: "Aspinall odds shortening fast",
  },
]

function TrendIcon({ trend }: { trend: "up" | "down" | "stable" }) {
  if (trend === "up") return <TrendingUp className="h-4 w-4 text-primary" />
  if (trend === "down") return <TrendingDown className="h-4 w-4 text-red-400" />
  return <Minus className="h-4 w-4 text-muted-foreground" />
}

function MovieCard({ movie, isExpanded, onToggle }: { movie: Movie; isExpanded: boolean; onToggle: () => void }) {
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
                {movie.genre}
              </Badge>
              <span className="text-xs text-muted-foreground">{movie.releaseDate}</span>
            </div>
            <h3 className="font-semibold text-foreground truncate">{movie.title}</h3>
            <div className="flex items-center gap-2 mt-2">
              <TrendIcon trend={movie.trend} />
              <span
                className={`text-sm font-medium ${
                  movie.trend === "up" ? "text-primary" : movie.trend === "down" ? "text-red-400" : "text-muted-foreground"
                }`}
              >
                {movie.trendValue}
              </span>
              <span className="text-xs text-muted-foreground">24h</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-primary">{movie.predictedScore}</div>
            <div className="text-xs text-muted-foreground">Predicted RT</div>
          </div>
        </div>

        <div
          className={`overflow-hidden transition-all duration-300 ${isExpanded ? "max-h-96 mt-4 pt-4 border-t border-border" : "max-h-0"}`}
        >
          <div className="space-y-4">
            <div>
              <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Market Odds</div>
              <div className="flex gap-2">
                <div className="flex-1 bg-primary/20 rounded-lg p-3">
                  <div className="text-lg font-bold text-primary">{movie.odds.fresh}%</div>
                  <div className="text-xs text-muted-foreground">Fresh</div>
                </div>
                <div className="flex-1 bg-secondary rounded-lg p-3">
                  <div className="text-lg font-bold text-foreground">{movie.odds.rotten}%</div>
                  <div className="text-xs text-muted-foreground">Rotten</div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground text-xs">Volume</div>
                <div className="font-semibold text-foreground">{movie.marketVolume}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Activity</div>
                <div className="font-semibold text-foreground">{movie.marketActivity}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm bg-secondary/50 rounded-lg p-3">
              <Activity className="h-4 w-4 text-primary" />
              <span className="text-foreground">{movie.recentShift}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-center mt-3">
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
          />
        </div>
      </CardContent>
    </Card>
  )
}

function SportsCard({ match, isExpanded, onToggle }: { match: SportsMatch; isExpanded: boolean; onToggle: () => void }) {
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
                {match.sport}
              </Badge>
              <span className="text-xs text-muted-foreground">{match.date}</span>
            </div>
            <h3 className="font-semibold text-foreground">{match.teams}</h3>
            <div className="flex items-center gap-2 mt-2">
              <TrendIcon trend={match.trend} />
              <span
                className={`text-sm font-medium ${
                  match.trend === "up" ? "text-primary" : match.trend === "down" ? "text-red-400" : "text-muted-foreground"
                }`}
              >
                {match.trendValue}
              </span>
              <span className="text-xs text-muted-foreground">volume</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-primary">{match.marketTightness}%</div>
            <div className="text-xs text-muted-foreground">Tightness</div>
          </div>
        </div>

        <div
          className={`overflow-hidden transition-all duration-300 ${isExpanded ? "max-h-96 mt-4 pt-4 border-t border-border" : "max-h-0"}`}
        >
          <div className="space-y-4">
            <div>
              <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Market Odds</div>
              <div className="flex gap-2">
                <div className="flex-1 bg-primary/20 rounded-lg p-3">
                  <div className="text-lg font-bold text-primary">{match.odds.team1}%</div>
                  <div className="text-xs text-muted-foreground truncate">{match.teams.split(" vs ")[0]}</div>
                </div>
                {match.odds.draw !== undefined && (
                  <div className="flex-1 bg-secondary rounded-lg p-3">
                    <div className="text-lg font-bold text-foreground">{match.odds.draw}%</div>
                    <div className="text-xs text-muted-foreground">Draw</div>
                  </div>
                )}
                <div className="flex-1 bg-secondary rounded-lg p-3">
                  <div className="text-lg font-bold text-foreground">{match.odds.team2}%</div>
                  <div className="text-xs text-muted-foreground truncate">{match.teams.split(" vs ")[1]}</div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground text-xs">Volume</div>
                <div className="font-semibold text-foreground">{match.volume}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Popularity</div>
                <div className="font-semibold text-foreground">{match.popularityScore}/100</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm bg-secondary/50 rounded-lg p-3">
              <Activity className="h-4 w-4 text-primary" />
              <span className="text-foreground">{match.bigMoves}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-center mt-3">
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
          />
        </div>
      </CardContent>
    </Card>
  )
}

export default function HomePage() {
  const [expandedMovie, setExpandedMovie] = useState<number | null>(null)
  const [expandedMatch, setExpandedMatch] = useState<number | null>(null)

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">Verrons</span>
            </div>
            <Badge variant="outline" className="border-primary/30 text-primary">
              <Sparkles className="h-3 w-3 mr-1" />
              Demo
            </Badge>
          </div>
        </div>
      </header>

      {/* Hero / Instructions */}
      <section className="border-b border-border bg-secondary/30">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 text-balance">
              Predict What&apos;s Worth Watching
            </h1>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed text-pretty">
              Verrons pulls real-time data from prediction markets like Kalshi to help you discover
              the best upcoming movies and most exciting sports matches before they happen.
            </p>

            <Card className="bg-card border-border text-left">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-foreground">
                  <Sparkles className="h-4 w-4 text-primary" />
                  How to Use This Demo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="flex gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
                    1
                  </div>
                  <p>
                    <span className="text-foreground font-medium">Scroll down</span> to see the top predicted movies and
                    most exciting sports matches ranked by prediction market data.
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
                    2
                  </div>
                  <p>
                    <span className="text-foreground font-medium">Click any card</span> to expand and see the
                    underlying market data: odds, volume, activity, and recent shifts.
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
                    3
                  </div>
                  <p>
                    <span className="text-foreground font-medium">Watch for trends</span> — green arrows indicate rising
                    market confidence, helping you spot must-watch content early.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sports Column */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Trophy className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Upcoming Matches</h2>
                <p className="text-sm text-muted-foreground">Ranked by market tightness & excitement</p>
              </div>
            </div>
            <div className="space-y-4">
              {sportsMatches.map((match) => (
                <SportsCard
                  key={match.id}
                  match={match}
                  isExpanded={expandedMatch === match.id}
                  onToggle={() => setExpandedMatch(expandedMatch === match.id ? null : match.id)}
                />
              ))}
            </div>
          </div>

          {/* Movies Column */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Film className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Top Predicted Movies</h2>
                <p className="text-sm text-muted-foreground">Rotten Tomatoes market predictions</p>
              </div>
            </div>
            <div className="space-y-4">
              {movies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  isExpanded={expandedMovie === movie.id}
                  onToggle={() => setExpandedMovie(expandedMovie === movie.id ? null : movie.id)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>
              Verrons — Real-time prediction market intelligence
            </p>
            <p>
              Data sourced from Kalshi, Polymarket, and other prediction markets
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}
