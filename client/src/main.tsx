import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'

// Test Supabase connection in development
if (import.meta.env.DEV) {
  import('./lib/testSupabaseConnection').then(({ testSupabaseConnection }) => {
    // Run test after a short delay to ensure app is initialized
    setTimeout(() => {
      testSupabaseConnection()
    }, 1000)
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
)

