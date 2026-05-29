// MiniMap.jsx
// Bottom-right viewport overview for the canvas board.
// Shows scaled-down node positions and current viewport rect.

import { useRef, useState, useCallback } from 'react'

const T = {
  bg:       '#0A0A0A',
  surface:  '#111111',
  border:   '#1F1F1F',
  text:     '#FFFFFF',
  textSec:  '#A1A1AA',
  textDim:  '#3A3A3A',
  success:  '#6fcf97',
  danger:   '#eb5757',
  warning:  '#f2c94c',
  running:  '#38BDF8',
}

const STATUS_FILL = {
  success: '#1a3a1a',
  failed:  '#3a1a1a',
  running: '#0a1f2f',
  skipped: '#1a1a1a',
  idle:    '#161616',
}
const STATUS_STROKE = {
  success: T.success,
  failed:  T.danger,
  running: T.running,
  skipped: T.textDim,
  idle:    '#2a2a2a',
}

// MiniMap dimensions
const MM_W = 200
const MM_H = 130

/**
 * Props:
 *   nodes        {Array}   [{id, x, y, width, height, status, label}]
 *   canvasWidth  {number}  Full canvas logical width  (e.g. 3000)
 *   canvasHeight {number}  Full canvas logical height (e.g. 2000)
 *   viewport     {object}  { x, y, width, height } — current visible area in canvas coords
 *   onViewportChange {fn}  Called with new {x, y} when user clicks/drags minimap
 *   zoom         {number}  Current zoom level (display only)
 */
export function MiniMap({
  nodes = [],
  canvasWidth  = 3000,
  canvasHeight = 2000,
  viewport     = { x: 0, y: 0, width: 1200, height: 700 },
  onViewportChange,
  zoom = 1,
}) {
  const [collapsed, setCollapsed] = useState(false)
  const svgRef = useRef(null)

  const scaleX = MM_W / canvasWidth
  const scaleY = MM_H / canvasHeight

  const toMM = (x, y, w = 0, h = 0) => ({
    x: x * scaleX,
    y: y * scaleY,
    w: Math.max(w * scaleX, 4),
    h: Math.max(h * scaleY, 3),
  })

  const handleClick = useCallback((e) => {
    if (!onViewportChange || !svgRef.current) return
    const rect   = svgRef.current.getBoundingClientRect()
    const clickX = ((e.clientX - rect.left) / MM_W) * canvasWidth
    const clickY = ((e.clientY - rect.top)  / MM_H) * canvasHeight
    onViewportChange({
      x: clickX - viewport.width  / 2,
      y: clickY - viewport.height / 2,
    })
  }, [onViewportChange, canvasWidth, canvasHeight, viewport])

  const vp = toMM(viewport.x, viewport.y, viewport.width, viewport.height)

  return (
    <div style={{
      position: 'absolute',
      bottom: 48,
      right: 16,
      zIndex: 30,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: 0,
      userSelect: 'none',
    }}>
      {/* Header bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: MM_W,
        padding: '5px 8px',
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderBottom: collapsed ? `1px solid ${T.border}` : 'none',
        borderRadius: collapsed ? 6 : '6px 6px 0 0',
        gap: 8,
      }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: T.textDim, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          Map
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, color: T.textDim }}>
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setCollapsed(c => !c)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: T.textDim, padding: 0, display: 'flex', alignItems: 'center',
              fontSize: 14, lineHeight: 1,
            }}
            title={collapsed ? 'Expand minimap' : 'Collapse minimap'}
          >
            {collapsed ? '＋' : '−'}
          </button>
        </div>
      </div>

      {/* SVG map body */}
      {!collapsed && (
        <svg
          ref={svgRef}
          width={MM_W}
          height={MM_H}
          onClick={handleClick}
          style={{
            background: T.bg,
            border: `1px solid ${T.border}`,
            borderRadius: '0 0 6px 6px',
            cursor: onViewportChange ? 'crosshair' : 'default',
            display: 'block',
          }}
        >
          {/* Grid dots */}
          <defs>
            <pattern id="mm-grid" width={20 * scaleX * 5} height={20 * scaleY * 5} patternUnits="userSpaceOnUse">
              <circle cx={0} cy={0} r={0.6} fill="#1f1f1f" />
            </pattern>
          </defs>
          <rect width={MM_W} height={MM_H} fill="url(#mm-grid)" />

          {/* Nodes */}
          {nodes.map(node => {
            const m = toMM(node.x, node.y, node.width ?? 200, node.height ?? 60)
            const fill   = STATUS_FILL[node.status]   ?? STATUS_FILL.idle
            const stroke = STATUS_STROKE[node.status] ?? STATUS_STROKE.idle
            return (
              <g key={node.id}>
                <rect
                  x={m.x} y={m.y} width={m.w} height={m.h}
                  rx={2}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={1}
                />
              </g>
            )
          })}

          {/* Viewport rect */}
          <rect
            x={vp.x} y={vp.y} width={vp.w} height={vp.h}
            rx={2}
            fill="rgba(255,255,255,0.03)"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth={1}
            strokeDasharray="3 2"
          />
        </svg>
      )}

      {/* Legend */}
      {!collapsed && (
        <div style={{
          display: 'flex',
          gap: 10,
          marginTop: 6,
          flexWrap: 'wrap',
          justifyContent: 'flex-end',
          maxWidth: MM_W,
        }}>
          {[
            { label: 'Success', color: T.success },
            { label: 'Failed',  color: T.danger  },
            { label: 'Running', color: T.running },
            { label: 'Idle',    color: T.textDim },
          ].map(l => (
            <span key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: 1, background: l.color, display: 'block' }} />
              <span style={{ fontSize: 9, color: T.textDim }}>{l.label}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default MiniMap
