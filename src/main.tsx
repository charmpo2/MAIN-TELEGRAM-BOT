import React, { ErrorInfo } from 'react'
import ReactDOM from 'react-dom/client'
import { TonConnectUIProvider } from '@tonconnect/ui-react'
import App from './App'
import './index.css'

// Global error handler
window.addEventListener('error', (e) => {
  console.error('[Global Error]', e.error)
  const root = document.getElementById('root')
  if (root) {
    root.innerHTML = `<div style="color:white;padding:20px;"><h3>App Crash</h3><pre>${e.error?.message || 'Unknown error'}</pre></div>`
  }
})

window.addEventListener('unhandledrejection', (e) => {
  console.error('[Unhandled Promise]', e.reason)
})

const manifestUrl = `${window.location.origin}/tonconnect-manifest.json`
console.log('[TON Connect] Manifest URL:', manifestUrl)

// Error Boundary Component
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: string}> {
  constructor(props: {children: React.ReactNode}) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[React Error]', error, info)
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div style={{color:'white',padding:'20px',background:'#0d1b2a',minHeight:'100vh'}}>
          <h3>Something went wrong:</h3>
          <pre style={{color:'red'}}>{this.state.error}</pre>
          <button onClick={()=>location.reload()} style={{marginTop:'20px',padding:'10px'}}>Reload</button>
        </div>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <TonConnectUIProvider manifestUrl={manifestUrl}>
        <App />
      </TonConnectUIProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
