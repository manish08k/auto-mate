// NodeCard.jsx
// A single workflow node rendered on the canvas board.
// Positioned absolutely by CanvasBoard at (node.x, node.y).

import { useState } from 'react'

const T = {
  bg:       '#0A0A0A',
  surface:  '#111111',
  border:   '#1F1F1F',
  text:     '#FFFFFF',
  textSec:  '#A1A1AA',
  textDim:  '#3A3A3A',
  hover:    '#161616',
  success:  '#6fcf97',
  danger:   '#eb5757',
  warning:  '#f2c94c',
  running:  '#38BDF8',
}

// ── Status config ──────────────────────────────────────────────────────────
const STATUS = {
  idle: {
    label: 'Idle',
    dot:   '#2a2a2a',
    ring:  '#2a2a2a',
    bg:    'transparent',
  },
  running: {
    label: 'Running',
    dot:   T.running,
    ring:  T.running,
    bg:    '#0a1a28',
  },
  success: {
    label: 'Success',
    dot:   T.success,
    ring:  '#1e3a1e',
    bg:    '#0a1a0a',
  },
  failed: {
    label: 'Failed',
    dot:   T.danger,
    ring:  '#3a1a1a',
    bg:    '#1a0a0a',
  },
  skipped: {
    label: 'Skipped',
    dot:   T.textDim,
    ring:  '#1f1f1f',
    bg:    'transparent',
  },
}

// ── Node type icons (inline SVG) ───────────────────────────────────────────
const NODE_ICONS = {
  trigger:     { label: 'Trigger',     bg: '#1a1a2e', color: '#8b8bff' },
  action:      { label: 'Action',      bg: '#111',    color: T.textSec  },
  condition:   { label: 'Condition',   bg: '#1a2a1a', color: T.success  },
  transform:   { label: 'Transform',   bg: '#1a1a1a', color: T.warning  },
  delay:       { label: 'Delay',       bg: '#1a1a1a', color: T.textSec  },
  webhook:     { label: 'Webhook',     bg: '#111',    color: T.running  },
  notification:{ label: 'Notify',      bg: '#111',    color: T.textSec  },
  end:         { label: 'End',         bg: '#1a0a0a', color: T.danger   },
}

function NodeIcon({ type }) {
  const cfg = NODE_ICONS[type] ?? NODE_ICONS.action
  return (
    <div style={{
      width: 28, height: 28, borderRadius: 6, flexShrink: 0,
      background: cfg.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        {type === 'trigger' && <path d="M3 1l8 6-8 6V1z" stroke={cfg.color} strokeWidth="1.3" strokeLinejoin="round"/>}
        {type === 'action' && <><rect x="2" y="2" width="10" height="10" rx="2" stroke={cfg.color} strokeWidth="1.2"/><path d="M5 7h4M7 5v4" stroke={cfg.color} strokeWidth="1.2" strokeLinecap="round"/></>}
        {type === 'condition' && <path d="M7 1l6 6-6 6-6-6 6-6z" stroke={cfg.color} strokeWidth="1.2" strokeLinejoin="round"/>}
        {type === 'transform' && <><path d="M2 4h10M4 7h6M6 10h2" stroke={cfg.color} strokeWidth="1.2" strokeLinecap="round"/></>}
        {type === 'delay' && <><circle cx="7" cy="7" r="5.5" stroke={cfg.color} strokeWidth="1.2"/><path d="M7 4v3l2 2" stroke={cfg.color} strokeWidth="1.2" strokeLinecap="round"/></>}
        {type === 'webhook' && <><path d="M2 7c0-2.8 2.2-5 5-5" stroke={cfg.color} strokeWidth="1.2" strokeLinecap="round"/><path d="M12 7c0 2.8-2.2 5-5 5" stroke={cfg.color} strokeWidth="1.2" strokeLinecap="round"/><circle cx="7" cy="7" r="2" stroke={cfg.color} strokeWidth="1.2"/></>}
        {type === 'notification' && <><path d="M7 2a3 3 0 0 1 3 3v2l1 2H3l1-2V5a3 3 0 0 1 3-3z" stroke={cfg.color} strokeWidth="1.2"/><path d="M5.5 11a1.5 1.5 0 0 0 3 0" stroke={cfg.color} strokeWidth="1.2"/></>}
        {type === 'end' && <><circle cx="7" cy="7" r="5.5" stroke={cfg.color} strokeWidth="1.2"/><circle cx="7" cy="7" r="2.5" fill={cfg.color}/></>}
      </svg>
    </div>
  )
}

// ── Handle (connection anchor) ─────────────────────────────────────────────
function Handle({ side, onConnect }) {
  const [hovered, setHovered] = useState(false)
  const isLeft = side === 'left'

  const style = {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    [isLeft ? 'left' : 'right']: -8,
    width: 14,
    height: 14,
    borderRadius: '50%',
    background: hovered ? T.text : T.surface,
    border: `2px solid ${hovered ? T.text : '#3a3a3a'}`,
    cursor: 'crosshair',
    zIndex: 10,
    transition: 'background 0.1s, border-color 0.1s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }

  return (
    <div
      style={style}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseDown={e => { e.stopPropagation(); onConnect && onConnect(side, e) }}
      title={isLeft ? 'Input' : 'Output'}
    >
      {hovered && (
        <div style={{ width: 5, height: 5, borderRadius: '50%', background: T.bg }} />
      )}
    </div>
  )
}

// ── Main NodeCard ──────────────────────────────────────────────────────────
/**
 * Props:
 *   node          {object}   { id, type, label, subLabel, status, duration, error, selected }
 *   onSelect      {fn}       Called with node.id when card is clicked
 *   onDragStart   {fn}       Called with (node.id, e) on mousedown
 *   onConnect     {fn}       Called with (node.id, side, e) when handle dragged
 *   onDelete      {fn}       Called with node.id
 *   style         {object}   Positioning: { position, left, top }
 */
export function NodeCard({
  node = {},
  onSelect,
  onDragStart,
  onConnect,
  onDelete,
  style = {},
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  const {
    id       = 'node_1',
    type     = 'action',
    label    = 'Untitled step',
    subLabel = '',
    status   = 'idle',
    duration = null,
    error    = null,
    selected = false,
  } = node

  const s = STATUS[status] ?? STATUS.idle

  const borderColor = selected
    ? T.text
    : s.ring !== '#2a2a2a' ? s.ring : T.border

  return (
    <div
      onMouseDown={e => { e.stopPropagation(); onSelect && onSelect(id); onDragStart && onDragStart(id, e) }}
      style={{
        ...style,
        width: 220,
        background: selected ? '#161616' : s.bg || T.surface,
        border: `1px solid ${borderColor}`,
        borderRadius: 8,
        padding: '10px 12px',
        cursor: 'grab',
        boxShadow: selected ? '0 0 0 2px rgba(255,255,255,0.08)' : 'none',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        boxSizing: 'border-box',
        position: style.position ?? 'absolute',
        userSelect: 'none',
      }}
    >
      {/* Input handle */}
      <Handle side="left" onConnect={(side, e) => onConnect && onConnect(id, side, e)} />

      {/* Card header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: error ? 8 : 0 }}>
        <NodeIcon type={type} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
            <p style={{
              margin: 0,
              fontSize: 12,
              fontWeight: 600,
              color: T.text,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>{label}</p>

            {/* Context menu trigger */}
            <button
              onMouseDown={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); setMenuOpen(o => !o) }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: T.textDim, padding: '0 2px', fontSize: 14,
                lineHeight: 1, flexShrink: 0,
              }}
            >···</button>
          </div>

          {subLabel && (
            <p style={{
              margin: '2px 0 0', fontSize: 10, color: T.textSec,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{subLabel}</p>
          )}
        </div>
      </div>

      {/* Status row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, paddingTop: 7, borderTop: `1px solid ${T.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: s.dot, display: 'block', flexShrink: 0,
          }} />
          <span style={{ fontSize: 10, color: T.textSec }}>{s.label}</span>
        </div>
        {duration && (
          <span style={{ fontSize: 10, color: T.textDim }}>{duration}</span>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div style={{
          marginTop: 8, padding: '5px 8px',
          background: '#1a0a0a', border: `1px solid #3a1a1a`,
          borderRadius: 4,
        }}>
          <p style={{ margin: 0, fontSize: 10, color: T.danger, lineHeight: 1.5 }}>{error}</p>
        </div>
      )}

      {/* Context menu */}
      {menuOpen && (
        <div
          onMouseDown={e => e.stopPropagation()}
          style={{
            position: 'absolute', top: 8, right: 8,
            width: 160, background: '#151515',
            border: `1px solid ${T.border}`, borderRadius: 7,
            zIndex: 50, overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
          }}
        >
          {[
            { label: 'Edit step',       action: () => { setMenuOpen(false) } },
            { label: 'Duplicate',       action: () => { setMenuOpen(false) } },
            { label: 'Run from here',   action: () => { setMenuOpen(false) } },
            { label: 'Copy node ID',    action: () => { navigator.clipboard?.writeText(id); setMenuOpen(false) } },
            { label: 'Delete',          action: () => { setMenuOpen(false); onDelete && onDelete(id) }, danger: true },
          ].map((item, i, arr) => (
            <button
              key={item.label}
              onClick={item.action}
              style={{
                width: '100%', textAlign: 'left',
                padding: '8px 12px', border: 'none',
                background: 'transparent', cursor: 'pointer',
                fontSize: 12,
                color: item.danger ? T.danger : T.textSec,
                borderBottom: i < arr.length - 1 ? `1px solid ${T.border}` : 'none',
              }}
              onMouseEnter={e => e.currentTarget.style.background = T.hover}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >{item.label}</button>
          ))}
        </div>
      )}

      {/* Output handle */}
      <Handle side="right" onConnect={(side, e) => onConnect && onConnect(id, side, e)} />
    </div>
  )
}

export default NodeCard
