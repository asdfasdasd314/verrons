import { useState } from 'react'
import type { ScoreDistribution } from '../lib/kalshi/types'
import './ScoreHistogram.css'

type ScoreHistogramProps = {
  distribution: ScoreDistribution
  meanLabel?: string
  stdDevLabel?: string
  formatValue?: (value: number) => string
}

function buildYAxisTicks(axisMaxPct: number): number[] {
  const step = axisMaxPct <= 10 ? 2 : axisMaxPct <= 25 ? 5 : 10
  const ticks: number[] = []
  for (let value = 0; value <= axisMaxPct; value += step) {
    ticks.push(value)
  }
  if (ticks[ticks.length - 1] !== axisMaxPct) {
    ticks.push(axisMaxPct)
  }
  return ticks
}

export default function ScoreHistogram({
  distribution,
  meanLabel = 'Est. score',
  stdDevLabel = 'Std dev',
  formatValue = (value) => value.toFixed(1),
}: ScoreHistogramProps) {
  const [hoveredBucket, setHoveredBucket] = useState<string | null>(null)
  const maxProbability = Math.max(...distribution.buckets.map((bucket) => bucket.probability))
  const maxProbabilityPct = maxProbability * 100
  const axisMaxPct = Math.max(5, Math.ceil(maxProbabilityPct / 5) * 5)
  const yAxisTicks = buildYAxisTicks(axisMaxPct)

  return (
    <div className="score-histogram">
      <div className="score-histogram-stats">
        <div className="score-histogram-stat">
          <span className="score-histogram-stat-label">{meanLabel}</span>
          <span className="score-histogram-stat-value">
            {formatValue(distribution.mean)}
          </span>
        </div>
        <div className="score-histogram-stat">
          <span className="score-histogram-stat-label">{stdDevLabel}</span>
          <span className="score-histogram-stat-value">
            {formatValue(distribution.stdDev)}
          </span>
        </div>
      </div>

      <div className="score-histogram-chart-area">
        <div className="score-histogram-plot">
          <div className="score-histogram-bars-area">
            <div className="score-histogram-chart" role="img" aria-label="Score probability histogram">
              {distribution.buckets.map((bucket) => {
                const bucketKey = `${bucket.minScore}-${bucket.maxScore}`
                const probabilityPct = bucket.probability * 100
                const height = (probabilityPct / axisMaxPct) * 100
                const isHovered = hoveredBucket === bucketKey

                return (
                  <div key={bucketKey} className="score-histogram-bar-group">
                    <div
                      className="score-histogram-bar-wrap"
                      onMouseEnter={() => setHoveredBucket(bucketKey)}
                      onMouseLeave={() => setHoveredBucket(null)}
                    >
                      {isHovered && (
                        <div className="score-histogram-tooltip">
                          {probabilityPct.toFixed(1)}%
                        </div>
                      )}
                      <div
                        className="score-histogram-bar"
                        style={{ height: `${height}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="score-histogram-labels">
            {distribution.buckets.map((bucket) => (
              <span
                key={`${bucket.minScore}-${bucket.maxScore}-label`}
                className="score-histogram-bar-label"
              >
                {bucket.label}
              </span>
            ))}
          </div>
        </div>

        <div className="score-histogram-y-axis" aria-hidden="true">
          <div className="score-histogram-y-axis-track">
            {yAxisTicks.map((tick) => (
              <span
                key={tick}
                className="score-histogram-y-axis-tick"
                style={{ bottom: `${(tick / axisMaxPct) * 100}%` }}
              >
                {tick}%
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
