import { Handle, Position } from 'reactflow';

/**
 * BaseNode — shared shell for all FlowOS integration nodes.
 *
 * Props:
 *  - icon        ReactElement   Icon rendered in the node header
 *  - label       string         Node title (e.g. "Gmail")
 *  - sublabel    string         Optional secondary label (e.g. account email)
 *  - color       string         Accent hex (matches per-service brand)
 *  - status      'idle'|'running'|'success'|'error'   Run state
 *  - hasInput    bool           Show left Handle
 *  - hasOutput   bool           Show right Handle
 *  - selected    bool           React Flow selection state (passed automatically)
 *  - children    ReactNode      Node body content (fields, config summary)
 */
export default function BaseNode({
  icon,
  label,
  sublabel,
  color = '#525252',
  status = 'idle',
  hasInput = true,
  hasOutput = true,
  selected = false,
  children,
}) {
  const statusColor = {
    idle:    'transparent',
    running: '#F59E0B',
    success: '#22C55E',
    error:   '#EF4444',
  }[status];

  const statusLabel = {
    idle:    null,
    running: 'Running',
    success: 'Success',
    error:   'Error',
  }[status];

  return (
    <div
      className="flow-node"
      style={{
        '--node-accent': color,
        outline: selected ? `1.5px solid ${color}` : '1.5px solid transparent',
      }}
    >
      {/* Left handle — input */}
      {hasInput && (
        <Handle
          type="target"
          position={Position.Left}
          className="flow-handle flow-handle--input"
        />
      )}

      {/* Header */}
      <div className="flow-node__header">
        <div className="flow-node__icon" style={{ background: `${color}1A`, color }}>
          {icon}
        </div>
        <div className="flow-node__meta">
          <span className="flow-node__label">{label}</span>
          {sublabel && <span className="flow-node__sublabel">{sublabel}</span>}
        </div>
        {statusLabel && (
          <span
            className="flow-node__status"
            style={{ background: `${statusColor}1A`, color: statusColor }}
          >
            <span
              className={`flow-node__status-dot${status === 'running' ? ' flow-node__status-dot--pulse' : ''}`}
              style={{ background: statusColor }}
            />
            {statusLabel}
          </span>
        )}
      </div>

      {/* Accent line */}
      <div className="flow-node__accent" style={{ background: color }} />

      {/* Body */}
      {children && <div className="flow-node__body">{children}</div>}

      {/* Right handle — output */}
      {hasOutput && (
        <Handle
          type="source"
          position={Position.Right}
          className="flow-handle flow-handle--output"
        />
      )}
    </div>
  );
}
