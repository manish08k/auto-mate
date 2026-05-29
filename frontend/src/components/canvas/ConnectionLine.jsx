// ConnectionLine.jsx
// SVG edge/line rendered between two nodes on the canvas board.
// Used internally by CanvasBoard — not mounted standalone.

const T = {
  border:     '#1F1F1F',
  textDim:    '#3A3A3A',
  textSec:    '#A1A1AA',
  success:    '#6fcf97',
  danger:     '#eb5757',
  warning:    '#f2c94c',
  accent:     '#ffffff',
  running:    '#38BDF8',
}

const STATUS_COLOR = {
  success:  T.success,
  failed:   T.danger,
  running:  T.running,
  skipped:  T.textDim,
  idle:     '#2a2a2a',
}

/**
 * Draws a smooth cubic-bezier SVG path between two nodes.
 *
 * Props:
 *   x1, y1        {number}  Source anchor point (absolute canvas coords)
 *   x2, y2        {number}  Target anchor point
 *   status        {string}  "idle" | "running" | "success" | "failed" | "skipped"
 *   selected      {boolean} Highlight this edge
 *   animated      {boolean} Show flow animation (dashes moving along path)
 *   label         {string}  Optional midpoint label e.g. "true" / "false"
 *   onClick       {fn}
 */
export function ConnectionLine({
  x1 = 0, y1 = 0,
  x2 = 200, y2 = 0,
  status = 'idle',
  selected = false,
  animated = false,
  label = '',
  onClick,
}) {
  const color  = STATUS_COLOR[status] ?? STATUS_COLOR.idle
  const stroke = selected ? T.accent : color
  const sw     = selected ? 2 : 1.5

  // Cubic bezier — horizontal tangents for left-to-right flow
  const dx = Math.abs(x2 - x1) * 0.5
  const d  = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`

  // Midpoint for label
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2

  return (
    <g
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {/* Invisible wide hit area */}
      <path d={d} fill="none" stroke="transparent" strokeWidth={16} />

      {/* Main path */}
      <path
        d={d}
        fill="none"
        stroke={stroke}
        strokeWidth={sw}
        strokeLinecap="round"
        style={animated ? { strokeDasharray: '6 4', animation: 'dashFlow 0.8s linear infinite' } : {}}
      />

      {/* Arrowhead at target */}
      <polygon
        points={`${x2},${y2} ${x2 - 7},${y2 - 4} ${x2 - 7},${y2 + 4}`}
        fill={stroke}
      />

      {/* Optional midpoint label */}
      {label && (
        <g>
          <rect
            x={mx - 16} y={my - 9}
            width={32} height={18}
            rx={4}
            fill="#111111"
            stroke="#1F1F1F"
            strokeWidth={1}
          />
          <text
            x={mx} y={my + 4}
            textAnchor="middle"
            fontSize={10}
            fontFamily="system-ui, -apple-system, sans-serif"
            fill={T.textSec}
          >{label}</text>
        </g>
      )}

      {/* Running pulse dot travelling along path */}
      {status === 'running' && (
        <circle r={4} fill={T.running} opacity={0.9}>
          <animateMotion dur="1.2s" repeatCount="indefinite" path={d} />
        </circle>
      )}

      {/* CSS keyframes injected once */}
      <style>{`@keyframes dashFlow { to { stroke-dashoffset: -10; } }`}</style>
    </g>
  )
}

export default ConnectionLine
