// CanvasBoard.jsx
// Main workflow canvas — infinite pan/zoom board that composes
// NodeCard, ConnectionLine, NodePanel, and MiniMap.

import { useState, useRef, useCallback, useEffect } from 'react'
import { NodeCard }       from './NodeCard.jsx'
import { NodePanel }      from './NodePanel.jsx'
import { ConnectionLine } from './ConnectionLine.jsx'
import { MiniMap }        from './MiniMap.jsx'
import { Sidebar }        from '../layout/Sidebar.jsx'
import { Navbar }         from '../layout/Navbar.jsx'

const T = {
  bg:      '#0A0A0A',
  surface: '#111111',
  border:  '#1F1F1F',
  text:    '#FFFFFF',
  textSec: '#A1A1AA',
  textDim: '#3A3A3A',
  hover:   '#161616',
  success: '#6fcf97',
  danger:  '#eb5757',
  warning: '#f2c94c',
  running: '#38BDF8',
}

// ── Demo seed data ─────────────────────────────────────────────────────────
const SEED_NODES = [
  { id: 'n1', type: 'trigger',   label: 'Stripe Webhook',    subLabel: 'On payment.succeeded', x: 80,  y: 200, status: 'success', duration: '12ms'  },
  { id: 'n2', type: 'action',    label: 'Extract Customer',  subLabel: 'Parse event payload',   x: 380, y: 120, status: 'success', duration: '3ms'   },
  { id: 'n3', type: 'condition', label: 'Amount > $100?',    subLabel: 'Filter condition',       x: 380, y: 300, status: 'success', duration: '1ms'   },
  { id: 'n4', type: 'action',    label: 'Notion: Add Page',  subLabel: 'CRM database',          x: 680, y: 120, status: 'failed',  duration: '820ms', error: 'Rate limit exceeded (429)' },
  { id: 'n5', type: 'notification', label: 'Slack Alert',   subLabel: '#ops channel',           x: 680, y: 300, status: 'skipped', duration: null    },
  { id: 'n6', type: 'end',       label: 'End',               subLabel: '',                       x: 960, y: 200, status: 'idle'                       },
]

const SEED_EDGES = [
  { id: 'e1', source: 'n1', target: 'n2', status: 'success' },
  { id: 'e2', source: 'n1', target: 'n3', status: 'success' },
  { id: 'e3', source: 'n2', target: 'n4', status: 'failed',  label: 'true'  },
  { id: 'e4', source: 'n3', target: 'n5', status: 'skipped', label: 'false' },
  { id: 'e5', source: 'n4', target: 'n6', status: 'idle'    },
  { id: 'e6', source: 'n5', target: 'n6', status: 'idle'    },
]

const NODE_W = 220
const NODE_H = 80

// ── Utility: anchor points ─────────────────────────────────────────────────
function getAnchors(nodes, sourceId, targetId) {
  const s = nodes.find(n => n.id === sourceId)
  const t = nodes.find(n => n.id === targetId)
  if (!s || !t) return null
  return {
    x1: s.x + NODE_W,
    y1: s.y + NODE_H / 2,
    x2: t.x,
    y2: t.y + NODE_H / 2,
  }
}

// ── Toolbar button ─────────────────────────────────────────────────────────
function ToolBtn({ label, onClick, active, title }) {
  return (
    <button
      onClick={onClick}
      title={title ?? label}
      style={{
        padding: '5px 10px', borderRadius: 5,
        border: `1px solid ${active ? '#3a3a3a' : T.border}`,
        background: active ? '#1a1a1a' : 'transparent',
        color: active ? T.text : T.textSec,
        fontSize: 12, cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 5,
        fontFamily: 'inherit',
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = T.hover }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
    >{label}</button>
  )
}

// ── Main CanvasBoard ───────────────────────────────────────────────────────
export default function CanvasBoard() {
  const [nodes,       setNodes]       = useState(SEED_NODES)
  const [edges,       setEdges]       = useState(SEED_EDGES)
  const [selectedId,  setSelectedId]  = useState(null)
  const [selectedEdge,setSelectedEdge]= useState(null)
  const [pan,         setPan]         = useState({ x: 40, y: 40 })
  const [zoom,        setZoom]        = useState(1)
  const [tool,        setTool]        = useState('select')  // 'select' | 'pan' | 'comment'
  const [runState,    setRunState]    = useState('idle')    // 'idle' | 'running' | 'done'

  const boardRef  = useRef(null)
  const dragging  = useRef(null)   // { nodeId, startX, startY, origX, origY }
  const panning   = useRef(null)   // { startX, startY, origPanX, origPanY }

  const selectedNode = nodes.find(n => n.id === selectedId) ?? null

  // ── Node drag ──────────────────────────────────────────────────────────
  const onNodeDragStart = useCallback((nodeId, e) => {
    if (tool !== 'select') return
    const node = nodes.find(n => n.id === nodeId)
    if (!node) return
    dragging.current = { nodeId, startX: e.clientX, startY: e.clientY, origX: node.x, origY: node.y }
  }, [nodes, tool])

  const onMouseMove = useCallback((e) => {
    if (dragging.current) {
      const { nodeId, startX, startY, origX, origY } = dragging.current
      const dx = (e.clientX - startX) / zoom
      const dy = (e.clientY - startY) / zoom
      setNodes(ns => ns.map(n => n.id === nodeId ? { ...n, x: origX + dx, y: origY + dy } : n))
      return
    }
    if (panning.current) {
      const { startX, startY, origPanX, origPanY } = panning.current
      setPan({ x: origPanX + (e.clientX - startX), y: origPanY + (e.clientY - startY) })
    }
  }, [zoom])

  const onMouseUp = useCallback(() => {
    dragging.current = null
    panning.current  = null
  }, [])

  // ── Board pan (middle mouse or pan tool) ───────────────────────────────
  const onBoardMouseDown = useCallback((e) => {
    if (e.target !== boardRef.current && e.target.tagName !== 'svg' && !e.target.closest('svg')) return
    if (tool === 'pan' || e.button === 1) {
      panning.current = { startX: e.clientX, startY: e.clientY, origPanX: pan.x, origPanY: pan.y }
      e.preventDefault()
    } else {
      setSelectedId(null)
      setSelectedEdge(null)
    }
  }, [tool, pan])

  // ── Zoom (scroll wheel) ────────────────────────────────────────────────
  const onWheel = useCallback((e) => {
    e.preventDefault()
    const factor = e.deltaY < 0 ? 1.08 : 0.93
    setZoom(z => Math.min(2, Math.max(0.25, z * factor)))
  }, [])

  useEffect(() => {
    const el = boardRef.current
    if (!el) return
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [onWheel])

  // ── Node field change ──────────────────────────────────────────────────
  const onNodeChange = useCallback((field, value) => {
    setNodes(ns => ns.map(n => n.id === selectedId ? { ...n, [field]: value } : n))
  }, [selectedId])

  // ── Delete node ────────────────────────────────────────────────────────
  const onDelete = useCallback((nodeId) => {
    setNodes(ns => ns.filter(n => n.id !== nodeId))
    setEdges(es => es.filter(e => e.source !== nodeId && e.target !== nodeId))
    setSelectedId(null)
  }, [])

  // ── Add node ───────────────────────────────────────────────────────────
  const addNode = () => {
    const id = `n${Date.now()}`
    setNodes(ns => [...ns, {
      id, type: 'action', label: 'New step', subLabel: '', status: 'idle',
      x: (-pan.x / zoom) + 400, y: (-pan.y / zoom) + 200,
    }])
    setSelectedId(id)
  }

  // ── Simulate run ──────────────────────────────────────────────────────
  const runWorkflow = () => {
    setRunState('running')
    setNodes(ns => ns.map(n => ({ ...n, status: 'running' })))
    setTimeout(() => {
      setNodes(ns => ns.map((n, i) => ({
        ...n, status: i % 5 === 3 ? 'failed' : 'success',
        duration: `${Math.floor(Math.random() * 800 + 10)}ms`,
      })))
      setRunState('done')
    }, 1800)
  }

  // ── Canvas dimensions for minimap ──────────────────────────────────────
  const CANVAS_W = 3000
  const CANVAS_H = 2000
  const boardEl  = boardRef.current
  const vpW      = boardEl ? boardEl.clientWidth  : 1200
  const vpH      = boardEl ? boardEl.clientHeight : 700
  const viewport = {
    x: -pan.x / zoom,
    y: -pan.y / zoom,
    width:  vpW / zoom,
    height: vpH / zoom,
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: T.bg, fontFamily: 'system-ui, -apple-system, sans-serif', overflow: 'hidden' }}>
      <Sidebar activePage="canvas" />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Navbar
          title="Stripe → Notion Sync"
          breadcrumbs={[{ label: 'Workflows', href: '/workflows' }]}
          actions={
            <div style={{ display: 'flex', gap: 6 }}>
              <ToolBtn label="Save" onClick={() => {}} title="Save workflow (⌘S)" />
              <button
                onClick={runWorkflow}
                disabled={runState === 'running'}
                style={{
                  padding: '5px 14px', borderRadius: 5, fontSize: 12, fontWeight: 600,
                  border: 'none', cursor: runState === 'running' ? 'not-allowed' : 'pointer',
                  background: runState === 'running' ? '#1a1a1a' : T.text,
                  color: runState === 'running' ? T.textDim : T.bg,
                }}
              >
                {runState === 'running' ? '● Running…' : '▶ Run'}
              </button>
            </div>
          }
        />

        {/* ── Canvas toolbar ── */}
        <div style={{
          height: 44, borderBottom: `1px solid ${T.border}`,
          display: 'flex', alignItems: 'center', padding: '0 14px', gap: 6,
          background: T.bg, flexShrink: 0,
        }}>
          {/* Tool group */}
          <div style={{ display: 'flex', gap: 4, padding: '3px', background: '#111', border: `1px solid ${T.border}`, borderRadius: 6 }}>
            {[
              { id: 'select', label: '↖ Select' },
              { id: 'pan',    label: '✋ Pan'    },
            ].map(t => (
              <button key={t.id} onClick={() => setTool(t.id)} style={{
                padding: '4px 10px', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 11,
                background: tool === t.id ? '#1f1f1f' : 'transparent',
                color: tool === t.id ? T.text : T.textSec,
              }}>{t.label}</button>
            ))}
          </div>

          <div style={{ width: 1, height: 20, background: T.border, margin: '0 4px' }} />

          {/* Node types to drag/add */}
          <ToolBtn label="+ Trigger"     onClick={addNode} />
          <ToolBtn label="+ Action"      onClick={addNode} />
          <ToolBtn label="+ Condition"   onClick={addNode} />
          <ToolBtn label="+ Transform"   onClick={addNode} />

          <div style={{ flex: 1 }} />

          {/* Zoom controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button onClick={() => setZoom(z => Math.max(0.25, z - 0.1))}
              style={{ width: 26, height: 26, borderRadius: 5, border: `1px solid ${T.border}`, background: 'transparent', color: T.textSec, cursor: 'pointer', fontSize: 16 }}>−</button>
            <span style={{ fontSize: 11, color: T.textSec, minWidth: 40, textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(2, z + 0.1))}
              style={{ width: 26, height: 26, borderRadius: 5, border: `1px solid ${T.border}`, background: 'transparent', color: T.textSec, cursor: 'pointer', fontSize: 16 }}>+</button>
            <button onClick={() => { setZoom(1); setPan({ x: 40, y: 40 }) }}
              style={{ padding: '4px 8px', borderRadius: 5, border: `1px solid ${T.border}`, background: 'transparent', color: T.textSec, cursor: 'pointer', fontSize: 11 }}>Reset</button>
          </div>

          {/* Edge count indicator */}
          <div style={{ width: 1, height: 20, background: T.border, margin: '0 4px' }} />
          <span style={{ fontSize: 11, color: T.textDim }}>{nodes.length} nodes · {edges.length} edges</span>
        </div>

        {/* ── Canvas + Panel row ── */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>

          {/* ── Infinite canvas ── */}
          <div
            ref={boardRef}
            onMouseDown={onBoardMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            style={{
              flex: 1,
              overflow: 'hidden',
              position: 'relative',
              cursor: tool === 'pan' ? 'grab' : 'default',
              background: T.bg,
            }}
          >
            {/* Dot grid background */}
            <svg
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <pattern
                  id="dot-grid"
                  x={pan.x % (20 * zoom)}
                  y={pan.y % (20 * zoom)}
                  width={20 * zoom}
                  height={20 * zoom}
                  patternUnits="userSpaceOnUse"
                >
                  <circle cx={1} cy={1} r={0.8} fill="#1f1f1f" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#dot-grid)" />
            </svg>

            {/* Transform group: pan + zoom */}
            <div style={{
              position: 'absolute',
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              width: CANVAS_W,
              height: CANVAS_H,
            }}>
              {/* ── Edges (SVG layer) ── */}
              <svg
                style={{ position: 'absolute', top: 0, left: 0, width: CANVAS_W, height: CANVAS_H, overflow: 'visible', pointerEvents: 'none' }}
                xmlns="http://www.w3.org/2000/svg"
              >
                {edges.map(edge => {
                  const anchors = getAnchors(nodes, edge.source, edge.target)
                  if (!anchors) return null
                  return (
                    <ConnectionLine
                      key={edge.id}
                      {...anchors}
                      status={edge.status}
                      label={edge.label}
                      selected={selectedEdge === edge.id}
                      animated={edge.status === 'running'}
                      onClick={() => { setSelectedEdge(edge.id); setSelectedId(null) }}
                    />
                  )
                })}
              </svg>

              {/* ── Nodes ── */}
              {nodes.map(node => (
                <NodeCard
                  key={node.id}
                  node={{ ...node, selected: selectedId === node.id }}
                  style={{ position: 'absolute', left: node.x, top: node.y }}
                  onSelect={id => { setSelectedId(id); setSelectedEdge(null) }}
                  onDragStart={onNodeDragStart}
                  onDelete={onDelete}
                />
              ))}
            </div>

            {/* ── MiniMap ── */}
            <MiniMap
              nodes={nodes.map(n => ({ ...n, width: NODE_W, height: NODE_H }))}
              canvasWidth={CANVAS_W}
              canvasHeight={CANVAS_H}
              viewport={viewport}
              zoom={zoom}
              onViewportChange={({ x, y }) => setPan({ x: -x * zoom, y: -y * zoom })}
            />

            {/* ── Empty state (no nodes) ── */}
            {nodes.length === 0 && (
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                pointerEvents: 'none',
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: T.surface, border: `1px solid ${T.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 16, fontSize: 22,
                }}>⚡</div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: T.text }}>Start building your workflow</p>
                <p style={{ margin: '8px 0 0', fontSize: 13, color: T.textDim }}>Add a trigger to get started</p>
              </div>
            )}

            {/* ── Run status banner ── */}
            {runState === 'running' && (
              <div style={{
                position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
                background: '#0a1a28', border: `1px solid ${T.running}`,
                borderRadius: 6, padding: '8px 18px',
                display: 'flex', alignItems: 'center', gap: 8,
                fontSize: 12, color: T.running, zIndex: 20,
              }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: T.running, display: 'block', animation: 'pulse 1s infinite' }} />
                Running workflow…
                <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
              </div>
            )}
          </div>

          {/* ── Node panel (right drawer) ── */}
          {selectedNode && (
            <NodePanel
              node={selectedNode}
              onClose={() => setSelectedId(null)}
              onChange={onNodeChange}
              onDelete={onDelete}
              onRun={id => console.log('Run step', id)}
            />
          )}
        </div>

        {/* ── Bottom status bar ── */}
        <div style={{
          height: 28, borderTop: `1px solid ${T.border}`,
          display: 'flex', alignItems: 'center', padding: '0 14px', gap: 14,
          background: T.bg, flexShrink: 0,
        }}>
          <span style={{ fontSize: 10, color: T.textDim }}>
            Pan: {Math.round(-pan.x / zoom)}, {Math.round(-pan.y / zoom)}
          </span>
          <span style={{ fontSize: 10, color: T.textDim }}>Zoom: {Math.round(zoom * 100)}%</span>
          <div style={{ flex: 1 }} />
          {runState === 'done' && (
            <span style={{ fontSize: 10, color: T.success }}>✓ Last run: {new Date().toLocaleTimeString()}</span>
          )}
          <span style={{ fontSize: 10, color: T.textDim }}>Scroll to zoom · Drag to pan</span>
        </div>
      </div>
    </div>
  )
}
