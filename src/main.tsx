import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

// MSW is intentionally NOT started yet. The worker + handler modules exist
// (src/api/mocks/*) but starting the worker with zero handlers produces
// passthrough errors in DevTools that look broken to reviewers. It comes
// online in Step 7 once there are real handlers for GET /automations and
// POST /simulate.

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('#root element not found')

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
