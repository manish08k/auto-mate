import { useState } from 'react'
import { Sidebar } from './Dashboard'

const INTEGRATIONS = [
  { id: 'c1', name: 'Stripe Production', service: 'Stripe', type: 'api_key', status: 'connected', lastUsed: '2 min ago', usedBy: 3, createdAt: 'Mar 12, 2026' },
  { id: 'c2', name: 'Notion Workspace', service: 'Notion', type: 'oauth', status: 'connected', lastUsed: '14 min ago', usedBy: 2, createdAt: 'Mar 15, 2026' },
  { id: 'c3', name: 'Slack #revenue-alerts', service: 'Slack', type: 'oauth', status: 'connected', lastUsed: '1 hr ago', usedBy: 4, createdAt: 'Apr 2, 2026' },
  { id: 'c4', name: 'GitHub org/flowmatic', service: 'GitHub', type: 'oauth', status: 'connected', lastUsed: '2 days ago', usedBy: 1, createdAt: 'Apr 10, 2026' },
  { id: 'c5', name: 'Airtable Base', service: 'Airtable', type: 'api_key', status: 'expired', lastUsed: '3 days ago', usedBy: 1, createdAt: 'May 1, 2026' },
  { id: 'c6', name: 'SendGrid Marketing', service: 'SendGrid', type: 'api_key', status: 'error', lastUsed: '1 hr ago', usedBy: 2, createdAt: 'May 10, 2026' },
  { id: 'c7', name: 'Postgres prod-db', service: 'PostgreSQL', type: 'connection_string', status: 'connected', lastUsed: '5 hrs ago', usedBy: 0, createdAt: 'May 20, 2026' },
]

const SERVICE_ICONS = {
  Stripe: '💳',
  Notion: '📄',
  Slack: '💬',
  GitHub: '🐙',
  Airtable: '📊',
  SendGrid: '📧',
  PostgreSQL: '🐘',
}

const STATUS_MAP = {
  connected: { label: 'Connected', color: '#22C55E', bg: '#0D2A19' },
  expired: { label: 'Expired', color: '#F59E0B', bg: '#2A1F0A' },
  error: { label: 'Error', color: '#EF4444', bg: '#2A0D0D' },
}

const AVAILABLE_INTEGRATIONS = [
  'Stripe', 'Notion', 'Slack', 'GitHub', 'Airtable', 'SendGrid',
  'PostgreSQL', 'MySQL', 'MongoDB', 'Salesforce', 'HubSpot', 'Twilio',
  'Mailchimp', 'Shopify', 'Linear', 'Jira', 'Asana', 'Zendesk',
]

export default function Credentials() {
  const [creds, setCreds] = useState(INTEGRATIONS)
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [selected, setSelected] = useState(null)
  const [newForm, setNewForm] = useState({ name: '', service: '', type: 'api_key', value: '' })

  const filtered = creds.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.service.toLowerCase().includes(search.toLowerCase())
  )

  const handleAdd = (e) => {
    e.preventDefault()
    if (!newForm.name || !newForm.service) return
    setCreds(cs => [...cs, {
      id: `c_${Date.now()}`, ...newForm, status: 'connected',
      lastUsed: 'Never', usedBy: 0, createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    }])
    setShowAdd(false)
    setNewForm({ name: '', service: '', type: 'api_key', value: '' })
  }

  const handleDelete = (id) => {
    setCreds(cs => cs.filter(c => c.id !== id))
    if (selected === id) setSelected(null)
  }

  const selectedCred = creds.find(c => c.id === selected)

  return (
    <div style={s.page}>
      <Sidebar active="credentials" />

      <div style={s.main}>
        {/* Header */}
        <div style={s.header}>
          <div>
            <h1 style={s.pageTitle}>Credentials</h1>
            <p style={s.pageSubtitle}>{creds.length} connected accounts · {creds.filter(c => c.status === 'connected').length} healthy</p>
          </div>
          <button style={s.addBtn} onClick={() => setShowAdd(true)}>+ Add credential</button>
        </div>

        {/* Status callouts */}
        {creds.some(c => c.status !== 'connected') && (
          <div style={s.alertBanner}>
            <span style={s.alertIcon}>⚠</span>
            <span style={s.alertText}>
              {creds.filter(c => c.status === 'error').length} credential(s) have errors and {creds.filter(c => c.status === 'expired').length} have expired.
              These will cause workflow failures.
            </span>
          </div>
        )}

        <div style={s.body}>
          {/* Left: credential list */}
          <div style={s.listPanel}>
            <div style={s.searchWrap}>
              <input
                style={s.searchInput}
                placeholder="Search credentials…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {filtered.length === 0 ? (
              <div style={s.emptyList}>No credentials found</div>
            ) : (
              filtered.map(c => (
                <CredRow
                  key={c.id}
                  cred={c}
                  isSelected={selected === c.id}
                  onClick={() => setSelected(c.id)}
                />
              ))
            )}
          </div>

          {/* Right: detail or add form */}
          <div style={s.detailPanel}>
            {showAdd ? (
              <AddCredForm
                form={newForm}
                setForm={setNewForm}
                onSubmit={handleAdd}
                onCancel={() => setShowAdd(false)}
                services={AVAILABLE_INTEGRATIONS}
              />
            ) : selectedCred ? (
              <CredDetail cred={selectedCred} onDelete={handleDelete} />
            ) : (
              <div style={s.detailEmpty}>
                <div style={s.emptyIcon}>⊙</div>
                <div style={s.emptyText}>Select a credential to view details</div>
                <button style={s.emptyAddBtn} onClick={() => setShowAdd(true)}>+ Add credential</button>
              </div>
            )}
          </div>
        </div>

        {/* Available integrations */}
        <div style={s.availSection}>
          <div style={s.availTitle}>Available integrations</div>
          <div style={s.availGrid}>
            {AVAILABLE_INTEGRATIONS.map(svc => (
              <button
                key={svc}
                style={s.availItem}
                onClick={() => { setNewForm(f => ({ ...f, service: svc })); setShowAdd(true) }}
              >
                <span style={s.availIcon}>{SERVICE_ICONS[svc] || '🔌'}</span>
                {svc}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function CredRow({ cred, isSelected, onClick }) {
  const st = STATUS_MAP[cred.status]
  return (
    <div
      style={{ ...s.credRow, ...(isSelected ? s.credRowSelected : {}) }}
      onClick={onClick}
    >
      <div style={s.credIcon}>{SERVICE_ICONS[cred.service] || '🔌'}</div>
      <div style={s.credInfo}>
        <div style={s.credName}>{cred.name}</div>
        <div style={s.credMeta}>{cred.service} · {cred.type.replace('_', ' ')}</div>
      </div>
      <div style={{ ...s.credStatus, color: st.color, background: st.bg }}>
        {st.label}
      </div>
    </div>
  )
}

function CredDetail({ cred, onDelete }) {
  const st = STATUS_MAP[cred.status]
  return (
    <div style={s.detail}>
      <div style={s.detailHeader}>
        <div style={s.detailIconName}>
          <span style={s.detailIcon}>{SERVICE_ICONS[cred.service] || '🔌'}</span>
          <div>
            <div style={s.detailName}>{cred.name}</div>
            <div style={s.detailService}>{cred.service}</div>
          </div>
        </div>
        <span style={{ ...s.statusBadge, color: st.color, background: st.bg }}>{st.label}</span>
      </div>

      <div style={s.detailBody}>
        {[
          ['Type', cred.type.replace('_', ' ')],
          ['Last used', cred.lastUsed],
          ['Used by', `${cred.usedBy} workflow${cred.usedBy !== 1 ? 's' : ''}`],
          ['Created', cred.createdAt],
        ].map(([k, v]) => (
          <div key={k} style={s.detailRow}>
            <span style={s.detailKey}>{k}</span>
            <span style={s.detailVal}>{v}</span>
          </div>
        ))}

        {cred.type === 'api_key' && (
          <div style={s.detailRow}>
            <span style={s.detailKey}>API key</span>
            <span style={s.maskedKey}>sk_live_••••••••••••••••••••••••••••3f9a</span>
          </div>
        )}

        {cred.status === 'error' && (
          <div style={s.errorBox}>
            <div style={s.errorTitle}>Connection error</div>
            <div style={s.errorMsg}>Authentication failed. The API key may have been revoked or rotated.</div>
          </div>
        )}

        {cred.status === 'expired' && (
          <div style={s.warnBox}>
            <div style={s.warnTitle}>Token expired</div>
            <div style={s.warnMsg}>OAuth token has expired. Re-authorize to restore access.</div>
          </div>
        )}
      </div>

      <div style={s.detailActions}>
        {cred.type === 'oauth' ? (
          <button style={s.reAuthBtn}>Re-authorize</button>
        ) : (
          <button style={s.editKeyBtn}>Update key</button>
        )}
        <button style={s.deleteBtn} onClick={() => onDelete(cred.id)}>Delete</button>
      </div>
    </div>
  )
}

function AddCredForm({ form, setForm, onSubmit, onCancel, services }) {
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))
  return (
    <div style={s.addForm}>
      <div style={s.addFormHeader}>
        <div style={s.addFormTitle}>Add credential</div>
        <button style={s.closeBtn} onClick={onCancel}>✕</button>
      </div>

      <form onSubmit={onSubmit} style={s.form}>
        <div style={s.field}>
          <label style={s.label}>Credential name</label>
          <input style={s.input} placeholder="e.g. Stripe Production" value={form.name} onChange={set('name')} required />
        </div>
        <div style={s.field}>
          <label style={s.label}>Service</label>
          <select style={s.select} value={form.service} onChange={set('service')} required>
            <option value="">Select service…</option>
            {services.map(sv => <option key={sv} value={sv}>{sv}</option>)}
          </select>
        </div>
        <div style={s.field}>
          <label style={s.label}>Auth type</label>
          <select style={s.select} value={form.type} onChange={set('type')}>
            <option value="api_key">API Key</option>
            <option value="oauth">OAuth</option>
            <option value="connection_string">Connection String</option>
            <option value="basic_auth">Basic Auth</option>
          </select>
        </div>
        {form.type === 'api_key' && (
          <div style={s.field}>
            <label style={s.label}>API key</label>
            <input style={s.input} type="password" placeholder="sk_live_…" value={form.value} onChange={set('value')} />
          </div>
        )}
        {form.type === 'connection_string' && (
          <div style={s.field}>
            <label style={s.label}>Connection string</label>
            <input style={s.input} type="password" placeholder="postgres://user:pass@host/db" value={form.value} onChange={set('value')} />
          </div>
        )}
        {form.type === 'oauth' && (
          <div style={s.oauthNote}>
            OAuth credentials are connected via browser redirect. Click "Connect" to start the authorization flow.
          </div>
        )}
        <div style={s.formActions}>
          <button type="button" style={s.cancelBtn} onClick={onCancel}>Cancel</button>
          <button type="submit" style={s.submitBtn}>
            {form.type === 'oauth' ? 'Connect via OAuth' : 'Save credential'}
          </button>
        </div>
      </form>
    </div>
  )
}

const s = {
  page: {
    display: 'flex', minHeight: '100vh',
    background: '#0A0A0A', color: '#FFFFFF',
    fontFamily: "'GeistMono', 'JetBrains Mono', monospace",
  },
  main: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '24px 32px 16px',
  },
  pageTitle: { fontSize: 20, fontWeight: 600, letterSpacing: '-0.5px', margin: '0 0 4px' },
  pageSubtitle: { fontSize: 13, color: '#52525B', margin: 0 },
  addBtn: {
    background: '#FFFFFF', color: '#0A0A0A', border: 'none',
    borderRadius: 6, padding: '8px 16px', fontSize: 13, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit',
  },
  alertBanner: {
    margin: '0 32px 16px',
    background: '#1A150A', border: '1px solid #3F2A0A',
    borderRadius: 6, padding: '10px 14px',
    display: 'flex', alignItems: 'center', gap: 10,
    fontSize: 13, color: '#F59E0B',
  },
  alertIcon: { fontSize: 14 },
  alertText: { color: '#D97706' },
  body: {
    display: 'flex', margin: '0 32px', border: '1px solid #1F1F1F',
    borderRadius: 8, overflow: 'hidden', minHeight: 400, marginBottom: 24,
  },
  listPanel: { width: 300, flexShrink: 0, borderRight: '1px solid #1F1F1F', overflowY: 'auto' },
  searchWrap: { padding: '10px', borderBottom: '1px solid #1F1F1F' },
  searchInput: {
    width: '100%', background: '#111111', border: '1px solid #1F1F1F',
    borderRadius: 5, padding: '7px 10px',
    fontSize: 12, color: '#FFFFFF', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
  },
  credRow: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
    borderBottom: '1px solid #1F1F1F', cursor: 'pointer',
  },
  credRowSelected: { background: '#111111' },
  credIcon: { fontSize: 18, flexShrink: 0 },
  credInfo: { flex: 1, minWidth: 0 },
  credName: { fontSize: 13, fontWeight: 500, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  credMeta: { fontSize: 11, color: '#52525B' },
  credStatus: { fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4, flexShrink: 0 },
  emptyList: { padding: 40, textAlign: 'center', fontSize: 13, color: '#52525B' },
  detailPanel: { flex: 1, overflowY: 'auto' },
  detail: { padding: '20px 24px' },
  detailHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #1F1F1F',
  },
  detailIconName: { display: 'flex', alignItems: 'center', gap: 12 },
  detailIcon: { fontSize: 24 },
  detailName: { fontSize: 15, fontWeight: 500, marginBottom: 2 },
  detailService: { fontSize: 12, color: '#52525B' },
  statusBadge: {
    display: 'inline-block', padding: '3px 9px',
    borderRadius: 4, fontSize: 11, fontWeight: 600,
  },
  detailBody: { marginBottom: 20 },
  detailRow: { display: 'flex', gap: 16, padding: '8px 0', borderBottom: '1px solid #1A1A1A' },
  detailKey: { fontSize: 12, color: '#52525B', minWidth: 100 },
  detailVal: { fontSize: 12, color: '#A1A1AA' },
  maskedKey: { fontSize: 12, color: '#52525B', fontFamily: 'monospace' },
  errorBox: {
    marginTop: 16, background: '#1A0D0D', border: '1px solid #2A1515',
    borderRadius: 6, padding: '12px 14px',
  },
  errorTitle: { fontSize: 12, color: '#EF4444', fontWeight: 600, marginBottom: 4 },
  errorMsg: { fontSize: 12, color: '#F87171' },
  warnBox: {
    marginTop: 16, background: '#1A150A', border: '1px solid #3F2A0A',
    borderRadius: 6, padding: '12px 14px',
  },
  warnTitle: { fontSize: 12, color: '#F59E0B', fontWeight: 600, marginBottom: 4 },
  warnMsg: { fontSize: 12, color: '#D97706' },
  detailActions: { display: 'flex', gap: 8 },
  reAuthBtn: {
    background: '#FFFFFF', color: '#0A0A0A', border: 'none',
    borderRadius: 5, padding: '7px 14px', fontSize: 12, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit',
  },
  editKeyBtn: {
    background: '#111111', border: '1px solid #1F1F1F',
    borderRadius: 5, padding: '7px 14px', fontSize: 12, color: '#FFFFFF',
    cursor: 'pointer', fontFamily: 'inherit',
  },
  deleteBtn: {
    background: 'transparent', border: '1px solid #2A1515',
    borderRadius: 5, padding: '7px 14px', fontSize: 12, color: '#EF4444',
    cursor: 'pointer', fontFamily: 'inherit',
  },
  addForm: { padding: '20px 24px' },
  addFormHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid #1F1F1F',
  },
  addFormTitle: { fontSize: 15, fontWeight: 500 },
  closeBtn: { background: 'transparent', border: 'none', color: '#52525B', cursor: 'pointer', fontSize: 14 },
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 12, color: '#A1A1AA' },
  input: {
    background: '#111111', border: '1px solid #1F1F1F', borderRadius: 5,
    padding: '9px 10px', fontSize: 13, color: '#FFFFFF',
    fontFamily: 'inherit', outline: 'none',
  },
  select: {
    background: '#111111', border: '1px solid #1F1F1F', borderRadius: 5,
    padding: '9px 10px', fontSize: 13, color: '#FFFFFF',
    fontFamily: 'inherit', outline: 'none',
  },
  oauthNote: {
    background: '#0F1A2E', border: '1px solid #1A2A3A',
    borderRadius: 5, padding: '10px 12px',
    fontSize: 12, color: '#38BDF8',
  },
  formActions: { display: 'flex', gap: 8, marginTop: 4 },
  cancelBtn: {
    background: 'transparent', border: '1px solid #1F1F1F',
    borderRadius: 5, padding: '8px 16px', fontSize: 12, color: '#A1A1AA',
    cursor: 'pointer', fontFamily: 'inherit',
  },
  submitBtn: {
    background: '#FFFFFF', color: '#0A0A0A', border: 'none',
    borderRadius: 5, padding: '8px 16px', fontSize: 12, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit',
  },
  detailEmpty: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', height: '100%', gap: 12, padding: 40,
  },
  emptyIcon: { fontSize: 28, color: '#3F3F46' },
  emptyText: { fontSize: 13, color: '#52525B' },
  emptyAddBtn: {
    marginTop: 4, background: 'transparent', border: '1px solid #1F1F1F',
    borderRadius: 5, padding: '7px 14px', fontSize: 12, color: '#A1A1AA',
    cursor: 'pointer', fontFamily: 'inherit',
  },
  availSection: { padding: '0 32px 32px' },
  availTitle: { fontSize: 12, color: '#52525B', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 },
  availGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8,
  },
  availItem: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: '#111111', border: '1px solid #1F1F1F',
    borderRadius: 6, padding: '9px 12px',
    fontSize: 12, color: '#A1A1AA', cursor: 'pointer', fontFamily: 'inherit',
    textAlign: 'left',
  },
  availIcon: { fontSize: 14 },
}