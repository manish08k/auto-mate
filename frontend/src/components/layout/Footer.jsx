import { useState } from 'react'

// ── Token constants (mirrors entire platform) ──────────────────────────────
const T = {
  bg:        '#0A0A0A',
  surface:   '#111111',
  border:    '#1F1F1F',
  borderDim: '#161616',
  text:      '#FFFFFF',
  textSec:   '#A1A1AA',
  textDim:   '#3A3A3A',
  hover:     '#161616',
  success:   '#6fcf97',
  warning:   '#f2c94c',
  danger:    '#eb5757',
}

// ── Status data ────────────────────────────────────────────────────────────
const STATUS_SERVICES = [
  { name: 'API',           status: 'operational' },
  { name: 'Webhooks',      status: 'operational' },
  { name: 'Executions',    status: 'operational' },
  { name: 'Dashboard',     status: 'operational' },
  { name: 'Integrations',  status: 'degraded'    },
]

const STATUS_META = {
  operational: { label: 'Operational',      color: T.success, dot: T.success },
  degraded:    { label: 'Partial outage',   color: T.warning, dot: T.warning },
  outage:      { label: 'Major outage',     color: T.danger,  dot: T.danger  },
}

// Derive overall status from services
function getOverallStatus(services) {
  if (services.some(s => s.status === 'outage'))   return 'outage'
  if (services.some(s => s.status === 'degraded')) return 'degraded'
  return 'operational'
}

// ── Status popover ─────────────────────────────────────────────────────────
function StatusPopover({ onClose }) {
  const overall = getOverallStatus(STATUS_SERVICES)
  const meta    = STATUS_META[overall]

  return (
    <div style={{
      position: 'absolute', bottom: 36, left: 0,
      width: 280, background: '#111', border: `1px solid ${T.border}`,
      borderRadius: 8, zIndex: 200, overflow: 'hidden',
      boxShadow: '0 -8px 32px rgba(0,0,0,0.7)',
    }}>
      {/* Header */}
      <div style={{ padding: '12px 14px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: meta.dot, flexShrink: 0, display: 'block' }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{meta.label}</span>
        <a href="https://status.example.com" target="_blank" rel="noreferrer"
          style={{ marginLeft: 'auto', fontSize: 11, color: T.textDim, textDecoration: 'none' }}>
          status page ↗
        </a>
      </div>

      {/* Services list */}
      <div style={{ padding: '8px 0' }}>
        {STATUS_SERVICES.map(svc => {
          const m = STATUS_META[svc.status]
          return (
            <div key={svc.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 14px' }}>
              <span style={{ fontSize: 12, color: T.textSec }}>{svc.name}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: m.color }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.dot, display: 'block' }} />
                {m.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Last checked */}
      <div style={{ borderTop: `1px solid ${T.border}`, padding: '9px 14px' }}>
        <span style={{ fontSize: 11, color: T.textDim }}>Last checked: just now</span>
      </div>
    </div>
  )
}

// ── Footer links data ──────────────────────────────────────────────────────
const LINK_GROUPS = [
  {
    label: 'Resources',
    links: [
      { label: 'Documentation', href: 'https://docs.example.com' },
      { label: 'API Reference',  href: 'https://docs.example.com/api' },
      { label: 'Changelog',      href: '/changelog' },
      { label: 'Status',         href: 'https://status.example.com' },
    ],
  },
  {
    label: 'Company',
    links: [
      { label: 'About',       href: '/about'   },
      { label: 'Blog',        href: '/blog'    },
      { label: 'Careers',     href: '/careers' },
      { label: 'Contact',     href: '/contact' },
    ],
  },
  {
    label: 'Legal',
    links: [
      { label: 'Privacy Policy',   href: '/privacy'  },
      { label: 'Terms of Service', href: '/terms'    },
      { label: 'Cookie Policy',    href: '/cookies'  },
      { label: 'DPA',              href: '/dpa'      },
    ],
  },
]

// ── Variants ───────────────────────────────────────────────────────────────
// variant="app"     → minimal single-line footer for inside the dashboard layout
// variant="full"    → multi-column footer for public/landing pages

/**
 * Footer component
 *
 * Props:
 *   variant   {"app" | "full"}   Default "app"
 *   version   {string}           e.g. "v2.4.1" — shown in app variant
 */
export function Footer({ variant = 'app', version = 'v2.4.1' }) {
  const [statusOpen, setStatusOpen] = useState(false)
  const overall = getOverallStatus(STATUS_SERVICES)
  const meta    = STATUS_META[overall]

  // ── App variant: thin bottom bar ─────────────────────────────────────────
  if (variant === 'app') {
    return (
      <footer style={{
        height: 36,
        borderTop: `1px solid ${T.borderDim}`,
        background: T.bg,
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        gap: 16,
        flexShrink: 0,
      }}>
        {/* Left: status */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setStatusOpen(o => !o)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: meta.dot, display: 'block', flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: T.textDim }}>{meta.label}</span>
          </button>
          {statusOpen && <StatusPopover onClose={() => setStatusOpen(false)} />}
        </div>

        <div style={{ width: 1, height: 12, background: T.border }} />

        {/* Version */}
        <span style={{ fontSize: 11, color: T.textDim }}>{version}</span>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Right: links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {[
            { label: 'Docs',    href: 'https://docs.example.com' },
            { label: 'Status',  href: 'https://status.example.com' },
            { label: 'Privacy', href: '/privacy' },
            { label: 'Terms',   href: '/terms'   },
          ].map(l => (
            <a key={l.label} href={l.href}
              style={{ fontSize: 11, color: T.textDim, textDecoration: 'none' }}
              onMouseEnter={e => e.currentTarget.style.color = T.textSec}
              onMouseLeave={e => e.currentTarget.style.color = T.textDim}
            >{l.label}</a>
          ))}
        </div>

        <div style={{ width: 1, height: 12, background: T.border }} />

        {/* Copyright */}
        <span style={{ fontSize: 11, color: T.textDim }}>© 2026 Startup Inc.</span>
      </footer>
    )
  }

  // ── Full variant: multi-column public footer ──────────────────────────────
  return (
    <footer style={{
      background: T.bg,
      borderTop: `1px solid ${T.border}`,
      padding: '48px 0 0',
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 40px' }}>

        {/* Top row: brand + columns */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 40, marginBottom: 48 }}>

          {/* Brand column */}
          <div>
            {/* Logo mark */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{
                width: 24, height: 24, borderRadius: 6, background: T.text,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <rect x="0" y="0" width="5" height="5" rx="1" fill="#0A0A0A"/>
                  <rect x="7" y="0" width="5" height="5" rx="1" fill="#0A0A0A"/>
                  <rect x="0" y="7" width="5" height="5" rx="1" fill="#0A0A0A"/>
                  <rect x="7" y="7" width="2" height="5" rx="1" fill="#0A0A0A"/>
                </svg>
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>Startup Inc.</span>
            </div>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: T.textDim, lineHeight: 1.7, maxWidth: 260 }}>
              Automation infrastructure for developers, startups, and enterprise teams.
            </p>

            {/* Status badge */}
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <button
                onClick={() => setStatusOpen(o => !o)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer',
                  background: '#111', border: `1px solid ${T.border}`,
                  borderRadius: 6, padding: '6px 12px',
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: meta.dot, display: 'block' }} />
                <span style={{ fontSize: 12, color: T.textSec }}>{meta.label}</span>
              </button>
              {statusOpen && <StatusPopover onClose={() => setStatusOpen(false)} />}
            </div>
          </div>

          {/* Link columns */}
          {LINK_GROUPS.map(group => (
            <div key={group.label}>
              <p style={{ margin: '0 0 14px', fontSize: 11, fontWeight: 600, color: T.textDim, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {group.label}
              </p>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {group.links.map(link => (
                  <li key={link.label} style={{ marginBottom: 10 }}>
                    <a href={link.href} style={{ fontSize: 13, color: T.textSec, textDecoration: 'none' }}
                      onMouseEnter={e => e.currentTarget.style.color = T.text}
                      onMouseLeave={e => e.currentTarget.style.color = T.textSec}
                    >{link.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop: `1px solid ${T.borderDim}`,
          padding: '18px 0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: 12, color: T.textDim }}>© 2026 Startup Inc. All rights reserved.</span>
          <div style={{ display: 'flex', gap: 20 }}>
            <span style={{ fontSize: 12, color: T.textDim }}>{version}</span>
            <span style={{ fontSize: 12, color: T.textDim }}>SOC 2 Type II · GDPR · HIPAA</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
