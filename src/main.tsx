import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { observePerformance } from './utils/performance'

// Enable performance monitoring in development
if (import.meta.env.DEV) {
  observePerformance();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
