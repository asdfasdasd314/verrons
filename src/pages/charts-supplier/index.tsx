import { Link } from 'react-router-dom'
import './index.css'

export default function ChartsSupplierPage() {
  return (
    <main className="charts-supplier">
      <h1>Thanks TradingView for the charting utilities</h1>
      <p className="charts-supplier-lead">
        Verrons uses{' '}
        <a
          href="https://www.tradingview.com/lightweight-charts/"
          target="_blank"
          rel="noopener noreferrer"
        >
          TradingView Lightweight Charts™
        </a>{' '}
        for chart rendering.
      </p>
      <p className="charts-supplier-notice">
        TradingView Lightweight Charts™
        <br />
        Copyright © 2025 TradingView, Inc.{' '}
        <a
          href="https://www.tradingview.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
          https://www.tradingview.com
        </a>
      </p>
      <Link className="charts-supplier-back" to="/">
        Back to Verrons
      </Link>
    </main>
  )
}
