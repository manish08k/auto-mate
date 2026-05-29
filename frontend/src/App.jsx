import React, {
  Suspense,
  lazy,
  useEffect,
  useCallback,
  useState,
} from 'react'
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from 'react-router-dom'

import useAuthStore     from './store/authStore.js'
import useWorkflowStore from './store/workflowStore.js'

// ─────────────────────────────────────────────
// Lazy-loaded pages
// Each page is its own bundle chunk — only
// downloads when the user navigates to that route.
// ─────────────────────────────────────────────
const Landing     = lazy(() => import('./pages/Landing.jsx'))
const Login       = lazy(() => import('./pages/Login.jsx'))
const Signup      = lazy(() => import('./pages/Signup.jsx'))
const Dashboard   = lazy(() => import('./pages/Dashboard.jsx'))
const Canvas      = lazy(() => import('./pages/Canvas.jsx'))
const Executions  = lazy(() => import('./pages/Executions.jsx'))
const Credentials = lazy(() => import('./pages/Credentials.jsx'))
const Settings    = lazy(() => import('./pages/Settings.jsx'))
const Pricing     = lazy(() => import('./pages/Pricing.jsx'))

// ─────────────────────────────────────────────
// Layout shells (not lazy — part of main bundle,
// render immediately so no skeleton flash)
// ─────────────────────────────────────────────
import AppShell    from './components/layout/AppShell.jsx'
import CanvasShell from './components/layout/CanvasShell.jsx'

// ─────────────────────────────────────────────
// Page-level loading skeleton
// Shown during Suspense fallback while a lazy
// page chunk is downloading
// ─────────────────────────────────────────────
function PageSkeleton() {
  return (
    <div className="page-skeleton" role="status" aria-label="Loading page">
      <div className="page-skeleton__bar page-skeleton__bar--title" />
      <div className="page-skeleton__bar page-skeleton__bar--subtitle" />
      <div className="page-skeleton__grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="page-skeleton__card" style={{ animationDelay: `${i * 60}ms` }} />
        ))}
      </div>
    </div>
  )
}

// Canvas has its own skeleton — full dark surface,
// no layout chrome visible during load
function CanvasSkeleton() {
  return (
    <div className="canvas-skeleton" role="status" aria-label="Loading canvas">
      <div className="canvas-skeleton__dot-grid" aria-hidden="true" />
      <div className="canvas-skeleton__spinner" />
    </div>
  )
}

// ─────────────────────────────────────────────
// Auth guard — wraps all authenticated routes.
// Redirects to /login if no valid session.
// Saves the attempted URL so we can redirect back
// after successful login.
// ─────────────────────────────────────────────
function RequireAuth({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isLoading       = useAuthStore((s) => s.isLoading)
  const location        = useLocation()

  // Still checking session (e.g. validating JWT on mount)
  if (isLoading) {
    return (
      <div className="auth-check" role="status" aria-label="Checking session">
        <div className="auth-check__spinner" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    )
  }

  return children
}

// ─────────────────────────────────────────────
// Guest guard — wraps public-only routes (login,
// signup). Redirects authenticated users to /dashboard
// so they don't see the login page again.
// ─────────────────────────────────────────────
function RequireGuest({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isLoading       = useAuthStore((s) => s.isLoading)

  if (isLoading) return null

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

// ─────────────────────────────────────────────
// Page title sync
// Updates document.title on every route change.
// Keeps browser tab + history readable.
// ─────────────────────────────────────────────
const ROUTE_TITLES = {
  '/':             'FlowOS — Automate Everything',
  '/login':        'Sign in — FlowOS',
  '/signup':       'Create account — FlowOS',
  '/dashboard':    'Workflows — FlowOS',
  '/executions':   'Executions — FlowOS',
  '/credentials':  'Credentials — FlowOS',
  '/settings':     'Settings — FlowOS',
  '/pricing':      'Pricing — FlowOS',
}

function usePageTitle() {
  const location = useLocation()

  useEffect(() => {
    // Canvas routes: /canvas/:id — show workflow name if available
    if (location.pathname.startsWith('/canvas/')) {
      // workflowStore will override this once workflow loads
      document.title = 'Canvas — FlowOS'
      return
    }
    const title = ROUTE_TITLES[location.pathname] ?? 'FlowOS'
    document.title = title
  }, [location.pathname])
}

// ─────────────────────────────────────────────
// Page body attribute sync
// Sets data-page on <body> so global CSS can
// scope styles per route (e.g. overflow: hidden on canvas)
// ─────────────────────────────────────────────
function useBodyPageAttr() {
  const location = useLocation()

  useEffect(() => {
    let page = 'default'
    const path = location.pathname

    if (path === '/')                       page = 'landing'
    else if (path.startsWith('/login'))     page = 'auth'
    else if (path.startsWith('/signup'))    page = 'auth'
    else if (path.startsWith('/canvas'))    page = 'canvas'
    else if (path.startsWith('/dashboard')) page = 'dashboard'
    else if (path.startsWith('/execution')) page = 'executions'
    else if (path.startsWith('/credential'))page = 'credentials'
    else if (path.startsWith('/settings'))  page = 'settings'
    else if (path.startsWith('/pricing'))   page = 'pricing'

    document.body.setAttribute('data-page', page)
    return () => document.body.removeAttribute('data-page')
  }, [location.pathname])
}

// ─────────────────────────────────────────────
// Scroll restoration
// SPA navigation doesn't auto-scroll to top.
// Exceptions: canvas (preserves pan position),
// modal routes (preserves parent scroll).
// ─────────────────────────────────────────────
function useScrollRestoration() {
  const location = useLocation()

  useEffect(() => {
    if (location.pathname.startsWith('/canvas')) return
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [location.pathname])
}

// ─────────────────────────────────────────────
// Session bootstrap
// On first mount, attempts to restore session
// from stored JWT. authStore.bootstrap() validates
// token, fetches /me, and sets isAuthenticated.
// ─────────────────────────────────────────────
function useSessionBootstrap() {
  const bootstrap = useAuthStore((s) => s.bootstrap)

  useEffect(() => {
    bootstrap()
  }, [bootstrap])
}

// ─────────────────────────────────────────────
// Keyboard shortcut — global
// Cmd/Ctrl+K → opens command palette (future)
// Cmd/Ctrl+/ → focus search
// ─────────────────────────────────────────────
function useGlobalShortcuts() {
  const navigate        = useNavigate()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const handleKeyDown = useCallback((e) => {
    if (!isAuthenticated) return

    const mod = e.metaKey || e.ctrlKey

    // Cmd+K — command palette
    if (mod && e.key === 'k') {
      e.preventDefault()
      // TODO: open command palette store
      return
    }

    // Cmd+Shift+E — executions
    if (mod && e.shiftKey && e.key === 'e') {
      e.preventDefault()
      navigate('/executions')
      return
    }

    // Cmd+Shift+D — dashboard
    if (mod && e.shiftKey && e.key === 'd') {
      e.preventDefault()
      navigate('/dashboard')
      return
    }

    // Cmd+Shift+C — credentials
    if (mod && e.shiftKey && e.key === 'c') {
      e.preventDefault()
      navigate('/credentials')
      return
    }
  }, [isAuthenticated, navigate])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

// ─────────────────────────────────────────────
// 404 page — inline, no lazy load needed
// ─────────────────────────────────────────────
function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="not-found">
      <div className="not-found__inner">
        <span className="not-found__code">404</span>
        <h1 className="not-found__title">Page not found</h1>
        <p className="not-found__desc">
          This page doesn't exist or you don't have access to it.
        </p>
        <div className="not-found__actions">
          <button
            className="btn btn--primary"
            onClick={() => navigate('/dashboard')}
          >
            Go to dashboard
          </button>
          <button
            className="btn btn--ghost"
            onClick={() => navigate(-1)}
          >
            Go back
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Root effects — runs on every route change.
// Houses all global side-effect hooks.
// ─────────────────────────────────────────────
function GlobalEffects() {
  usePageTitle()
  useBodyPageAttr()
  useScrollRestoration()
  useGlobalShortcuts()
  return null
}

// ─────────────────────────────────────────────
// App — root component
// ─────────────────────────────────────────────
export default function App() {
  useSessionBootstrap()

  return (
    <>
      <GlobalEffects />

      <Routes>

        {/* ── Public routes ── */}
        <Route
          path="/"
          element={
            <Suspense fallback={null}>
              <Landing />
            </Suspense>
          }
        />

        <Route
          path="/pricing"
          element={
            <Suspense fallback={<PageSkeleton />}>
              <Pricing />
            </Suspense>
          }
        />

        {/* ── Auth routes (redirect away if already logged in) ── */}
        <Route
          path="/login"
          element={
            <RequireGuest>
              <Suspense fallback={null}>
                <Login />
              </Suspense>
            </RequireGuest>
          }
        />

        <Route
          path="/signup"
          element={
            <RequireGuest>
              <Suspense fallback={null}>
                <Signup />
              </Suspense>
            </RequireGuest>
          }
        />

        {/* ── Authenticated routes — sidebar layout ── */}
        <Route
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        >
          {/* /dashboard — workflow list */}
          <Route
            path="/dashboard"
            element={
              <Suspense fallback={<PageSkeleton />}>
                <Dashboard />
              </Suspense>
            }
          />

          {/* /executions — all run logs */}
          <Route
            path="/executions"
            element={
              <Suspense fallback={<PageSkeleton />}>
                <Executions />
              </Suspense>
            }
          />

          {/* /executions/:id — single run detail */}
          <Route
            path="/executions/:executionId"
            element={
              <Suspense fallback={<PageSkeleton />}>
                <Executions />
              </Suspense>
            }
          />

          {/* /credentials — OAuth + API key management */}
          <Route
            path="/credentials"
            element={
              <Suspense fallback={<PageSkeleton />}>
                <Credentials />
              </Suspense>
            }
          />

          {/* /settings — account, billing, API keys, team */}
          <Route
            path="/settings"
            element={
              <Suspense fallback={<PageSkeleton />}>
                <Settings />
              </Suspense>
            }
          />

          <Route
            path="/settings/:tab"
            element={
              <Suspense fallback={<PageSkeleton />}>
                <Settings />
              </Suspense>
            }
          />
        </Route>

        {/* ── Canvas route — full-screen, no sidebar ── */}
        {/*
          Canvas gets its own layout shell (CanvasShell) — no sidebar,
          no topnav chrome, just the workflow name bar + run controls.
          Auth still required.
        */}
        <Route
          path="/canvas/:workflowId"
          element={
            <RequireAuth>
              <CanvasShell>
                <Suspense fallback={<CanvasSkeleton />}>
                  <Canvas />
                </Suspense>
              </CanvasShell>
            </RequireAuth>
          }
        />

        {/* ── OAuth callback routes ── */}
        {/*
          These are hit after external OAuth redirect (Google, Slack, etc.).
          They don't render UI — just exchange the code, store the credential,
          and redirect back to /credentials with a success toast.
        */}
        <Route
          path="/oauth/callback/google"
          element={<OAuthCallback provider="google" />}
        />
        <Route
          path="/oauth/callback/slack"
          element={<OAuthCallback provider="slack" />}
        />
        <Route
          path="/oauth/callback/github"
          element={<OAuthCallback provider="github" />}
        />
        <Route
          path="/oauth/callback/meta"
          element={<OAuthCallback provider="meta" />}
        />
        <Route
          path="/oauth/callback/notion"
          element={<OAuthCallback provider="notion" />}
        />
        <Route
          path="/oauth/callback/hubspot"
          element={<OAuthCallback provider="hubspot" />}
        />
        <Route
          path="/oauth/callback/salesforce"
          element={<OAuthCallback provider="salesforce" />}
        />
        <Route
          path="/oauth/callback/linear"
          element={<OAuthCallback provider="linear" />}
        />
        <Route
          path="/oauth/callback/discord"
          element={<OAuthCallback provider="discord" />}
        />

        {/* ── Legacy / shorthand redirects ── */}
        <Route path="/workflows"     element={<Navigate to="/dashboard"   replace />} />
        <Route path="/flows"         element={<Navigate to="/dashboard"   replace />} />
        <Route path="/logs"          element={<Navigate to="/executions"  replace />} />
        <Route path="/integrations"  element={<Navigate to="/credentials" replace />} />
        <Route path="/account"       element={<Navigate to="/settings"    replace />} />
        <Route path="/billing"       element={<Navigate to="/settings/billing" replace />} />
        <Route path="/team"          element={<Navigate to="/settings/team"    replace />} />

        {/* ── 404 ── */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </>
  )
}

// ─────────────────────────────────────────────
// OAuthCallback — handles provider redirects
// Reads ?code= and ?state= from URL,
// calls backend to exchange, then redirects.
// ─────────────────────────────────────────────
function OAuthCallback({ provider }) {
  const navigate  = useNavigate()
  const [error, setError] = useState(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code   = params.get('code')
    const state  = params.get('state')
    const err    = params.get('error')

    if (err) {
      setError(`${provider} connection was denied or failed.`)
      setTimeout(() => navigate('/credentials?error=oauth_denied'), 2500)
      return
    }

    if (!code) {
      navigate('/credentials?error=oauth_no_code', { replace: true })
      return
    }

    // Import dynamically to avoid circular deps
    import('./services/credentialService.js').then(({ exchangeOAuthCode }) => {
      exchangeOAuthCode({ provider, code, state })
        .then(() => {
          navigate('/credentials?connected=' + provider, { replace: true })
        })
        .catch((e) => {
          console.error('[OAuth] Exchange failed:', e)
          navigate('/credentials?error=oauth_exchange_failed', { replace: true })
        })
    })
  }, [provider, navigate])

  if (error) {
    return (
      <div className="oauth-callback oauth-callback--error">
        <p>{error}</p>
        <p className="oauth-callback__sub">Redirecting you back…</p>
      </div>
    )
  }

  return (
    <div className="oauth-callback" role="status" aria-label={`Connecting ${provider}`}>
      <div className="oauth-callback__spinner" />
      <p>Connecting {provider}…</p>
    </div>
  )
}
