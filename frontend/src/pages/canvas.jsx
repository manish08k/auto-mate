import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

// ─── Node definitions ────────────────────────────────────────────────────────
const NODE_TYPES = {
  trigger: { label: 'Trigger', color: '#A78BFA', bg: '#1E1A2E' },
  transform: { label: 'Transform', color: '#38BDF8', bg: '#0F1F2E' },
  condition: { label: 'Condition', color: '#F59E0B', bg: '#2A1F0A' },
  integration: { label: 'Integration', color: '#34D399', bg: '#0D2A1E' },
  output: { label: 'Output', color: '#F87171', bg: '#2A0F0F' },
  delay: { label: 'Delay', color: '#A1A1AA', bg: '#1A1A1A' },
}

const INITIAL_NODES = [
  { id: 'n1', type: 'trigger', label: 'Stripe Webhook', x: 80, y: 180, config: { event: 'payment.succeeded' } },
  { id: 'n2', type: 'transform', label: 'Extract Customer', x: 340, y: 120, config: { fn: 'extractCustomer' } },
  { id: 'n3', type: 'condition', label: 'Amount > $100?', x: 340, y: 260, config: { field: 'amount', op: '>', value: 100 } },
  { id: 'n4', type: 'integration', label: 'Notion: Create Page', x: 600, y: 120, config: { service: 'notion', action: 'createPage' } },
  { id: 'n5', type: 'output', label: 'Slack Notify', x: 600, y: 260, config: { channel: '#revenue-alerts' } },
]

const INITIAL_EDGES = [
  { id: 'e1', from: 'n1', to: 'n2' },
  { id: 'e2', from: 'n1', to: 'n3' },
  { id: 'e3', from: 'n2', to: 'n4' },
  { id: 'e4', from: 'n3', to: 'n5' },
]

const NODE_W = 200
const NODE_H = 64

export default function Canvas() {
  const navigate = useNavigate()
  const [nodes, setNodes] = useState(INITIAL_NODES)
  const [edges] = useState(INITIAL_EDGES)
  const [selectedNode, setSelectedNode] = useState(null)
  const [dragging, setDragging] = useState(null)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [showNodeMenu, setShowNodeMenu] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [workflowName, setWorkflowName] = useState('Stripe → Notion CRM')
  const [isDirty, setIsDirty] = useState(false)
  const svgRef = useRef()
  const dragStart = useRef()

  // Drag node
  const onNodeMouseDown = useCallback((e, nodeId) => {
    e.stopPropagation()
    const node = nodes.find(n => n.id === nodeId)
    setSelectedNode(nodeId)
    setIsPanelOpen(true)
    dragStart.current = {
      mx: e.clientX, my: e.clientY,
      ox: node.x, oy: node.y,
    }
    setDragging(nodeId)
  }, [nodes])

  useEffect(() => {
    if (!dragging) return
    const onMove = (e) => {
      const dx = (e.clientX - dragStart.current.mx) / zoom
      const dy = (e.clientY - dragStart.current.my) / zoom
      setNodes(ns => ns.map(n =>
        n.id === dragging
          ? { ...n, x: dragStart.current.ox + dx, y: dragStart.current.oy + dy }
          : n
      ))
      setIsDirty(true)
    }
    const onUp = () => setDragging(null)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [dragging, zoom])

  const selectedNodeData = nodes.find(n => n.id === selectedNode)

  const getEdgePath = (from, to) => {
    const f = nodes.find(n => n.id === from)
    const t = nodes.find(n => n.id === to)
    if (!f || !t) return ''
    const x1 = f.x + NODE_W, y1 = f.y + NODE_H / 2
    const x2 = t.x, y2 = t.y + NODE_H / 2
    const cx = (x1 + x2) / 2
    return `M ${x1} ${y1} C ${cx} ${y1} ${cx} ${y2} ${x2} ${y2}`
  }

  return (
    <div style={s.page}>
      {/* Top bar */}
      <div style={s.topBar}>
        <div style={s.topLeft}>
          <button style={s.backBtn} onClick={() => navigate('/dashboard')}>← Back</button>
          <div style={s.nameWrap}>
            <input
              style={s.nameInput}
              value={workflowName}
              onChange={e => { setWorkflowName(e.target.value); setIsDirty(true) }}
            />
            {isDirty && <span style={s.dirtyDot} title="Unsaved changes" />}
          </div>
          <span style={s.wfBadge}>draft</span>
        </div>
        <div style={s.topRight}>
          <button style={s.topBtn} onClick={() => setZoom(z => Math.max(0.3, z - 0.1))}>−</button>
          <span style={s.zoomLabel}>{Math.round(zoom * 100)}%</span>
          <button style={s.topBtn} onClick={() => setZoom(z => Math.min(2, z + 0.1))}>+</button>
          <button style={s.topBtn} onClick={() => setZoom(1)}>Reset</button>
          <button style={s.topBtn}>Test run</button>
          <button style={s.saveBtn} onClick={() => setIsDirty(false)}>
            {isDirty ? 'Save changes' : '✓ Saved'}
          </button>
          <button style={s.deployBtn}>Deploy</button>
        </div>
      </div>

      <div style={s.body}>
        {/* Node palette */}
        <div style={s.palette}>
          <div style={s.paletteTitle}>Add node</div>
          {Object.entries(NODE_TYPES).map(([type, meta]) => (
            <button
              key={type}
              style={s.paletteItem}
              draggable
              onClick={() => {
                setNodes(ns => [...ns, {
                  id: `n${Date.now()}`, type,
                  label: meta.label, x: 200, y: 200 + ns.length * 80, config: {},
                }])
                setIsDirty(true)
              }}
            >
              <span style={{ ...s.paletteIcon, background: meta.bg, color: meta.color }}>
                {type[0].toUpperCase()}
              </span>
              {meta.label}
            </button>
          ))}
        </div>

        {/* Canvas */}
        <div style={s.canvasWrap} onClick={() => { setSelectedNode(null); setIsPanelOpen(false) }}>
          <svg
            ref={svgRef}
            style={s.svg}
            viewBox={`${-pan.x / zoom} ${-pan.y / zoom} ${1200 / zoom} ${700 / zoom}`}
          >
            <defs>
              <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="0.8" fill="#1F1F1F" />
              </pattern>
              <marker id="arrow" markerWidth="8" markerHeight="8" refX="8" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#3F3F46" />
              </marker>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Edges */}
            {edges.map(e => (
              <path
                key={e.id}
                d={getEdgePath(e.from, e.to)}
                fill="none"
                stroke={selectedNode && (e.from === selectedNode || e.to === selectedNode) ? '#6366F1' : '#2A2A2A'}
                strokeWidth="2"
                markerEnd="url(#arrow)"
              />
            ))}

            {/* Nodes */}
            {nodes.map(node => {
              const meta = NODE_TYPES[node.type]
              const isSelected = selectedNode === node.id
              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  onMouseDown={e => onNodeMouseDown(e, node.id)}
                  style={{ cursor: 'grab' }}
                >
                  <rect
                    width={NODE_W} height={NODE_H}
                    rx="8"
                    fill="#111111"
                    stroke={isSelected ? '#6366F1' : '#1F1F1F'}
                    strokeWidth={isSelected ? 2 : 1}
                  />
                  {/* Left accent bar */}
                  <rect width="4" height={NODE_H} rx="8" fill={meta.color} />
                  <rect width="4" height={NODE_H} rx="0" fill={meta.color} x="2" />

                  {/* Type label */}
                  <text x="16" y="20" fontSize="10" fill={meta.color} fontFamily="monospace" fontWeight="600">
                    {meta.label.toUpperCase()}
                  </text>
                  {/* Node name */}
                  <text x="16" y="42" fontSize="13" fill="#FFFFFF" fontFamily="monospace" fontWeight="500">
                    {node.label.length > 22 ? node.label.slice(0, 22) + '…' : node.label}
                  </text>

                  {/* Input port */}
                  <circle cx="0" cy={NODE_H / 2} r="5" fill="#1F1F1F" stroke="#3F3F46" strokeWidth="1.5" />
                  {/* Output port */}
                  <circle cx={NODE_W} cy={NODE_H / 2} r="5" fill="#1F1F1F" stroke="#3F3F46" strokeWidth="1.5" />
                </g>
              )
            })}
          </svg>
        </div>

        {/* Config panel */}
        {isPanelOpen && selectedNodeData && (
          <div style={s.panel}>
            <div style={s.panelHeader}>
              <div>
                <div style={s.panelType}>{NODE_TYPES[selectedNodeData.type]?.label}</div>
                <div style={s.panelName}>{selectedNodeData.label}</div>
              </div>
              <button style={s.panelClose} onClick={() => setIsPanelOpen(false)}>✕</button>
            </div>

            <div style={s.panelSection}>
              <div style={s.panelSectionTitle}>Node label</div>
              <input
                style={s.panelInput}
                value={selectedNodeData.label}
                onChange={e => {
                  setNodes(ns => ns.map(n => n.id === selectedNodeData.id ? { ...n, label: e.target.value } : n))
                  setIsDirty(true)
                }}
              />
            </div>

            <div style={s.panelSection}>
              <div style={s.panelSectionTitle}>Configuration</div>
              {Object.entries(selectedNodeData.config).map(([k, v]) => (
                <div key={k} style={s.configRow}>
                  <label style={s.configKey}>{k}</label>
                  <input
                    style={s.panelInput}
                    defaultValue={String(v)}
                    onChange={e => {
                      setNodes(ns => ns.map(n =>
                        n.id === selectedNodeData.id
                          ? { ...n, config: { ...n.config, [k]: e.target.value } }
                          : n
                      ))
                      setIsDirty(true)
                    }}
                  />
                </div>
              ))}
              {Object.keys(selectedNodeData.config).length === 0 && (
                <div style={s.panelEmpty}>No configuration required for this node.</div>
              )}
            </div>

            <div style={s.panelSection}>
              <div style={s.panelSectionTitle}>Node type</div>
              <select
                style={s.panelSelect}
                value={selectedNodeData.type}
                onChange={e => {
                  setNodes(ns => ns.map(n => n.id === selectedNodeData.id ? { ...n, type: e.target.value } : n))
                  setIsDirty(true)
                }}
              >
                {Object.entries(NODE_TYPES).map(([t, m]) => (
                  <option key={t} value={t}>{m.label}</option>
                ))}
              </select>
            </div>

            <div style={s.panelFooter}>
              <button
                style={s.deleteBtn}
                onClick={() => {
                  setNodes(ns => ns.filter(n => n.id !== selectedNodeData.id))
                  setSelectedNode(null)
                  setIsPanelOpen(false)
                  setIsDirty(true)
                }}
              >
                Delete node
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom status bar */}
      <div style={s.statusBar}>
        <span style={s.statusItem}>Nodes: {nodes.length}</span>
        <span style={s.statusItem}>Edges: {edges.length}</span>
        <span style={s.statusItem}>Zoom: {Math.round(zoom * 100)}%</span>
        <span style={{ ...s.statusItem, marginLeft: 'auto' }}>
          {isDirty ? '● Unsaved changes' : '✓ Saved'}
        </span>
      </div>
    </div>
  )
}

const s = {
  page: {
    display: 'flex', flexDirection: 'column', height: '100vh',
    background: '#0A0A0A', color: '#FFFFFF',
    fontFamily: "'GeistMono', 'JetBrains Mono', monospace",
    overflow: 'hidden',
  },
  topBar: {
    height: 52, borderBottom: '1px solid #1F1F1F',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 16px', flexShrink: 0, background: '#0A0A0A',
  },
  topLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  topRight: { display: 'flex', alignItems: 'center', gap: 8 },
  backBtn: {
    background: 'transparent', border: 'none',
    color: '#52525B', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
  },
  nameWrap: { display: 'flex', alignItems: 'center', gap: 6 },
  nameInput: {
    background: 'transparent', border: '1px solid transparent',
    borderRadius: 4, padding: '4px 8px',
    fontSize: 14, fontWeight: 500, color: '#FFFFFF',
    fontFamily: 'inherit', outline: 'none',
  },
  dirtyDot: {
    width: 6, height: 6, borderRadius: '50%',
    background: '#F59E0B', display: 'inline-block',
  },
  wfBadge: {
    fontSize: 11, color: '#52525B',
    background: '#111111', border: '1px solid #1F1F1F',
    borderRadius: 4, padding: '2px 8px',
  },
  topBtn: {
    background: '#111111', border: '1px solid #1F1F1F',
    borderRadius: 5, padding: '5px 10px',
    fontSize: 12, color: '#A1A1AA', cursor: 'pointer', fontFamily: 'inherit',
  },
  zoomLabel: { fontSize: 12, color: '#52525B', minWidth: 36, textAlign: 'center' },
  saveBtn: {
    background: '#111111', border: '1px solid #1F1F1F',
    borderRadius: 5, padding: '5px 12px',
    fontSize: 12, color: '#FFFFFF', cursor: 'pointer', fontFamily: 'inherit',
  },
  deployBtn: {
    background: '#FFFFFF', color: '#0A0A0A',
    border: 'none', borderRadius: 5,
    padding: '5px 14px', fontSize: 12, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit',
  },
  body: { flex: 1, display: 'flex', overflow: 'hidden' },
  palette: {
    width: 180, flexShrink: 0,
    borderRight: '1px solid #1F1F1F',
    padding: '16px 8px', display: 'flex', flexDirection: 'column', gap: 4,
    background: '#0A0A0A', overflowY: 'auto',
  },
  paletteTitle: { fontSize: 10, color: '#52525B', letterSpacing: 1, textTransform: 'uppercase', padding: '0 8px', marginBottom: 8 },
  paletteItem: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: 'transparent', border: '1px solid #1F1F1F',
    borderRadius: 6, padding: '8px 10px',
    fontSize: 12, color: '#A1A1AA', cursor: 'pointer', fontFamily: 'inherit',
    textAlign: 'left',
  },
  paletteIcon: {
    width: 22, height: 22, borderRadius: 4,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 11, fontWeight: 600, flexShrink: 0,
  },
  canvasWrap: { flex: 1, overflow: 'hidden', position: 'relative' },
  svg: { width: '100%', height: '100%', background: '#0D0D0D' },
  panel: {
    width: 280, flexShrink: 0,
    borderLeft: '1px solid #1F1F1F',
    background: '#0A0A0A', overflowY: 'auto',
    display: 'flex', flexDirection: 'column',
  },
  panelHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: '16px', borderBottom: '1px solid #1F1F1F',
  },
  panelType: { fontSize: 10, color: '#52525B', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  panelName: { fontSize: 14, fontWeight: 500 },
  panelClose: {
    background: 'transparent', border: 'none',
    color: '#52525B', cursor: 'pointer', fontSize: 14,
    fontFamily: 'inherit', padding: 0,
  },
  panelSection: { padding: '16px', borderBottom: '1px solid #1F1F1F' },
  panelSectionTitle: { fontSize: 10, color: '#52525B', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  panelInput: {
    width: '100%', background: '#111111', border: '1px solid #1F1F1F',
    borderRadius: 5, padding: '8px 10px', fontSize: 12, color: '#FFFFFF',
    fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
  },
  panelSelect: {
    width: '100%', background: '#111111', border: '1px solid #1F1F1F',
    borderRadius: 5, padding: '8px 10px', fontSize: 12, color: '#FFFFFF',
    fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
  },
  configRow: { marginBottom: 10 },
  configKey: { display: 'block', fontSize: 11, color: '#52525B', marginBottom: 4 },
  panelEmpty: { fontSize: 12, color: '#3F3F46', fontStyle: 'italic' },
  panelFooter: { padding: '16px', marginTop: 'auto' },
  deleteBtn: {
    width: '100%', background: 'transparent', border: '1px solid #2A1515',
    borderRadius: 5, padding: '8px', fontSize: 12, color: '#EF4444',
    cursor: 'pointer', fontFamily: 'inherit',
  },
  statusBar: {
    height: 28, borderTop: '1px solid #1F1F1F',
    display: 'flex', alignItems: 'center', gap: 20,
    padding: '0 16px', flexShrink: 0, background: '#0A0A0A',
  },
  statusItem: { fontSize: 11, color: '#3F3F46' },
}