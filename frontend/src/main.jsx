import React, { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'sonner'

import App from './App.jsx'

import './styles/global.css'
import './styles/canvas.css'
import './styles/nodes.css'

// ─────────────────────────────────────────────
// React Query client
// ─────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:          1000 * 60 * 2,   // 2 min — data considered fresh
      gcTime:             1000 * 60 * 10,  // 10 min — cache garbage collect
      retry:              (failureCount, error) => {
        // Never retry on 401/403/404 — no point hammering auth errors
        if (error?.status === 401) return false
        if (error?.status === 403) return false
        if (error?.status === 404) return false
        return failureCount < 2
      },
      retryDelay:         (attempt) => Math.min(1000 * 2 ** attempt, 8000),
      refetchOnWindowFocus: false,         // Too aggressive for a canvas app
      refetchOnReconnect:   true,
      networkMode:          'online',
    },
    mutations: {
      retry:       0,
      networkMode: 'online',
    },
  },
})

// ─────────────────────────────────────────────
// Loader dismissal — remove the pre-React spinner
// from index.html once React has fully mounted
// ─────────────────────────────────────────────
function AppLoader({ children }) {
  useEffect(() => {
    const loader = document.getElementById('app-loader')
    if (!loader) return
    loader.classList.add('hidden')
    // Remove from DOM after transition finishes (300ms in index.html CSS)
    const timer = setTimeout(() => loader.remove(), 350)
    return () => clearTimeout(timer)
  }, [])
  return children
}

// ─────────────────────────────────────────────
// Global unhandled promise rejection logger
// In production this would ship to Sentry / Datadog
// ─────────────────────────────────────────────
window.addEventListener('unhandledrejection', (event) => {
  if (import.meta.env.DEV) {
    console.error('[FlowOS] Unhandled promise rejection:', event.reason)
  }
  // TODO: reportError(event.reason)
})

// Global JS error logger
window.addEventListener('error', (event) => {
  if (import.meta.env.DEV) {
    console.error('[FlowOS] Uncaught error:', event.error)
  }
  // TODO: reportError(event.error)
})

// ─────────────────────────────────────────────
// Mount
// ─────────────────────────────────────────────
const container = document.getElementById('root')

if (!container) {
  throw new Error(
    '[FlowOS] Could not find #root element. Check index.html for a <div id="root">.'
  )
}

const root = createRoot(container)

root.render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppLoader>
          <App />
        </AppLoader>
      </BrowserRouter>

      {/* Toaster — global notification system */}
      <Toaster
        position="bottom-right"
        theme="dark"
        richColors
        closeButton
        duration={4000}
        toastOptions={{
          style: {
            background:   '#111111',
            border:       '1px solid #1F1F1F',
            color:        '#FFFFFF',
            fontSize:     '13px',
            fontFamily:   'var(--font-sans)',
            borderRadius: '8px',
          },
        }}
      />

      {/* React Query DevTools — only in dev, tree-shaken in prod */}
      {import.meta.env.DEV && (
        <ReactQueryDevtools
          initialIsOpen={false}
          buttonPosition="bottom-left"
        />
      )}
    </QueryClientProvider>
  </StrictMode>
)
