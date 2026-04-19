import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

async function enableMocks() {
  if (!import.meta.env.DEV) return
  const { worker } = await import('./api/mocks/browser')
  await worker.start({ onUnhandledRequest: 'bypass' })
}

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('#root element not found')

enableMocks().then(() => {
  createRoot(rootEl).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
