import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import './index.css'
import LandingPage from './pages/landing/index.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LandingPage />
    <Analytics />
  </StrictMode>,
)
