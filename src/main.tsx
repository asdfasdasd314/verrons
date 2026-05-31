import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import AnalysisPage from './pages/analysis/index.tsx'
import ChartsSupplierPage from './pages/charts-supplier/index.tsx'
import LandingPage from './pages/landing/index.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/analysis" element={<AnalysisPage />} />
        <Route path="/charts-supplier" element={<ChartsSupplierPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
