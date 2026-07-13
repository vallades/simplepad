import './styles.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element #root not found')
}

// Surface unexpected boot errors instead of a silent white screen
window.addEventListener('error', (event) => {
  console.error('[SimplePad] window error:', event.error ?? event.message)
})
window.addEventListener('unhandledrejection', (event) => {
  console.error('[SimplePad] unhandled rejection:', event.reason)
})

try {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  )
} catch (error) {
  const message = error instanceof Error ? (error.stack ?? error.message) : String(error)
  rootElement.innerHTML = `<pre style="padding:16px;font:12px/1.4 ui-monospace,monospace;white-space:pre-wrap;color:#b91c1c">${message}</pre>`
  console.error('[SimplePad] failed to mount React:', error)
}
