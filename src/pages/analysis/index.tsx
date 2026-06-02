import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import {
  CandlestickSeries,
  ColorType,
  createChart,
  HistogramSeries,
  LineSeries,
  type IChartApi,
  type ISeriesApi,
} from 'lightweight-charts'
import {
  candlesticksToChartData,
  candlesticksToVolumeData,
  chartDataToLineData,
  VOLUME_DOWN_COLOR,
  VOLUME_UP_COLOR,
} from '../../lib/kalshi/candlesticks'
import {
  exponentialMovingAverage,
  relativeStrengthIndex,
  simpleMovingAverage,
  type PricePoint,
} from '../../lib/kalshi/indicators'
import { formatFp, formatToEastern } from '../../lib/kalshi/marketMeta'
import { getMarketChartData, isTickChartData } from '../../lib/kalshi/markets'
import {
  isSingleTradeLineTimeframe,
  isTickTimeframe,
  TIMEFRAME_GROUPS,
  timeframeFromSelectValue,
  timeframeToSelectValue,
  ticksPerBar,
} from '../../lib/kalshi/timeframes'
import {
  tradesToChartSeries,
  tradesToLineData,
  tradesToLineVolumeData,
} from '../../lib/kalshi/trades'
import type {
  ChartTimeframe,
  KalshiCandlestick,
  KalshiMarket,
  KalshiTrade,
} from '../../lib/kalshi/types'
import './index.css'

const INDICATOR_COLORS = ['#f59e0b', '#5b8def', '#a78bfa', '#ec4899']
const RSI_PANE_INDEX = 1
const MAIN_PANE_STRETCH = 72
const RSI_PANE_STRETCH = 24

type PendingIndicatorType = 'sma' | 'ema' | 'rsi'

type ChartViewMode = 'candles' | 'line'

type ChartIndicator =
  | { id: string; type: 'sma'; period: number; color: string }
  | { id: string; type: 'ema'; period: number; color: string }
  | { id: string; type: 'rsi'; period: number; color: string }

function nextIndicatorColor(indicators: ChartIndicator[]): string {
  return INDICATOR_COLORS[indicators.length % INDICATOR_COLORS.length]
}

function isOverlayIndicator(
  indicator: ChartIndicator,
): indicator is Extract<ChartIndicator, { type: 'sma' | 'ema' }> {
  return indicator.type === 'sma' || indicator.type === 'ema'
}

function indicatorSeriesData(
  indicator: ChartIndicator,
  closeSeries: PricePoint[],
) {
  switch (indicator.type) {
    case 'sma':
      return simpleMovingAverage(closeSeries, indicator.period)
    case 'ema':
      return exponentialMovingAverage(closeSeries, indicator.period)
    case 'rsi':
      return relativeStrengthIndex(closeSeries, indicator.period)
  }
}

function getClosePriceSeries(
  mode: ChartTimeframe,
  candlesticks: KalshiCandlestick[],
  trades: KalshiTrade[],
): PricePoint[] {
  if (isSingleTradeLineTimeframe(mode)) {
    return tradesToLineData(trades)
  }

  if (isTickTimeframe(mode)) {
    const { chartData } = tradesToChartSeries(trades, ticksPerBar(mode))
    return chartData.map((bar) => ({ time: bar.time, value: bar.close }))
  }

  return candlesticksToChartData(candlesticks).map((bar) => ({
    time: bar.time,
    value: bar.close,
  }))
}

function indicatorLabel(indicator: ChartIndicator): string {
  switch (indicator.type) {
    case 'sma':
      return `SMA (${indicator.period})`
    case 'ema':
      return `EMA (${indicator.period})`
    case 'rsi':
      return `RSI (${indicator.period})`
  }
}

function defaultPeriodForIndicator(type: PendingIndicatorType): string {
  return type === 'rsi' ? '14' : '20'
}

function indicatorModalCopy(type: PendingIndicatorType): {
  title: string
  description: string
} {
  switch (type) {
    case 'sma':
      return {
        title: 'Simple moving average',
        description:
          'Average of the last N closes. The line starts after N bars are available.',
      }
    case 'ema':
      return {
        title: 'Exponential moving average',
        description:
          'Weighted average that reacts faster to recent closes. Seeded with an N-bar SMA.',
      }
    case 'rsi':
      return {
        title: 'Relative strength index',
        description:
          'Momentum oscillator (0–100) using Wilder smoothing. Shown in a pane below the chart.',
      }
  }
}

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

type IndicatorsPanelProps = {
  indicators: ChartIndicator[]
  onAddSelect: (value: string) => void
  onRemove: (id: string) => void
}

function IndicatorsPanel({
  indicators,
  onAddSelect,
  onRemove,
}: IndicatorsPanelProps) {
  return (
    <div className="indicators-panel">
      <div className="indicators-panel-row">
        <label className="indicators-label" htmlFor="add-indicator">
          Add indicator
        </label>
        <select
          id="add-indicator"
          className="indicators-select"
          value=""
          onChange={(event) => {
            const value = event.target.value
            if (value) onAddSelect(value)
          }}
        >
          <option value="" disabled>
            Select…
          </option>
          <option value="sma">Simple moving average</option>
          <option value="ema">Exponential moving average</option>
          <option value="rsi">Relative strength index</option>
        </select>
      </div>
      {indicators.length === 0 ? (
        <p className="panel-empty indicators-empty">
          No indicators on the chart. Add moving averages on close prices or RSI in
          a sub-pane below.
        </p>
      ) : (
        <ul className="indicators-list">
          {indicators.map((indicator) => (
            <li key={indicator.id} className="indicators-list-item">
              <span
                className="indicators-swatch"
                style={{ backgroundColor: indicator.color }}
                aria-hidden="true"
              />
              <span className="indicators-list-label">
                {indicatorLabel(indicator)}
              </span>
              <button
                type="button"
                className="indicators-remove"
                onClick={() => onRemove(indicator.id)}
                aria-label={`Remove ${indicatorLabel(indicator)}`}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

type IndicatorConfigModalProps = {
  titleId: string
  indicator: PendingIndicatorType
  draft: string
  error: string | null
  onDraftChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onClose: () => void
}

function IndicatorConfigModal({
  titleId,
  indicator,
  draft,
  error,
  onDraftChange,
  onSubmit,
  onClose,
}: IndicatorConfigModalProps) {
  const { title, description } = indicatorModalCopy(indicator)

  return (
    <div className="indicator-modal-backdrop" onClick={onClose}>
      <div
        className="indicator-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={titleId} className="indicator-modal-title">
          {title}
        </h2>
        <p className="indicator-modal-desc">{description}</p>
        <form className="indicator-modal-form" onSubmit={onSubmit}>
          <label className="indicators-label" htmlFor="indicator-lookback">
            {indicator === 'rsi' ? 'Period (candles)' : 'Lookback (candles)'}
          </label>
          <input
            id="indicator-lookback"
            className="market-form-input indicator-modal-input"
            type="number"
            min={1}
            step={1}
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            autoFocus
          />
          {error && (
            <p className="market-form-error" role="alert">
              {error}
            </p>
          )}
          <div className="indicator-modal-actions">
            <button type="button" className="market-form-submit" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="market-form-submit indicator-modal-apply">
              Apply
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AnalysisPage() {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const lineSeriesRef = useRef<ISeriesApi<'Line'> | null>(null)
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null)
  const indicatorSeriesRef = useRef<Map<string, ISeriesApi<'Line'>>>(new Map())
  const closeSeriesRef = useRef<PricePoint[]>([])

  const [isFullscreen, setIsFullscreen] = useState(false)
  const [indicators, setIndicators] = useState<ChartIndicator[]>([])
  const [pendingIndicator, setPendingIndicator] = useState<PendingIndicatorType | null>(
    null,
  )
  const [periodDraft, setPeriodDraft] = useState('20')
  const [periodError, setPeriodError] = useState<string | null>(null)
  const indicatorModalTitleId = useId()
  const [ticker, setTicker] = useState('')
  const [loadingMarket, setLoadingMarket] = useState(false)
  const [marketError, setMarketError] = useState<string | null>(null)
  const [marketMeta, setMarketMeta] = useState<KalshiMarket | null>(null)
  const [loadedCandlesticks, setLoadedCandlesticks] = useState<KalshiCandlestick[]>(
    [],
  )
  const [loadedTrades, setLoadedTrades] = useState<KalshiTrade[]>([])
  const [timeframe, setTimeframe] = useState<ChartTimeframe>(1)
  const [chartView, setChartView] = useState<ChartViewMode>('candles')
  const loadedTickerRef = useRef<string | null>(null)

  const candlesViewDisabled = isSingleTradeLineTimeframe(timeframe)
  const effectiveChartView: ChartViewMode = candlesViewDisabled ? 'line' : chartView

  const syncIndicators = useCallback(
    (chart: IChartApi, activeIndicators: ChartIndicator[], closeSeries: PricePoint[]) => {
      const seriesById = indicatorSeriesRef.current
      const activeIds = new Set(activeIndicators.map((item) => item.id))
      const hasRsi = activeIndicators.some((item) => item.type === 'rsi')

      for (const [id, series] of seriesById) {
        if (!activeIds.has(id)) {
          chart.removeSeries(series)
          seriesById.delete(id)
        }
      }

      if (!hasRsi && chart.panes().length > RSI_PANE_INDEX) {
        chart.removePane(RSI_PANE_INDEX)
      }

      if (hasRsi && chart.panes().length <= RSI_PANE_INDEX) {
        chart.addPane()
        const panes = chart.panes()
        panes[0]?.setStretchFactor(MAIN_PANE_STRETCH)
        panes[RSI_PANE_INDEX]?.setStretchFactor(RSI_PANE_STRETCH)
      }

      activeIndicators.filter(isOverlayIndicator).forEach((indicator) => {
        const data = indicatorSeriesData(indicator, closeSeries)
        let series = seriesById.get(indicator.id)

        if (!series) {
          series = chart.addSeries(LineSeries, {
            color: indicator.color,
            lineWidth: 2,
            priceLineVisible: false,
            lastValueVisible: true,
          })
          series.priceScale().applyOptions({
            scaleMargins: {
              top: 0.05,
              bottom: 0.25,
            },
          })
          seriesById.set(indicator.id, series)
        } else {
          series.applyOptions({ color: indicator.color })
        }

        series.setData(data)
      })

      activeIndicators
        .filter((item): item is Extract<ChartIndicator, { type: 'rsi' }> => item.type === 'rsi')
        .forEach((indicator) => {
          const data = indicatorSeriesData(indicator, closeSeries)
          let series = seriesById.get(indicator.id)

          if (!series) {
            series = chart.addSeries(
              LineSeries,
              {
                color: indicator.color,
                lineWidth: 2,
                priceLineVisible: false,
                lastValueVisible: true,
              },
              RSI_PANE_INDEX,
            )
            series.priceScale().applyOptions({
              scaleMargins: {
                top: 0.1,
                bottom: 0.1,
              },
            })
            seriesById.set(indicator.id, series)
          } else {
            series.applyOptions({ color: indicator.color })
          }

          series.setData(data)
        })
    },
    [],
  )

  const applyChartData = useCallback(
    (
      mode: ChartTimeframe,
      candlesticks: KalshiCandlestick[],
      trades: KalshiTrade[],
    ) => {
      const candleSeries = candlestickSeriesRef.current
      const lineSeries = lineSeriesRef.current
      const volumeSeries = volumeSeriesRef.current
      const chart = chartRef.current
      if (!candleSeries || !lineSeries || !volumeSeries || !chart) return

      const useLine =
        effectiveChartView === 'line' || isSingleTradeLineTimeframe(mode)
      const secondsVisible =
        isSingleTradeLineTimeframe(mode) || isTickTimeframe(mode)

      if (useLine) {
        let lineData
        let volumeData

        if (isSingleTradeLineTimeframe(mode)) {
          lineData = tradesToLineData(trades)
          volumeData = tradesToLineVolumeData(trades)
        } else if (isTickTimeframe(mode)) {
          const series = tradesToChartSeries(trades, ticksPerBar(mode))
          lineData = chartDataToLineData(series.chartData)
          volumeData = series.volumeData
        } else {
          const chartData = candlesticksToChartData(candlesticks)
          lineData = chartDataToLineData(chartData)
          volumeData = candlesticksToVolumeData(candlesticks)
        }

        lineSeries.setData(lineData)
        candleSeries.setData([])
        volumeSeries.setData(volumeData)
        lineSeries.applyOptions({ visible: true })
        candleSeries.applyOptions({ visible: false })
      } else {
        lineSeries.setData([])
        lineSeries.applyOptions({ visible: false })
        candleSeries.applyOptions({ visible: true })

        if (isTickTimeframe(mode)) {
          const { chartData, volumeData } = tradesToChartSeries(
            trades,
            ticksPerBar(mode),
          )
          candleSeries.setData(chartData)
          volumeSeries.setData(volumeData)
        } else {
          const chartData = candlesticksToChartData(candlesticks)
          const volumeData = candlesticksToVolumeData(candlesticks)
          candleSeries.setData(chartData)
          volumeSeries.setData(volumeData)
        }
      }

      chart.applyOptions({
        timeScale: { secondsVisible },
      })

      const hasPrimaryData =
        (useLine ? lineSeries.data().length : candleSeries.data().length) > 0 ||
        volumeSeries.data().length > 0
      if (hasPrimaryData) {
        requestAnimationFrame(() => chart.timeScale().fitContent())
      }

      const closeSeries = getClosePriceSeries(mode, candlesticks, trades)
      closeSeriesRef.current = closeSeries
      syncIndicators(chart, indicators, closeSeries)
    },
    [effectiveChartView, indicators, syncIndicators],
  )

  const loadMarketData = useCallback(
    async (marketTicker: string, interval: ChartTimeframe) => {
      setLoadingMarket(true)
      setMarketError(null)
      setMarketMeta(null)
      setLoadedCandlesticks([])
      setLoadedTrades([])

      try {
        const result = await getMarketChartData(marketTicker, interval)

        loadedTickerRef.current = result.bounds.ticker
        setMarketMeta(result.market)

        if (isTickChartData(result)) {
          setLoadedTrades(result.trades)
          applyChartData(result.timeframe, [], result.trades)

          const pointCount = isSingleTradeLineTimeframe(result.timeframe)
            ? tradesToLineData(result.trades).length
            : tradesToChartSeries(result.trades, ticksPerBar(result.timeframe))
                .chartData.length
          console.log(`[Verrons] Trades ${result.bounds.ticker}`, {
            timeframe: result.timeframe,
            raw_count: result.trades.length,
            chart_count: pointCount,
            first:
              (isSingleTradeLineTimeframe(result.timeframe)
                ? tradesToLineData(result.trades)[0]
                : tradesToChartSeries(
                    result.trades,
                    ticksPerBar(result.timeframe),
                  ).chartData[0]) ?? null,
            last:
              (isSingleTradeLineTimeframe(result.timeframe)
                ? tradesToLineData(result.trades).at(-1)
                : tradesToChartSeries(
                    result.trades,
                    ticksPerBar(result.timeframe),
                  ).chartData.at(-1)) ?? null,
          })

          if (pointCount === 0) {
            setMarketError('No trades found for this market.')
          }
        } else {
          setLoadedCandlesticks(result.candlesticks)
          applyChartData(result.timeframe, result.candlesticks, [])

          console.log(`[Verrons] Market ${result.bounds.ticker}`, {
            series_ticker: result.seriesTicker,
            timeframe: result.timeframe,
            start_ts: result.startTs,
            end_ts: result.endTs,
          })

          const chartBars = candlesticksToChartData(result.candlesticks)
          console.log(`[Verrons] Candlesticks ${result.bounds.ticker}`, {
            raw_count: result.candlesticks.length,
            chart_count: chartBars.length,
            first: chartBars[0] ?? null,
            last: chartBars.at(-1) ?? null,
          })

          if (chartBars.length === 0) {
            setMarketError('No tradable price candles in this range.')
          }
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to load market'
        setMarketError(message)
        console.error('[Verrons] Market fetch failed:', error)
      } finally {
        setLoadingMarket(false)
      }
    },
    [applyChartData],
  )

  async function handleMarketSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = ticker.trim()
    if (!trimmed) return

    await loadMarketData(trimmed, timeframe)
  }

  function handleTimeframeChange(interval: ChartTimeframe) {
    if (interval === timeframe) return
    setTimeframe(interval)
    const loaded = loadedTickerRef.current
    if (!loaded || loadingMarket) return
    void loadMarketData(loaded, interval)
  }

  function handleAddIndicatorSelect(value: string) {
    if (value === 'sma' || value === 'ema' || value === 'rsi') {
      setPeriodDraft(defaultPeriodForIndicator(value))
      setPeriodError(null)
      setPendingIndicator(value)
    }
  }

  function closeIndicatorModal() {
    setPendingIndicator(null)
    setPeriodError(null)
  }

  function handleIndicatorSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!pendingIndicator) return

    const period = Number.parseInt(periodDraft, 10)
    if (!Number.isFinite(period) || period < 1) {
      setPeriodError('Enter a whole number of at least 1.')
      return
    }

    setIndicators((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        type: pendingIndicator,
        period,
        color: nextIndicatorColor(current),
      },
    ])
    closeIndicatorModal()
  }

  function removeIndicator(id: string) {
    setIndicators((current) => current.filter((item) => item.id !== id))
  }

  useEffect(() => {
    if (candlesViewDisabled) {
      setChartView('line')
    }
  }, [candlesViewDisabled])

  useEffect(() => {
    if (loadedCandlesticks.length === 0 && loadedTrades.length === 0) return
    applyChartData(timeframe, loadedCandlesticks, loadedTrades)
  }, [
    chartView,
    effectiveChartView,
    timeframe,
    loadedCandlesticks,
    loadedTrades,
    applyChartData,
  ])

  useEffect(() => {
    const chart = chartRef.current
    if (!chart) return
    syncIndicators(chart, indicators, closeSeriesRef.current)
  }, [indicators, syncIndicators])

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

    const lineSeries = chart.addSeries(LineSeries, {
      color: '#707580',
      lineWidth: 2,
      visible: false,
    })

    lineSeries.priceScale().applyOptions({
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
    lineSeriesRef.current = lineSeries
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
      lineSeriesRef.current = null
      volumeSeriesRef.current = null
      indicatorSeriesRef.current.clear()
      closeSeriesRef.current = []
    }
  }, [])

  useEffect(() => {
    if (loadedCandlesticks.length === 0 && loadedTrades.length === 0) return
    const chart = chartRef.current
    if (!chart) return

    requestAnimationFrame(() => {
      chart.timeScale().fitContent()
    })
  }, [isFullscreen, loadedCandlesticks, loadedTrades])

  return (
    <div className={`app ${isFullscreen ? 'app--fullscreen' : 'app--dashboard'}`}>
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
              <label className="market-form-label" htmlFor="chart-timeframe">
                Timeframe
              </label>
              <select
                id="chart-timeframe"
                className="market-form-select"
                value={timeframeToSelectValue(timeframe)}
                disabled={loadingMarket}
                onChange={(event) => {
                  const interval = timeframeFromSelectValue(event.target.value)
                  if (interval) handleTimeframeChange(interval)
                }}
              >
                {TIMEFRAME_GROUPS.map((group) => (
                  <optgroup key={group.label} label={group.label}>
                    {group.options.map((option) => (
                      <option
                        key={timeframeToSelectValue(option.interval)}
                        value={timeframeToSelectValue(option.interval)}
                      >
                        {option.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <button
                className="market-form-submit"
                type="submit"
                disabled={loadingMarket || !ticker.trim()}
              >
                {loadingMarket ? 'Loading…' : 'Load'}
              </button>
              <div
                className="chart-view-toggle"
                role="group"
                aria-label="Chart style"
              >
                <button
                  type="button"
                  className={
                    effectiveChartView === 'candles'
                      ? 'chart-view-toggle__option chart-view-toggle__option--active'
                      : 'chart-view-toggle__option'
                  }
                  disabled={loadingMarket || candlesViewDisabled}
                  aria-pressed={effectiveChartView === 'candles'}
                  title={
                    candlesViewDisabled
                      ? 'Candles are not available on 1 Tick'
                      : 'Candlestick chart'
                  }
                  onClick={() => setChartView('candles')}
                >
                  Candles
                </button>
                <button
                  type="button"
                  className={
                    effectiveChartView === 'line'
                      ? 'chart-view-toggle__option chart-view-toggle__option--active'
                      : 'chart-view-toggle__option'
                  }
                  disabled={loadingMarket}
                  aria-pressed={effectiveChartView === 'line'}
                  title="Line chart (close)"
                  onClick={() => setChartView('line')}
                >
                  Line
                </button>
              </div>
            </form>
            {marketError && (
              <p className="market-form-error" role="alert">
                {marketError}
              </p>
            )}
          </header>
          {isFullscreen && (
            <div className="chart-indicators-bar">
              <IndicatorsPanel
                indicators={indicators}
                onAddSelect={handleAddIndicatorSelect}
                onRemove={removeIndicator}
              />
            </div>
          )}
          <div className="chart-stage">
            <button
              type="button"
              className="layout-toggle"
              onClick={() => setIsFullscreen((value) => !value)}
              aria-label={
                isFullscreen ? 'Show dashboard layout' : 'Show fullscreen chart'
              }
              title={isFullscreen ? 'Dashboard layout' : 'Fullscreen chart'}
            >
              <LayoutToggleIcon />
            </button>
            <div ref={chartContainerRef} className="chart-container" />
          </div>
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
              <header className="panel-header panel-header--tabs">
                <nav className="panel-tabs" aria-label="Chart tools">
                  <button type="button" className="active">
                    Indicators
                  </button>
                </nav>
              </header>
              <div className="panel-body panel-body--scroll">
                <IndicatorsPanel
                  indicators={indicators}
                  onAddSelect={handleAddIndicatorSelect}
                  onRemove={removeIndicator}
                />
              </div>
            </section>
          </>
        )}
      </div>

      {pendingIndicator && (
        <IndicatorConfigModal
          titleId={indicatorModalTitleId}
          indicator={pendingIndicator}
          draft={periodDraft}
          error={periodError}
          onDraftChange={setPeriodDraft}
          onSubmit={handleIndicatorSubmit}
          onClose={closeIndicatorModal}
        />
      )}
    </div>
  )
}
