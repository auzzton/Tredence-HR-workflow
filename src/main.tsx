import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

async function mountApp() {
  if (import.meta.env.DEV) {
    const { enableMocks } = await import('./api/mocks/browser')
    await enableMocks()
  }

  const rootEl = document.getElementById('root')
  if (!rootEl) throw new Error('#root element not found')

  createRoot(rootEl).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

mountApp()
