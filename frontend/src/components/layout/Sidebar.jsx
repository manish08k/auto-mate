import { useState } from 'react'

// ── Token constants ────────────────────────────────────────────────────────
const T = {
  bg:         '#0A0A0A',
  surface:    '#111111',
  border:     '#1F1F1F',
  borderDim:  '#161616',
  text:       '#FFFFFF',
  textSec:    '#A1A1AA',
  textDim:    '#3A3A3A',
  hover:      '#161616',
}

// ── SVG icon primitive ─────────────────────────────────────────────────────
function Ico({ size = 16, children }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
      xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, display: 'block' }}>
      {children}
    </svg>
  )
}

// ── Individual icons ───────────────────────────────────────────────────────
function IconGrid() {
  return (
    <Ico>
      <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2"/>
      <rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2"/>
      <rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2"/>
      <rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2"/>
    </Ico>
  )
}
function IconFlow() {
  return (
    <Ico>
      <circle cx="3" cy="8" r="2" stroke="currentColor" strokeWidth="1.2"/>
      <circle cx="13" cy="3" r="2" stroke="currentColor" strokeWidth="1.2"/>
      <circle cx="13" cy="13" r="2" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M5 8h3l2-5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M5 8h3l2 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </Ico>
  )
}
function IconRun() {
  return (
    <Ico>
      <path d="M3 2l11 6-11 6V2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
    </Ico>
  )
}
function IconCanvas() {
  return (
    <Ico>
      <rect x="1" y="1" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M4 8h8M8 4v8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </Ico>
  )
}
function IconKey() {
  return (
    <Ico>
      <circle cx="6" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M9 8h6M13 6v4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </Ico>
  )
}
function IconPlug() {
  return (
    <Ico>
      <path d="M6 1v4M10 1v4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <rect x="4" y="5" width="8" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M8 10v5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </Ico>
  )
}
function IconTeam() {
  return (
    <Ico>
      <circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M1 14c0-3 2-4.5 5-4.5s5 1.5 5 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <circle cx="12" cy="5" r="2" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M14 14c0-2.5-1.2-4-3.5-4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </Ico>
  )
}
function IconGear() {
  return (
    <Ico>
      <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.1 3.1l1.4 1.4M11.5 11.5l1.4 1.4M11.5 4.5l1.4-1.4M3.1 12.9l1.4-1.4"
        stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </Ico>
  )
}
function IconBilling() {
  return (
    <Ico>
      <rect x="1" y="3" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M1 6h14" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M4 10h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </Ico>
  )
}
function IconChevronDown() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
      <path d="M2.5 4.5l3.5 3.5 3.5-3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function IconCollapseLeft() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
      <path d="M10 7H4M7 4L4 7l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function IconExpandRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
      <path d="M4 7h6M7 4l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function GreenDot() {
  return <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6fcf97', display: 'inline-block', flexShrink: 0 }} />
}

// ── Nav structure — defined AFTER icon functions so JSX is valid ───────────
const NAV_GROUPS = [
  {
    label: null,
    items: [
      { id: 'dashboard',    label: 'Dashboard',    icon: <IconGrid />,    href: '/dashboard' },
      { id: 'workflows',    label: 'Workflows',    icon: <IconFlow />,    href: '/workflows' },
      { id: 'executions',   label: 'Executions',   icon: <IconRun />,     href: '/executions' },
      { id: 'canvas',       label: 'Canvas',       icon: <IconCanvas />,  href: '/canvas' },
    ],
  },
  {
    label: 'Workspace',
    items: [
      { id: 'credentials',  label: 'Credentials',  icon: <IconKey />,     href: '/credentials' },
      { id: 'integrations', label: 'Integrations', icon: <IconPlug />,    href: '/integrations' },
      { id: 'team',         label: 'Team',         icon: <IconTeam />,    href: '/team' },
    ],
  },
  {
    label: 'Account',
    items: [
      { id: 'settings',     label: 'Settings',     icon: <IconGear />,    href: '/settings' },
      { id: 'pricing',      label: 'Billing',      icon: <IconBilling />, href: '/pricing' },
    ],
  },
]

const WORKSPACES = ['Startup Inc.', 'Side Project', 'Client — Acme']

// ── Workspace switcher dropdown ────────────────────────────────────────────
function WorkspaceSwitcher({ current, onChange }) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'none', border: 'none', cursor: 'pointer', padding: 0, gap: 6,
          minWidth: 0, width: '100%',
        }}
      >
        <span style={{
          fontSize: 13, fontWeight: 600, color: T.text,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {current}
        </span>
        <span style={{ color: T.textDim, flexShrink: 0 }}>
          <IconChevronDown />
        </span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 30, left: -14, right: -14,
          background: '#151515', border: `1px solid ${T.border}`,
          borderRadius: 8, zIndex: 100, overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
        }}>
          <div style={{ padding: '6px 0' }}>
            {WORKSPACES.map(ws => (
              <button
                key={ws}
                onClick={() => { onChange(ws); setOpen(false) }}
                style={{
                  width: '100%', textAlign: 'left', padding: '8px 14px',
                  background: ws === current ? T.hover : 'transparent',
                  border: 'none', cursor: 'pointer', fontSize: 13,
                  color: ws === current ? T.text : T.textSec,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}
                onMouseEnter={e => { if (ws !== current) e.currentTarget.style.background = T.hover }}
                onMouseLeave={e => { if (ws !== current) e.currentTarget.style.background = 'transparent' }}
              >
                <span>{ws}</span>
                {ws === current && <GreenDot />}
              </button>
            ))}
          </div>
          <div style={{ borderTop: `1px solid ${T.border}`, padding: '6px 0' }}>
            <button style={{
              width: '100%', textAlign: 'left', padding: '8px 14px',
              background: 'transparent', border: 'none', cursor: 'pointer',
              fontSize: 12, color: T.textDim,
            }}>
              + Create workspace
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Sidebar export ────────────────────────────────────────────────────
/**
 * Props:
 *   activePage  {string}  One of the nav item ids e.g. "dashboard", "workflows"
 */
export function Sidebar({ activePage = 'dashboard' }) {
  const [collapsed, setCollapsed]   = useState(false)
  const [workspace, setWorkspace]   = useState('Startup Inc.')

  const W = collapsed ? 56 : 220

  return (
    <div style={{
      width: W,
      minHeight: '100vh',
      background: T.bg,
      borderRight: `1px solid ${T.border}`,
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      transition: 'width 0.18s ease',
      overflow: 'hidden',
      position: 'relative',
    }}>

      {/* ── Logo + workspace row ── */}
      <div style={{
        height: 52,
        borderBottom: `1px solid ${T.borderDim}`,
        display: 'flex',
        alignItems: 'center',
        padding: collapsed ? '0 16px' : '0 14px',
        gap: 10,
        flexShrink: 0,
      }}>
        {/* Logo mark */}
        <div style={{
          width: 24, height: 24, borderRadius: 6, background: T.text,
          flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <rect x="0" y="0" width="5" height="5" rx="1" fill="#0A0A0A"/>
            <rect x="7" y="0" width="5" height="5" rx="1" fill="#0A0A0A"/>
            <rect x="0" y="7" width="5" height="5" rx="1" fill="#0A0A0A"/>
            <rect x="7" y="7" width="2" height="5" rx="1" fill="#0A0A0A"/>
          </svg>
        </div>

        {!collapsed && (
          <WorkspaceSwitcher current={workspace} onChange={setWorkspace} />
        )}
      </div>

      {/* ── Navigation ── */}
      <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '8px 0' }}>
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi} style={{ marginBottom: 2 }}>
            {group.label && !collapsed && (
              <p style={{
                margin: '10px 0 2px',
                padding: '0 14px',
                fontSize: 10,
                fontWeight: 600,
                color: T.textDim,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                whiteSpace: 'nowrap',
              }}>
                {group.label}
              </p>
            )}

            {group.items.map(item => {
              const isActive = activePage === item.id
              return (
                <a
                  key={item.id}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: collapsed ? 0 : 9,
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    margin: '1px 6px',
                    padding: collapsed
                      ? '9px 0'
                      : isActive
                        ? '7px 12px 7px 12px'
                        : '7px 14px',
                    borderRadius: 6,
                    textDecoration: 'none',
                    fontSize: 13,
                    fontWeight: isActive ? 500 : 400,
                    color: isActive ? T.text : T.textSec,
                    background: isActive ? '#1a1a1a' : 'transparent',
                    borderLeft: !collapsed
                      ? `2px solid ${isActive ? T.text : 'transparent'}`
                      : 'none',
                    boxSizing: 'border-box',
                    transition: 'background 0.1s, color 0.1s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      e.currentTarget.style.background = T.hover
                      e.currentTarget.style.color = T.text
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = T.textSec
                    }
                  }}
                >
                  <span style={{ color: isActive ? T.text : T.textSec, display: 'flex' }}>
                    {item.icon}
                  </span>
                  {!collapsed && item.label}
                </a>
              )
            })}
          </div>
        ))}
      </nav>

      {/* ── User + collapse ── */}
      <div style={{ borderTop: `1px solid ${T.borderDim}`, flexShrink: 0 }}>
        {/* User row */}
        {!collapsed && (
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '11px 14px', cursor: 'pointer',
            }}
            onMouseEnter={e => e.currentTarget.style.background = T.hover}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: '#1f1f1f', border: `1px solid ${T.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 600, color: T.textSec, flexShrink: 0,
            }}>AM</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                margin: 0, fontSize: 12, fontWeight: 500, color: T.text,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>Alex Monroe</p>
              <p style={{
                margin: 0, fontSize: 11, color: T.textDim,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>alex@startup.io</p>
            </div>
          </div>
        )}

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 8,
            padding: collapsed ? '11px 0' : '9px 14px',
            background: 'transparent',
            border: 'none',
            borderTop: `1px solid ${T.borderDim}`,
            cursor: 'pointer',
            color: T.textDim,
            fontSize: 12,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = T.hover
            e.currentTarget.style.color = T.textSec
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = T.textDim
          }}
        >
          {collapsed ? <IconExpandRight /> : <IconCollapseLeft />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </div>
  )
}

export default Sidebar
