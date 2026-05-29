import { useState } from 'react'

// ── Token constants (mirrors Sidebar + Settings + Pricing) ─────────────────
const T = {
  bg:        '#0A0A0A',
  surface:   '#111111',
  border:    '#1F1F1F',
  borderDim: '#161616',
  text:      '#FFFFFF',
  textSec:   '#A1A1AA',
  textDim:   '#3A3A3A',
  hover:     '#161616',
  danger:    '#eb5757',
  success:   '#6fcf97',
  warning:   '#f2c94c',
}

// ── Inline SVG icons ───────────────────────────────────────────────────────
function Ico({ size = 15, children }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
      xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, display: 'block' }}>
      {children}
    </svg>
  )
}
function IconSearch() {
  return <Ico><circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.3"/><path d="M10.5 10.5l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></Ico>
}
function IconBell() {
  return <Ico><path d="M8 2a4 4 0 0 1 4 4v3l1 2H3l1-2V6a4 4 0 0 1 4-4z" stroke="currentColor" strokeWidth="1.2"/><path d="M6.5 13a1.5 1.5 0 0 0 3 0" stroke="currentColor" strokeWidth="1.2"/></Ico>
}
function IconHelp() {
  return <Ico><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2"/><path d="M6.5 6.5a1.5 1.5 0 0 1 3 .5c0 1-1.5 1.5-1.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><circle cx="8" cy="12" r="0.75" fill="currentColor"/></Ico>
}
function IconChevronRight() {
  return <Ico size={12}><path d="M5 4l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></Ico>
}
function IconStatus() {
  return <Ico size={8}><circle cx="4" cy="4" r="3.5" fill="#6fcf97"/></Ico>
}
function IconX() {
  return <Ico size={14}><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></Ico>
}
function IconCheck() {
  return <Ico size={14}><path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></Ico>
}

// ── Mock notification data ─────────────────────────────────────────────────
const NOTIFICATIONS = [
  { id: 1, type: 'error',   title: 'Execution failed',        body: 'Stripe → Notion — IntegrationError',        time: '2 min ago',  unread: true  },
  { id: 2, type: 'success', title: 'Workflow completed',       body: 'Daily Airtable Digest ran successfully',    time: '18 min ago', unread: true  },
  { id: 3, type: 'warning', title: 'API limit at 80%',         body: '8,020 / 10,000 executions used this month', time: '1 hr ago',   unread: true  },
  { id: 4, type: 'info',    title: 'Luna Chen joined the team',body: 'Accepted invite · Member role assigned',    time: '3 hr ago',   unread: false },
  { id: 5, type: 'info',    title: 'Invoice generated',        body: '$29.00 — Starter Monthly — May 2026',      time: 'Yesterday',  unread: false },
]

const TYPE_COLOR = {
  error:   T.danger,
  success: T.success,
  warning: T.warning,
  info:    T.textSec,
}

// ── Search modal ───────────────────────────────────────────────────────────
function SearchModal({ onClose }) {
  const [query, setQuery] = useState('')

  const RECENTS = ['Stripe → Notion workflow', 'API Keys', 'Team members', 'Daily Airtable Digest']
  const RESULTS = query.length > 1
    ? [
        { label: 'Stripe → Notion', type: 'Workflow',   icon: '⚡' },
        { label: 'API Keys — Settings', type: 'Page',   icon: '⚙️' },
        { label: 'Pro Plan',            type: 'Billing', icon: '💳' },
      ].filter(r => r.label.toLowerCase().includes(query.toLowerCase()))
    : []

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: 120,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 560, background: '#111', border: `1px solid ${T.border}`,
          borderRadius: 10, overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.8)',
        }}
      >
        {/* Input row */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '14px 18px', gap: 12, borderBottom: `1px solid ${T.border}` }}>
          <span style={{ color: T.textSec }}><IconSearch /></span>
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search workflows, pages, settings…"
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              fontSize: 14, color: T.text, fontFamily: 'inherit',
            }}
          />
          <kbd style={{ fontSize: 11, color: T.textDim, background: '#1a1a1a', border: `1px solid ${T.border}`, borderRadius: 4, padding: '2px 6px' }}>esc</kbd>
        </div>

        {/* Results / recents */}
        <div style={{ maxHeight: 340, overflowY: 'auto' }}>
          {RESULTS.length > 0 ? (
            <div style={{ padding: '8px 0' }}>
              <p style={{ margin: '0 0 4px', padding: '6px 18px 4px', fontSize: 10, fontWeight: 600, color: T.textDim, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Results</p>
              {RESULTS.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 18px', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = T.hover}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ fontSize: 14 }}>{r.icon}</span>
                  <span style={{ flex: 1, fontSize: 13, color: T.text }}>{r.label}</span>
                  <span style={{ fontSize: 11, color: T.textDim }}>{r.type}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '8px 0' }}>
              <p style={{ margin: '0 0 4px', padding: '6px 18px 4px', fontSize: 10, fontWeight: 600, color: T.textDim, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Recent</p>
              {RECENTS.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 18px', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = T.hover}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ color: T.textDim }}><IconSearch /></span>
                  <span style={{ flex: 1, fontSize: 13, color: T.textSec }}>{r}</span>
                  <span style={{ color: T.textDim }}><IconChevronRight /></span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div style={{ borderTop: `1px solid ${T.border}`, padding: '10px 18px', display: 'flex', gap: 16 }}>
          {[['↑↓', 'Navigate'], ['↵', 'Open'], ['esc', 'Dismiss']].map(([key, label]) => (
            <span key={key} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: T.textDim }}>
              <kbd style={{ background: '#1a1a1a', border: `1px solid ${T.border}`, borderRadius: 3, padding: '1px 5px', fontSize: 10 }}>{key}</kbd>
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Notification panel ────────────────────────────────────────────────────
function NotifPanel({ onClose }) {
  const [notes, setNotes] = useState(NOTIFICATIONS)
  const unreadCount = notes.filter(n => n.unread).length

  const markAllRead = () => setNotes(ns => ns.map(n => ({ ...n, unread: false })))
  const dismiss = id => setNotes(ns => ns.filter(n => n.id !== id))

  return (
    <div style={{
      position: 'absolute', top: 48, right: 0,
      width: 360, background: '#111', border: `1px solid ${T.border}`,
      borderRadius: 10, zIndex: 200, overflow: 'hidden',
      boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Notifications</span>
          {unreadCount > 0 && (
            <span style={{ fontSize: 10, fontWeight: 700, background: '#fff', color: '#0A0A0A', borderRadius: 10, padding: '1px 7px' }}>{unreadCount}</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {unreadCount > 0 && (
            <button onClick={markAllRead} style={{ fontSize: 11, color: T.textSec, background: 'none', border: 'none', cursor: 'pointer', padding: '3px 6px' }}>
              Mark all read
            </button>
          )}
          <button onClick={onClose} style={{ color: T.textDim, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <IconX />
          </button>
        </div>
      </div>

      {/* List */}
      <div style={{ maxHeight: 380, overflowY: 'auto' }}>
        {notes.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 13, color: T.textDim }}>No notifications</p>
          </div>
        ) : notes.map((n, i) => (
          <div key={n.id} style={{
            display: 'flex', gap: 12, padding: '12px 16px',
            borderBottom: i < notes.length - 1 ? `1px solid ${T.borderDim}` : 'none',
            background: n.unread ? '#0d0d0d' : 'transparent',
          }}>
            {/* Type dot */}
            <div style={{ paddingTop: 4, flexShrink: 0 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: TYPE_COLOR[n.type], display: 'block' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 2 }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: n.unread ? 600 : 400, color: T.text, lineHeight: 1.4 }}>{n.title}</p>
                <span style={{ fontSize: 10, color: T.textDim, whiteSpace: 'nowrap', flexShrink: 0 }}>{n.time}</span>
              </div>
              <p style={{ margin: 0, fontSize: 11, color: T.textSec, lineHeight: 1.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.body}</p>
            </div>
            <button onClick={() => dismiss(n.id)} style={{ color: T.textDim, background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, padding: 0, display: 'flex', alignItems: 'flex-start', paddingTop: 2 }}>
              <IconX />
            </button>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ borderTop: `1px solid ${T.border}`, padding: '10px 16px' }}>
        <a href="/notifications" style={{ fontSize: 12, color: T.textSec, textDecoration: 'none' }}>View all notifications →</a>
      </div>
    </div>
  )
}

// ── Main Navbar ────────────────────────────────────────────────────────────
/**
 * Props:
 *   title       {string}   Page name shown in breadcrumb, e.g. "Workflows"
 *   breadcrumbs {Array}    Optional [{label, href}, ...] — shown before title
 *   actions     {ReactNode} Optional right-side CTAs (e.g. "New Workflow" button)
 */
export function Navbar({ title = 'Dashboard', breadcrumbs = [], actions = null }) {
  const [searchOpen, setSearchOpen]   = useState(false)
  const [notifOpen, setNotifOpen]     = useState(false)
  const [userOpen, setUserOpen]       = useState(false)

  const unreadCount = NOTIFICATIONS.filter(n => n.unread).length

  return (
    <>
      <header style={{
        height: 52,
        borderBottom: `1px solid ${T.border}`,
        background: T.bg,
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        gap: 12,
        flexShrink: 0,
        position: 'relative',
        zIndex: 50,
      }}>

        {/* ── Breadcrumb / title ── */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          {breadcrumbs.map((bc, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <a href={bc.href} style={{ fontSize: 13, color: T.textSec, textDecoration: 'none' }}
                onMouseEnter={e => e.currentTarget.style.color = T.text}
                onMouseLeave={e => e.currentTarget.style.color = T.textSec}
              >{bc.label}</a>
              <span style={{ color: T.textDim }}><IconChevronRight /></span>
            </span>
          ))}
          <span style={{ fontSize: 13, fontWeight: 600, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {title}
          </span>
        </div>

        {/* ── Right section ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>

          {/* Search trigger */}
          <button
            onClick={() => setSearchOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '5px 10px', borderRadius: 6,
              border: `1px solid ${T.border}`, background: '#0d0d0d',
              cursor: 'pointer', color: T.textSec, fontSize: 12,
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#2a2a2a'}
            onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
          >
            <IconSearch />
            <span style={{ minWidth: 130, textAlign: 'left', color: T.textDim }}>Search…</span>
            <kbd style={{ fontSize: 10, background: '#1a1a1a', border: `1px solid ${T.border}`, borderRadius: 3, padding: '1px 5px', color: T.textDim }}>⌘K</kbd>
          </button>

          {/* Divider */}
          <div style={{ width: 1, height: 20, background: T.border, margin: '0 6px' }} />

          {/* Status indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 6, cursor: 'default' }}>
            <IconStatus />
            <span style={{ fontSize: 11, color: T.textSec }}>All systems operational</span>
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 20, background: T.border, margin: '0 2px' }} />

          {/* Help */}
          <IconBtn title="Help" onClick={() => {}}>
            <IconHelp />
          </IconBtn>

          {/* Notifications */}
          <div style={{ position: 'relative' }}>
            <IconBtn title="Notifications" onClick={() => { setNotifOpen(o => !o); setUserOpen(false) }}>
              <IconBell />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: 5, right: 5,
                  width: 7, height: 7, borderRadius: '50%',
                  background: T.danger, border: `1.5px solid ${T.bg}`,
                }} />
              )}
            </IconBtn>
            {notifOpen && <NotifPanel onClose={() => setNotifOpen(false)} />}
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 20, background: T.border, margin: '0 4px' }} />

          {/* User avatar */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => { setUserOpen(o => !o); setNotifOpen(false) }}
              title="Account"
              style={{
                width: 30, height: 30, borderRadius: '50%',
                background: '#1f1f1f', border: `1px solid ${T.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 600, color: T.textSec,
                cursor: 'pointer',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#3a3a3a'}
              onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
            >AM</button>

            {userOpen && (
              <div style={{
                position: 'absolute', top: 38, right: 0,
                width: 220, background: '#111', border: `1px solid ${T.border}`,
                borderRadius: 8, zIndex: 200, overflow: 'hidden',
                boxShadow: '0 12px 40px rgba(0,0,0,0.7)',
              }}>
                <div style={{ padding: '12px 14px', borderBottom: `1px solid ${T.border}` }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: T.text }}>Alex Monroe</p>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: T.textDim }}>alex@startup.io</p>
                </div>
                <div style={{ padding: '6px 0' }}>
                  {[
                    { label: 'Settings',       href: '/settings'  },
                    { label: 'Billing',         href: '/pricing'   },
                    { label: 'Documentation',   href: '#'          },
                    { label: 'Keyboard shortcuts', href: '#'       },
                  ].map(item => (
                    <a key={item.label} href={item.href} style={{
                      display: 'block', padding: '8px 14px', fontSize: 13, color: T.textSec, textDecoration: 'none',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.background = T.hover; e.currentTarget.style.color = T.text }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.textSec }}
                    >{item.label}</a>
                  ))}
                </div>
                <div style={{ borderTop: `1px solid ${T.border}`, padding: '6px 0' }}>
                  <a href="/logout" style={{ display: 'block', padding: '8px 14px', fontSize: 13, color: T.danger, textDecoration: 'none' }}
                    onMouseEnter={e => e.currentTarget.style.background = T.hover}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >Sign out</a>
                </div>
              </div>
            )}
          </div>

          {/* Optional page-level actions slot */}
          {actions && (
            <>
              <div style={{ width: 1, height: 20, background: T.border, margin: '0 4px' }} />
              {actions}
            </>
          )}
        </div>
      </header>

      {/* Search modal */}
      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
    </>
  )
}

// ── Helper: icon button ────────────────────────────────────────────────────
function IconBtn({ children, onClick, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 32, height: 32, borderRadius: 6,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'transparent', border: 'none', cursor: 'pointer',
        color: T.textSec, position: 'relative',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = T.hover; e.currentTarget.style.color = T.text }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.textSec }}
    >{children}</button>
  )
}

export default Navbar
