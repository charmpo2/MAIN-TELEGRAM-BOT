import React from 'react'
import ReactDOM from 'react-dom/client'
import { TonConnectUIProvider } from '@tonconnect/ui-react'
import App from './App'
import './index.css'

const manifestUrl = `${window.location.origin}/tonconnect-manifest.json`

// Debug: Log manifest URL
console.log('[TON Connect] Manifest URL:', manifestUrl)

// Verify manifest is accessible
fetch(manifestUrl)
  .then(r => r.json())
  .then(data => console.log('[TON Connect] Manifest loaded:', data))
  .catch(e => console.error('[TON Connect] Manifest error:', e))

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TonConnectUIProvider manifestUrl={manifestUrl}>
      <App />
    </TonConnectUIProvider>
  </React.StrictMode>,
)
