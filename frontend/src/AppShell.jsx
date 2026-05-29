import React, { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '../../store/authStore.js'

// ─────────────────────────────────────────────
// Nav items — sidebar primary navigation
// ─────────────────────────────────────────────
const NAV_ITEMS = [
  {
    to:    '/dashboard',
    label: 'Workflows',
    icon:  (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <rect x="1" y="1" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.25"/>
        <rect x="9.5" y="1" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.25"/>
        <rect x="1" y="9.5" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.25"/>
        <path d="M12.25 9.5V14M9.5 11.75H15" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
      </svg>
    ),
    shortcut: '⌘⇧D',
  },
  {
    to:    '/executions',
    label: 'Executions',
    icon:  (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M3 2.5L13 8L3 13.5V2.5Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"/>
        <path d="M9 8H14" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
      </svg>
    ),
    shortcut: '⌘⇧E',
  },
  {
    to:    '/credentials',
    label: 'Credentials',
    icon:  (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <rect x="1.5" y="5.5" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.25"/>
        <path d="M5 5.5V4a3 3 0 0 1 6 0v1.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
        <circle cx="8" cy="10" r="1.25" fill="currentColor"/>
      </svg>
    ),
    shortcut: '⌘⇧C',
  },
]

const BOTTOM_ITEMS = [
  {
    to:    '/settings',
    label: 'Settings',
    icon:  (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="2.25" stroke="currentColor" strokeWidth="1.25"/>
        <path d="M8 1.5v1M8 13.5v1M1.5 8h1M13.5 8h1M3.4 3.4l.7.7M11.9 11.9l.7.7M3.4 12.6l.7-.7M11.9 4.1l.7-.7" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    to:    '/pricing',
    label: 'Upgrade',
    icon:  (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M8 1L10.2 5.5L15 6.2L11.5 9.6L12.4 14.4L8 12.1L3.6 14.4L4.5 9.6L1 6.2L5.8 5.5L8 1Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"/>
      </svg>
    ),
    accent: true,
  },
]

// ─────────────────────────────────────────────
// AppShell
// ─────────────────────────────────────────────
export default function AppShell() {
  const user     = useAuthStore((s) => s.user)
  const logout   = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const location = useLocation()

  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true'
  })

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', String(collapsed))
    document.documentElement.style.setProperty(
      '--sidebar-current-width',
      collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)'
    )
  }, [collapsed])

  const initials = user
    ? (user.name ?? user.email ?? 'U')
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U'

  return (
    <div className="app-shell">

      {/* ── Sidebar ── */}
      <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`} aria-label="Main navigation">

        {/* Logo / wordmark */}
        <div className="sidebar__header">
          <button
            className="sidebar__logo"
            onClick={() => navigate('/dashboard')}
            aria-label="FlowOS home"
          >
            <span className="sidebar__logo-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path d="M4 10C4 6.686 6.686 4 10 4V2C5.582 2 2 5.582 2 10H4Z" fill="#5B6AF0"/>
                <path d="M10 16C13.314 16 16 13.314 16 10H18C18 14.418 14.418 18 10 18V16Z" fill="#5B6AF0" opacity="0.5"/>
                <circle cx="10" cy="10" r="2.5" fill="#5B6AF0"/>
              </svg>
            </span>
            {!collapsed && <span className="sidebar__wordmark">FlowOS</span>}
          </button>

          <button
            className="sidebar__collapse-btn"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"
              style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 150ms ease' }}>
              <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* New workflow CTA */}
        <div className="sidebar__cta">
          <button
            className="btn-new-workflow"
            onClick={() => {
              import('../../services/workflowService.js').then(({ createWorkflow }) => {
                createWorkflow({ name: 'Untitled workflow' }).then((wf) => {
                  navigate(`/canvas/${wf.id}`)
                })
              })
            }}
            title="New workflow"
            aria-label="Create new workflow"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            {!collapsed && <span>New workflow</span>}
          </button>
        </div>

        {/* Primary nav */}
        <nav className="sidebar__nav" aria-label="Primary">
          <ul role="list">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `sidebar__nav-item ${isActive ? 'sidebar__nav-item--active' : ''}`
                  }
                  title={collapsed ? `${item.label}${item.shortcut ? ` (${item.shortcut})` : ''}` : undefined}
                >
                  <span className="sidebar__nav-icon">{item.icon}</span>
                  {!collapsed && (
                    <>
                      <span className="sidebar__nav-label">{item.label}</span>
                      {item.shortcut && (
                        <span className="sidebar__nav-shortcut" aria-hidden="true">
                          {item.shortcut}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Spacer */}
        <div className="sidebar__spacer" aria-hidden="true" />

        {/* Bottom nav */}
        <nav className="sidebar__nav sidebar__nav--bottom" aria-label="Secondary">
          <ul role="list">
            {BOTTOM_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `sidebar__nav-item ${isActive ? 'sidebar__nav-item--active' : ''} ${item.accent ? 'sidebar__nav-item--accent' : ''}`
                  }
                  title={collapsed ? item.label : undefined}
                >
                  <span className="sidebar__nav-icon">{item.icon}</span>
                  {!collapsed && <span className="sidebar__nav-label">{item.label}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* User profile */}
        <div className="sidebar__user">
          <button
            className="sidebar__user-btn"
            onClick={() => navigate('/settings')}
            aria-label="Open account settings"
            title={collapsed ? (user?.name ?? user?.email ?? 'Account') : undefined}
          >
            <span className="sidebar__avatar" aria-hidden="true">{initials}</span>
            {!collapsed && (
              <span className="sidebar__user-info">
                <span className="sidebar__user-name">{user?.name ?? 'Account'}</span>
                <span className="sidebar__user-email">{user?.email ?? ''}</span>
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* ── Main area ── */}
      <main className="app-main" id="main-content">
        <Outlet />
      </main>

    </div>
  )
}
