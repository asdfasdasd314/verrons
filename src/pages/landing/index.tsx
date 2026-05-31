import { Link } from 'react-router-dom'
import './index.css'

export default function LandingPage() {
  return (
    <div className="landing">
      <header className="landing-header">
        <span className="landing-logo">KalshiView</span>
        <nav className="landing-nav">
          <Link to="/analysis">Open workspace</Link>
          <Link to="/charts-supplier">Charts</Link>
        </nav>
      </header>

      <main className="landing-main">
        <p className="landing-eyebrow">Prediction market analytics</p>
        <h1>Make quality predictions on KalshiView</h1>
        <p className="landing-lead">
          KalshiView is a data analysis platform built for prediction market
          traders. Kalshi and Polymarket are powerful, but their charts and
          dashboards were not built for serious quantitative work.
        </p>
        <p className="landing-body">
          Advanced analysis still means wrestling with APIs that are hard to use
          and hard to understand. KalshiView brings TradingView-grade chart
          ergonomics and quantitative workflows to the markets you already trade.
        </p>
        <div className="landing-actions">
          <Link className="landing-cta" to="/analysis">
            Launch workspace
          </Link>
          <Link className="landing-cta-secondary" to="/charts-supplier">
            Charting attribution
          </Link>
        </div>

        <ul className="landing-features">
          <li>
            <strong>Built for traders</strong> — layouts that mirror professional
            terminals, not consumer sportsbooks.
          </li>
          <li>
            <strong>API-first</strong> — designed around the data you pull from
            Kalshi, Polymarket, and whatever comes next.
          </li>
          <li>
            <strong>Chart-native</strong> — lightweight, fast charts so you can
            focus on edge instead of fighting the UI.
          </li>
        </ul>
      </main>

      <footer className="landing-footer">
        <span>KalshiView — quantitative experience for prediction markets.</span>
      </footer>
    </div>
  )
}
