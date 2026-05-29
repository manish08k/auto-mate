// NodePanel.jsx
// Right-side settings panel that slides in when a node is selected.
// Mounted inside CanvasBoard layout — fixed right edge.

import { useState } from 'react'

const T = {
  bg:      '#0A0A0A',
  surface: '#111111',
  border:  '#1F1F1F',
  borderDim: '#161616',
  text:    '#FFFFFF',
  textSec: '#A1A1AA',
  textDim: '#3A3A3A',
  hover:   '#161616',
  success: '#6fcf97',
  danger:  '#eb5757',
  warning: '#f2c94c',
  running: '#38BDF8',
}

// ── Shared atoms ───────────────────────────────────────────────────────────
const labelStyle = {
  display: 'block', marginBottom: 5,
  fontSize: 11, fontWeight: 500,
  color: T.textSec, letterSpacing: '0.02em',
}
const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  padding: '7px 10px', borderRadius: 5,
  border: `1px solid ${T.border}`,
  background: '#0d0d0d', color: T.text,
  fontSize: 12, outline: 'none', fontFamily: 'inherit',
}
const selectStyle = { ...inputStyle }

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={labelStyle}>{label}</label>}
      {children}
    </div>
  )
}

function Divider({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0 14px' }}>
      {label && <span style={{ fontSize: 10, fontWeight: 600, color: T.textDim, textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>{label}</span>}
      <div style={{ flex: 1, height: 1, background: T.border }} />
    </div>
  )
}

function Toggle({ enabled, onChange }) {
  return (
    <button onClick={() => onChange(!enabled)} style={{
      width: 32, height: 18, borderRadius: 9, border: 'none',
      background: enabled ? T.text : '#2a2a2a',
      cursor: 'pointer', position: 'relative', flexShrink: 0,
      transition: 'background 0.15s',
    }}>
      <span style={{
        position: 'absolute', top: 2,
        left: enabled ? 16 : 2,
        width: 14, height: 14, borderRadius: '50%',
        background: enabled ? T.bg : '#555',
        transition: 'left 0.15s',
      }} />
    </button>
  )
}

// ── Tab panels ─────────────────────────────────────────────────────────────

function ConfigTab({ node, onChange }) {
  return (
    <div style={{ padding: '16px 16px 80px' }}>

      {/* Step label */}
      <Field label="Step name">
        <input
          style={inputStyle}
          value={node.label}
          onChange={e => onChange('label', e.target.value)}
        />
      </Field>

      {/* Sub label / description */}
      <Field label="Description">
        <input
          style={inputStyle}
          placeholder="Optional step description…"
          value={node.subLabel ?? ''}
          onChange={e => onChange('subLabel', e.target.value)}
        />
      </Field>

      <Divider label="Integration" />

      {/* Service */}
      <Field label="Service">
        <select style={selectStyle} value={node.service ?? 'stripe'} onChange={e => onChange('service', e.target.value)}>
          {['Stripe','Notion','Slack','Airtable','GitHub','HubSpot','HTTP'].map(s => (
            <option key={s} value={s.toLowerCase()}>{s}</option>
          ))}
        </select>
      </Field>

      {/* Action / operation */}
      <Field label="Operation">
        <select style={selectStyle} value={node.operation ?? ''} onChange={e => onChange('operation', e.target.value)}>
          <option value="">Select operation…</option>
          <option value="create">Create record</option>
          <option value="update">Update record</option>
          <option value="delete">Delete record</option>
          <option value="get">Get record</option>
          <option value="list">List records</option>
          <option value="send">Send message</option>
          <option value="trigger">On event</option>
        </select>
      </Field>

      <Divider label="Parameters" />

      {/* Dynamic key-value params */}
      {(node.params ?? [{ key: '', value: '' }]).map((param, i) => (
        <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          <input
            style={{ ...inputStyle, flex: 1 }}
            placeholder="key"
            value={param.key}
            onChange={e => {
              const updated = [...(node.params ?? [])]
              updated[i] = { ...updated[i], key: e.target.value }
              onChange('params', updated)
            }}
          />
          <input
            style={{ ...inputStyle, flex: 2 }}
            placeholder="value or {{expression}}"
            value={param.value}
            onChange={e => {
              const updated = [...(node.params ?? [])]
              updated[i] = { ...updated[i], value: e.target.value }
              onChange('params', updated)
            }}
          />
          <button
            onClick={() => {
              const updated = (node.params ?? []).filter((_, idx) => idx !== i)
              onChange('params', updated)
            }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textDim, fontSize: 16, padding: '0 4px' }}
          >×</button>
        </div>
      ))}
      <button
        onClick={() => onChange('params', [...(node.params ?? []), { key: '', value: '' }])}
        style={{
          fontSize: 11, color: T.textSec, background: 'none',
          border: `1px dashed ${T.border}`, borderRadius: 5,
          padding: '5px 10px', cursor: 'pointer', width: '100%', marginBottom: 14,
        }}
      >+ Add parameter</button>

      <Divider label="Error handling" />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <p style={{ margin: 0, fontSize: 12, color: T.text }}>Continue on error</p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: T.textDim }}>Don't stop workflow on failure</p>
        </div>
        <Toggle enabled={node.continueOnError ?? false} onChange={v => onChange('continueOnError', v)} />
      </div>

      <Field label="Retry attempts">
        <select style={selectStyle} value={node.retries ?? '0'} onChange={e => onChange('retries', e.target.value)}>
          {['0','1','2','3','5'].map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      </Field>
    </div>
  )
}

function OutputTab({ node }) {
  const output = node.lastOutput ?? null

  if (!output) {
    return (
      <div style={{ padding: '40px 16px', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: 13, color: T.textDim }}>No output yet</p>
        <p style={{ margin: '6px 0 0', fontSize: 11, color: T.textDim }}>Run the workflow to see output here.</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <p style={{ margin: 0, fontSize: 11, color: T.textDim }}>Last run: {node.lastRun ?? '—'}</p>
        <button
          onClick={() => navigator.clipboard?.writeText(JSON.stringify(output, null, 2))}
          style={{ fontSize: 11, color: T.textSec, background: 'none', border: `1px solid ${T.border}`, borderRadius: 4, padding: '3px 8px', cursor: 'pointer' }}
        >Copy</button>
      </div>
      <pre style={{
        margin: 0, padding: '12px', borderRadius: 6,
        background: '#0d0d0d', border: `1px solid ${T.border}`,
        fontSize: 11, color: T.textSec, lineHeight: 1.7,
        overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
        maxHeight: 400, overflowY: 'auto',
      }}>
        {JSON.stringify(output, null, 2)}
      </pre>
    </div>
  )
}

function LogsTab({ node }) {
  const logs = node.logs ?? []

  if (!logs.length) {
    return (
      <div style={{ padding: '40px 16px', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: 13, color: T.textDim }}>No logs for this step</p>
      </div>
    )
  }

  const LEVEL_COLOR = { info: T.textSec, warn: T.warning, error: T.danger, debug: T.textDim }

  return (
    <div style={{ padding: '12px 16px' }}>
      <div style={{
        background: '#0d0d0d', border: `1px solid ${T.border}`,
        borderRadius: 6, overflow: 'hidden',
        fontFamily: '"SF Mono", "Fira Code", monospace',
        fontSize: 11, lineHeight: 1.7,
        maxHeight: 420, overflowY: 'auto',
      }}>
        {logs.map((log, i) => (
          <div key={i} style={{
            display: 'flex', gap: 10, padding: '4px 10px',
            borderBottom: i < logs.length - 1 ? `1px solid ${T.borderDim}` : 'none',
          }}>
            <span style={{ color: T.textDim, flexShrink: 0 }}>{log.time}</span>
            <span style={{ color: LEVEL_COLOR[log.level] ?? T.textSec, flexShrink: 0, textTransform: 'uppercase', fontSize: 9, paddingTop: 1 }}>{log.level}</span>
            <span style={{ color: T.textSec, wordBreak: 'break-all' }}>{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main NodePanel ─────────────────────────────────────────────────────────
/**
 * Props:
 *   node       {object | null}  The selected node object (null = hidden)
 *   onClose    {fn}
 *   onChange   {fn}             Called with (field, value) for live edits
 *   onDelete   {fn}
 *   onRun      {fn}             Run just this step
 */
export function NodePanel({ node, onClose, onChange, onDelete, onRun }) {
  const [activeTab, setActiveTab] = useState('config')

  if (!node) return null

  const STATUS_COLOR = {
    idle:    T.textDim,
    running: T.running,
    success: T.success,
    failed:  T.danger,
    skipped: T.textDim,
  }

  const tabs = [
    { id: 'config', label: 'Config' },
    { id: 'output', label: 'Output' },
    { id: 'logs',   label: 'Logs'   },
  ]

  return (
    <div style={{
      position: 'absolute',
      top: 0, right: 0, bottom: 0,
      width: 320,
      background: T.bg,
      borderLeft: `1px solid ${T.border}`,
      display: 'flex',
      flexDirection: 'column',
      zIndex: 40,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      overflow: 'hidden',
    }}>

      {/* ── Panel header ── */}
      <div style={{
        padding: '14px 16px',
        borderBottom: `1px solid ${T.border}`,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {node.label ?? 'Untitled step'}
            </p>
            <p style={{ margin: '3px 0 0', fontSize: 11, color: T.textDim }}>
              {node.type ?? 'action'} · ID: <code style={{ fontSize: 10, color: T.textDim }}>{node.id}</code>
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textDim, fontSize: 18, lineHeight: 1, flexShrink: 0, padding: 2 }}
          >×</button>
        </div>

        {/* Status + actions row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: STATUS_COLOR[node.status ?? 'idle'] }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_COLOR[node.status ?? 'idle'], display: 'block' }} />
            {node.status ? node.status.charAt(0).toUpperCase() + node.status.slice(1) : 'Idle'}
          </span>
          {node.duration && (
            <span style={{ fontSize: 11, color: T.textDim }}>· {node.duration}</span>
          )}
          <div style={{ flex: 1 }} />
          <button
            onClick={() => onRun && onRun(node.id)}
            style={{
              padding: '4px 12px', borderRadius: 5, fontSize: 11, fontWeight: 500,
              border: 'none', background: T.text, color: T.bg, cursor: 'pointer',
            }}
          >▶ Run step</button>
          <button
            onClick={() => onDelete && onDelete(node.id)}
            style={{
              padding: '4px 10px', borderRadius: 5, fontSize: 11,
              border: `1px solid #2a1a1a`, background: 'transparent', color: T.danger, cursor: 'pointer',
            }}
          >Delete</button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{
        display: 'flex', borderBottom: `1px solid ${T.border}`,
        flexShrink: 0,
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1, padding: '9px 0',
              background: 'transparent', border: 'none',
              borderBottom: `2px solid ${activeTab === tab.id ? T.text : 'transparent'}`,
              cursor: 'pointer', fontSize: 12, fontWeight: 500,
              color: activeTab === tab.id ? T.text : T.textSec,
              marginBottom: -1,
            }}
          >{tab.label}</button>
        ))}
      </div>

      {/* ── Tab content (scrollable) ── */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {activeTab === 'config' && <ConfigTab node={node} onChange={onChange ?? (() => {})} />}
        {activeTab === 'output' && <OutputTab node={node} />}
        {activeTab === 'logs'   && <LogsTab   node={node} />}
      </div>

      {/* ── Sticky save footer (config tab only) ── */}
      {activeTab === 'config' && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '12px 16px',
          background: T.bg,
          borderTop: `1px solid ${T.border}`,
          display: 'flex', gap: 8,
        }}>
          <button style={{
            flex: 1, padding: '8px 0', borderRadius: 6,
            background: T.text, color: T.bg,
            border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}>Save changes</button>
          <button style={{
            padding: '8px 14px', borderRadius: 6,
            background: 'transparent', color: T.textSec,
            border: `1px solid ${T.border}`, fontSize: 12, cursor: 'pointer',
          }}>Reset</button>
        </div>
      )}
    </div>
  )
}

export default NodePanel
