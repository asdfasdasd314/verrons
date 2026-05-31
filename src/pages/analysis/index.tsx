import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import {
  CandlestickSeries,
  ColorType,
  createChart,
  HistogramSeries,
  type IChartApi,
  type ISeriesApi,
} from 'lightweight-charts'
import {
  candlesticksToChartData,
  candlesticksToVolumeData,
  PERIOD_OPTIONS,
  VOLUME_DOWN_COLOR,
  VOLUME_UP_COLOR,
} from '../../lib/kalshi/candlesticks'
import { formatFp, formatToEastern } from '../../lib/kalshi/marketMeta'
import { getMarketCandlesticks } from '../../lib/kalshi/markets'
import type { KalshiCandlestick, KalshiMarket, PeriodInterval } from '../../lib/kalshi/types'
import './index.css'

function LayoutToggleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="currentColor"
        d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"
      />
    </svg>
  )
}

export default function AnalysisPage() {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null)

  const [isFullscreen, setIsFullscreen] = useState(false)
  const [ticker, setTicker] = useState('')
  const [loadingMarket, setLoadingMarket] = useState(false)
  const [marketError, setMarketError] = useState<string | null>(null)
  const [marketMeta, setMarketMeta] = useState<KalshiMarket | null>(null)
  const [loadedCandlesticks, setLoadedCandlesticks] = useState<KalshiCandlestick[]>(
    [],
  )
  const [periodInterval, setPeriodInterval] = useState<PeriodInterval>(1)
  const loadedTickerRef = useRef<string | null>(null)

  const applyCandlesToChart = useCallback((candlesticks: KalshiCandlestick[]) => {
    const series = candlestickSeriesRef.current
    const volumeSeries = volumeSeriesRef.current
    const chart = chartRef.current
    if (!series || !volumeSeries || !chart) return

    const chartData = candlesticksToChartData(candlesticks)
    const volumeData = candlesticksToVolumeData(candlesticks)

    series.setData(chartData)
    volumeSeries.setData(volumeData)

    if (chartData.length > 0 || volumeData.length > 0) {
      requestAnimationFrame(() => {
        chart.timeScale().fitContent()
      })
    }
  }, [])

  const loadMarketData = useCallback(
    async (marketTicker: string, interval: PeriodInterval) => {
      setLoadingMarket(true)
      setMarketError(null)
      setMarketMeta(null)

      try {
        const result = await getMarketCandlesticks(marketTicker, interval)
        const { market, bounds, seriesTicker, candlesticks, startTs, endTs } =
          result

        loadedTickerRef.current = bounds.ticker
        setMarketMeta(market)
        setLoadedCandlesticks(candlesticks)
        applyCandlesToChart(candlesticks)

        console.log(`[KalshiView] Market ${bounds.ticker}`, {
          series_ticker: seriesTicker,
          period_interval: interval,
          start_ts: startTs,
          end_ts: endTs,
        })

        const chartBars = candlesticksToChartData(candlesticks)
        console.log(`[KalshiView] Candlesticks ${bounds.ticker}`, {
          raw_count: candlesticks.length,
          chart_count: chartBars.length,
          first: chartBars[0] ?? null,
          last: chartBars.at(-1) ?? null,
        })

        if (chartBars.length === 0) {
          setMarketError('No tradable price candles in this range.')
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to load market'
        setMarketError(message)
        console.error('[KalshiView] Market fetch failed:', error)
      } finally {
        setLoadingMarket(false)
      }
    },
    [applyCandlesToChart],
  )

  async function handleMarketSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = ticker.trim()
    if (!trimmed) return

    await loadMarketData(trimmed, periodInterval)
  }

  function handlePeriodChange(interval: PeriodInterval) {
    if (interval === periodInterval) return
    setPeriodInterval(interval)
    const loaded = loadedTickerRef.current
    if (!loaded || loadingMarket) return
    void loadMarketData(loaded, interval)
  }

  useEffect(() => {
    const container = chartContainerRef.current
    if (!container) return

    const chart = createChart(container, {
      layout: {
        textColor: '#c5c8d4',
        background: { type: ColorType.Solid, color: '#0d0e12' },
      },
      grid: {
        vertLines: { color: '#1a1c24' },
        horzLines: { color: '#1a1c24' },
      },
      rightPriceScale: {
        borderColor: '#2e303a',
      },
      timeScale: {
        borderColor: '#2e303a',
        timeVisible: true,
        secondsVisible: false,
      },
    })

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: VOLUME_UP_COLOR,
      downColor: VOLUME_DOWN_COLOR,
      borderVisible: false,
      wickUpColor: VOLUME_UP_COLOR,
      wickDownColor: VOLUME_DOWN_COLOR,
    })

    candlestickSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.05,
        bottom: 0.25,
      },
    })

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    })

    chart.priceScale('volume').applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    })

    chartRef.current = chart
    candlestickSeriesRef.current = candlestickSeries
    volumeSeriesRef.current = volumeSeries

    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      chart.applyOptions({ width, height })
    })
    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
      chart.remove()
      chartRef.current = null
      candlestickSeriesRef.current = null
      volumeSeriesRef.current = null
    }
  }, [])

  useEffect(() => {
    if (loadedCandlesticks.length === 0) return
    const chart = chartRef.current
    if (!chart) return

    requestAnimationFrame(() => {
      chart.timeScale().fitContent()
    })
  }, [isFullscreen, loadedCandlesticks])

  return (
    <div className={`app ${isFullscreen ? 'app--fullscreen' : 'app--dashboard'}`}>
      <button
        type="button"
        className="layout-toggle"
        onClick={() => setIsFullscreen((value) => !value)}
        aria-label={isFullscreen ? 'Show dashboard layout' : 'Show fullscreen chart'}
        title={isFullscreen ? 'Dashboard layout' : 'Fullscreen chart'}
      >
        <LayoutToggleIcon />
      </button>

      <div className="workspace">
        <section className="chart-panel">
          <header className="panel-header panel-header--chart">
            <form className="market-form" onSubmit={handleMarketSubmit}>
              <label className="market-form-label" htmlFor="market-ticker">
                Ticker
              </label>
              <input
                id="market-ticker"
                className="market-form-input"
                type="text"
                value={ticker}
                onChange={(event) => setTicker(event.target.value)}
                placeholder="e.g. KXBTC-25JUN30"
                autoComplete="off"
                spellCheck={false}
                disabled={loadingMarket}
              />
              <nav className="period-tabs" aria-label="Candlestick interval">
                {PERIOD_OPTIONS.map((option) => (
                  <button
                    key={option.interval}
                    type="button"
                    className={
                      periodInterval === option.interval ? 'active' : undefined
                    }
                    disabled={loadingMarket}
                    onClick={() => handlePeriodChange(option.interval)}
                  >
                    {option.label}
                  </button>
                ))}
              </nav>
              <button
                className="market-form-submit"
                type="submit"
                disabled={loadingMarket || !ticker.trim()}
              >
                {loadingMarket ? 'Loading…' : 'Load'}
              </button>
            </form>
            {marketError && (
              <p className="market-form-error" role="alert">
                {marketError}
              </p>
            )}
          </header>
          <div ref={chartContainerRef} className="chart-container" />
        </section>

        {!isFullscreen && (
          <>
            <aside className="side-panel side-panel--meta">
              <header className="panel-header">
                <span className="panel-title">Market metadata</span>
              </header>
              <div className="panel-body panel-body--scroll">
                {marketMeta ? (
                  <div className="market-meta">
                    <p className="market-meta-title">{marketMeta.title ?? '—'}</p>
                    <dl className="market-meta-details">
                    <div className="market-meta-row">
                      <dt>Created</dt>
                      <dd>{formatToEastern(marketMeta.created_time)}</dd>
                    </div>
                    <div className="market-meta-row">
                      <dt>Open interest</dt>
                      <dd>{formatFp(marketMeta.open_interest_fp)}</dd>
                    </div>
                    <div className="market-meta-row">
                      <dt>24h volume</dt>
                      <dd>{formatFp(marketMeta.volume_24h_fp)}</dd>
                    </div>
                    <div className="market-meta-row">
                      <dt>Total volume</dt>
                      <dd>{formatFp(marketMeta.volume_fp)}</dd>
                    </div>
                    <div className="market-meta-row market-meta-row--rules">
                      <dt>Rules</dt>
                      <dd>{marketMeta.rules_primary ?? '—'}</dd>
                    </div>
                    </dl>
                  </div>
                ) : (
                  <p className="panel-empty">
                    Load a ticker to get market metadata.
                  </p>
                )}
              </div>
            </aside>

            <section className="bottom-panel">
              <header className="panel-header">
                <span className="panel-title">[To Be Populated]</span>
              </header>
              <div className="panel-body panel-body--placeholder">
                <p className="panel-empty">[To Be Populated]</p>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  )
}
