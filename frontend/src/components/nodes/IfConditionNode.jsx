import { Handle, Position } from 'reactflow';

const IfIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 12H10M14 12H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M10 5L3 12L10 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 5L21 12L14 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/**
 * IfConditionNode — two output handles (true / false)
 *
 * This node does NOT use BaseNode because it needs two
 * output handles at specific vertical positions.
 *
 * data props:
 *  - field     string  e.g. '{{data.status}}'
 *  - operator  string  e.g. 'equals' | 'contains' | 'gt' | 'lt'
 *  - value     string  e.g. 'active'
 *  - status    'idle'|'running'|'success'|'error'
 */
export default function IfConditionNode({ data = {}, selected }) {
  const {
    field    = '',
    operator = 'equals',
    value    = '',
    status   = 'idle',
  } = data;

  const COLOR = '#F97316';

  const statusColor = {
    idle:    'transparent',
    running: '#F59E0B',
    success: '#22C55E',
    error:   '#EF4444',
  }[status];

  const opDisplay = {
    equals:      '=',
    not_equals:  '≠',
    contains:    'contains',
    not_contains:'!contains',
    gt:          '>',
    gte:         '≥',
    lt:          '<',
    lte:         '≤',
    is_empty:    'is empty',
    is_not_empty:'is set',
  }[operator] ?? operator;

  return (
    <div
      className="flow-node"
      style={{
        '--node-accent': COLOR,
        outline: selected ? `1.5px solid ${COLOR}` : '1.5px solid transparent',
      }}
    >
      {/* Input */}
      <Handle
        type="target"
        position={Position.Left}
        className="flow-handle flow-handle--input"
        style={{ top: '50%' }}
      />

      {/* Accent line */}
      <div className="flow-node__accent" style={{ background: COLOR }} />

      {/* Header */}
      <div className="flow-node__header">
        <div className="flow-node__icon" style={{ background: `${COLOR}1A`, color: COLOR }}>
          <IfIcon />
        </div>
        <div className="flow-node__meta">
          <span className="flow-node__label">If Condition</span>
          <span className="flow-node__sublabel">Branch on value</span>
        </div>
        {status !== 'idle' && (
          <span
            className="flow-node__status"
            style={{ background: `${statusColor}1A`, color: statusColor }}
          >
            <span
              className={`flow-node__status-dot${status === 'running' ? ' flow-node__status-dot--pulse' : ''}`}
              style={{ background: statusColor }}
            />
          </span>
        )}
      </div>

      {/* Condition expression */}
      <div className="flow-node__body">
        <div className="node-branch">
          <span
            className="node-branch__value"
            style={{ color: field ? '#D4D4D8' : '#52525B', fontStyle: field ? 'normal' : 'italic', fontSize: 10 }}
          >
            {field || 'No field set'}
          </span>
          <span className="node-branch__label" style={{ margin: '0 6px', color: COLOR, fontWeight: 600, fontFamily: 'monospace', fontSize: 11 }}>
            {opDisplay}
          </span>
          <span
            className="node-branch__value"
            style={{ color: value ? '#D4D4D8' : '#52525B', fontStyle: value ? 'normal' : 'italic', fontSize: 10 }}
          >
            {value || 'No value'}
          </span>
        </div>

        {/* Output branch labels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 2 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: '#52525B' }}>True</span>
            <span style={{ fontSize: 10, color: '#22C55E', fontWeight: 500 }}>→ true branch</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: '#52525B' }}>False</span>
            <span style={{ fontSize: 10, color: '#EF4444', fontWeight: 500 }}>→ false branch</span>
          </div>
        </div>
      </div>

      {/* True output — upper right */}
      <Handle
        type="source"
        position={Position.Right}
        id="true"
        className="flow-handle flow-handle--output"
        style={{ top: '36%', background: '#111111', borderColor: '#22C55E' }}
      />

      {/* False output — lower right */}
      <Handle
        type="source"
        position={Position.Right}
        id="false"
        className="flow-handle flow-handle--output"
        style={{ top: '68%', background: '#111111', borderColor: '#EF4444' }}
      />
    </div>
  );
}
