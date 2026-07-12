import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './state/useAuth.jsx'

// Service workers must never run against the Vite dev server — they intercept
// requests and can serve stale cached JS while you're actively editing files,
// causing exactly the kind of "works, then mysteriously doesn't" bugs that are
// nearly impossible to diagnose. Production-build only.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)