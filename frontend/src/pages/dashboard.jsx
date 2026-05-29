import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const MOCK_WORKFLOWS = [
  {
    id: 'wf_1', name: 'Stripe → Notion CRM', status: 'active',
    lastRun: '2 min ago', runs: 12430, successRate: 99.2,
    trigger: 'webhook', nodes: 5, updatedAt: 'Today, 9:14 AM',
  },
  {
    id: 'wf_2', name: 'GitHub PR → Slack Alert', status: 'active',
    lastRun: '14 min ago', runs: 8741, successRate: 100,
    trigger: 'webhook', nodes: 3, updatedAt: 'Yesterday',
  },
  {
    id: 'wf_3', name: 'Daily Airtable Digest', status: 'active',
    lastRun: '6 hrs ago', runs: 365, successRate: 98.1,
    trigger: 'schedule', nodes: 4, updatedAt: 'May 27',
  },
  {
    id: 'wf_4', name: 'Lead Enrichment Pipeline', status: 'paused',
    lastRun: '3 days ago', runs: 2109, successRate: 94.3,
    trigger: 'webhook', nodes: 8, updatedAt: 'May 24',
  },
  {
    id: 'wf_5', name: 'Invoice PDF Generator', status: 'error',
    lastRun: '1 hr ago', runs: 5892, successRate: 87.0,
    trigger: 'schedule', nodes: 6, updatedAt: 'May 29',
  },
  {
    id: 'wf_6', name: 'Customer Onboarding Flow', status: 'draft',
    lastRun: 'Never', runs: 0, successRate: null,
    trigger: 'manual', nodes: 12, updatedAt: 'May 28',
  },
]

const STATUS_MAP = {
  active: { label: 'Active', color: '#22C55E', bg: '#0D2A19' },
  paused: { label: 'Paused', color: '#F59E0B', bg: '#2A1F0A' },
  error: { label: 'Error', color: '#EF4444', bg: '#2A0D0D' },
  draft: { label: 'Draft', color: '#52525B', bg: '#1A1A1A' },
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [sortBy, setSortBy] = useState('updatedAt')

  const filtered = MOCK_WORKFLOWS.filter(w => {
    if (search && !w.name.toLowerCase().includes(search.toLowerCase())) return false
    if (filter !== 'all' && w.status !== filter) return false
    return true
  })

  return (
    <div style={s.page}>
      <Sidebar active="dashboard" />

      <div style={s.main}>
        {/* Header */}
        <div style={s.header}>
          <div>
            <h1 style={s.pageTitle}>Workflows</h1>
            <p style={s.pageSubtitle}>{MOCK_WORKFLOWS.length} workflows · {MOCK_WORKFLOWS.filter(w => w.status === 'active').length} active</p>
          </div>
          <button style={s.createBtn} onClick={() => navigate('/canvas')}>
            + New workflow
          </button>
        </div>

        {/* Stats row */}
        <div style={s.statsRow}>
          {[
            { label: 'Total runs today', value: '4,231' },
            { label: 'Success rate', value: '98.4%' },
            { label: 'Active workflows', value: '3' },
            { label: 'Avg latency', value: '142ms' },
          ].map(st => (
            <div key={st.label} style={s.statCard}>
              <div style={s.statLabel}>{st.label}</div>
              <div style={s.statValue}>{st.value}</div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div style={s.toolbar}>
          <div style={s.searchWrap}>
            <span style={s.searchIcon}>⌕</span>
            <input
              style={s.searchInput}
              placeholder="Search workflows…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={s.filters}>
            {['all', 'active', 'paused', 'error', 'draft'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{ ...s.filterBtn, ...(filter === f ? s.filterBtnActive : {}) }}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <select
            style={s.sortSelect}
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
          >
            <option value="updatedAt">Last updated</option>
            <option value="runs">Total runs</option>
            <option value="name">Name</option>
          </select>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <EmptyState search={search} />
        ) : (
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  {['Name', 'Status', 'Trigger', 'Last run', 'Runs', 'Success rate', 'Updated', ''].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((wf, i) => (
                  <WorkflowRow key={wf.id} wf={wf} navigate={navigate} isLast={i === filtered.length - 1} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function WorkflowRow({ wf, navigate, isLast }) {
  const [hover, setHover] = useState(false)
  const st = STATUS_MAP[wf.status]

  return (
    <tr
      style={{ ...s.tr, ...(hover ? s.trHover : {}), ...(isLast ? { borderBottom: 'none' } : {}) }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => navigate(`/canvas?id=${wf.id}`)}
    >
      <td style={s.td}>
        <div style={s.wfName}>{wf.name}</div>
        <div style={s.wfNodes}>{wf.nodes} nodes</div>
      </td>
      <td style={s.td}>
        <span style={{ ...s.statusBadge, color: st.color, background: st.bg }}>
          {st.label}
        </span>
      </td>
      <td style={s.td}>
        <span style={s.triggerBadge}>{wf.trigger}</span>
      </td>
      <td style={{ ...s.td, color: '#A1A1AA' }}>{wf.lastRun}</td>
      <td style={{ ...s.td, color: '#A1A1AA' }}>{wf.runs.toLocaleString()}</td>
      <td style={s.td}>
        {wf.successRate !== null ? (
          <div style={s.rateWrap}>
            <div style={s.rateBar}>
              <div style={{
                ...s.rateFill,
                width: `${wf.successRate}%`,
                background: wf.successRate > 95 ? '#22C55E' : wf.successRate > 85 ? '#F59E0B' : '#EF4444',
              }} />
            </div>
            <span style={s.rateText}>{wf.successRate}%</span>
          </div>
        ) : <span style={{ color: '#3F3F46' }}>—</span>}
      </td>
      <td style={{ ...s.td, color: '#52525B' }}>{wf.updatedAt}</td>
      <td style={s.td}>
        <div style={s.rowActions}>
          <button style={s.rowBtn} onClick={e => { e.stopPropagation(); navigate(`/executions?wf=${wf.id}`) }}>Logs</button>
          <button style={s.rowBtn} onClick={e => e.stopPropagation()}>⋯</button>
        </div>
      </td>
    </tr>
  )
}

function EmptyState({ search }) {
  return (
    <div style={s.empty}>
      <div style={s.emptyIcon}>⬡</div>
      <div style={s.emptyTitle}>{search ? 'No workflows match your search' : 'No workflows yet'}</div>
      <div style={s.emptyDesc}>
        {search ? 'Try a different search term or clear the filter.' : 'Create your first workflow to start automating.'}
      </div>
    </div>
  )
}

export function Sidebar({ active }) {
  const navItems = [
    { id: 'dashboard', label: 'Workflows', icon: '⬡', path: '/dashboard' },
    { id: 'executions', label: 'Executions', icon: '◈', path: '/executions' },
    { id: 'credentials', label: 'Credentials', icon: '⊙', path: '/credentials' },
    { id: 'settings', label: 'Settings', icon: '⚙', path: '/settings' },
  ]

  return (
    <aside style={s.sidebar}>
      <Link to="/dashboard" style={s.sidebarLogo}>Flowmatic</Link>

      <nav style={s.nav}>
        {navItems.map(item => (
          <Link
            key={item.id}
            to={item.path}
            style={{ ...s.navItem, ...(active === item.id ? s.navItemActive : {}) }}
          >
            <span style={s.navIcon}>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div style={s.sidebarBottom}>
        <Link to="/pricing" style={s.upgradeBtn}>Upgrade to Pro</Link>
        <div style={s.userRow}>
          <div style={s.avatar}>JS</div>
          <div>
            <div style={s.userName}>Jane Smith</div>
            <div style={s.userEmail}>jane@acme.com</div>
          </div>
        </div>
      </div>
    </aside>
  )
}

const s = {
  page: {
    display: 'flex', minHeight: '100vh',
    background: '#0A0A0A', color: '#FFFFFF',
    fontFamily: "'GeistMono', 'JetBrains Mono', monospace",
  },
  sidebar: {
    width: 220, flexShrink: 0,
    background: '#0A0A0A',
    borderRight: '1px solid #1F1F1F',
    display: 'flex', flexDirection: 'column',
    padding: '20px 0',
    position: 'sticky', top: 0, height: '100vh',
  },
  sidebarLogo: {
    display: 'block', fontWeight: 600, fontSize: 15,
    color: '#FFFFFF', textDecoration: 'none',
    padding: '0 20px', marginBottom: 28, letterSpacing: '-0.5px',
  },
  nav: { flex: 1, display: 'flex', flexDirection: 'column', gap: 2, padding: '0 8px' },
  navItem: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '8px 12px', borderRadius: 6,
    fontSize: 13, color: '#A1A1AA', textDecoration: 'none',
  },
  navItemActive: { background: '#1A1A1A', color: '#FFFFFF' },
  navIcon: { fontSize: 14, width: 16, textAlign: 'center' },
  sidebarBottom: { padding: '16px 12px', borderTop: '1px solid #1F1F1F', marginTop: 8, display: 'flex', flexDirection: 'column', gap: 12 },
  upgradeBtn: {
    display: 'block', textAlign: 'center',
    background: '#111111', border: '1px solid #1F1F1F',
    borderRadius: 6, padding: '8px',
    fontSize: 12, color: '#A1A1AA', textDecoration: 'none',
  },
  userRow: { display: 'flex', alignItems: 'center', gap: 10 },
  avatar: {
    width: 28, height: 28, borderRadius: '50%',
    background: '#1F1F1F', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    fontSize: 11, fontWeight: 600, color: '#A1A1AA', flexShrink: 0,
  },
  userName: { fontSize: 12, fontWeight: 500 },
  userEmail: { fontSize: 11, color: '#52525B' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '24px 32px 0',
  },
  pageTitle: { fontSize: 20, fontWeight: 600, letterSpacing: '-0.5px', margin: '0 0 4px' },
  pageSubtitle: { fontSize: 13, color: '#52525B', margin: 0 },
  createBtn: {
    background: '#FFFFFF', color: '#0A0A0A',
    border: 'none', borderRadius: 6,
    padding: '8px 16px', fontSize: 13, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit',
  },
  statsRow: {
    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 12, padding: '20px 32px',
  },
  statCard: {
    background: '#111111', border: '1px solid #1F1F1F',
    borderRadius: 8, padding: '14px 16px',
  },
  statLabel: { fontSize: 11, color: '#52525B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { fontSize: 22, fontWeight: 600, letterSpacing: '-1px' },
  toolbar: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '0 32px 16px',
  },
  searchWrap: {
    position: 'relative', flex: 1,
  },
  searchIcon: {
    position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
    color: '#52525B', fontSize: 16, pointerEvents: 'none',
  },
  searchInput: {
    width: '100%', background: '#111111',
    border: '1px solid #1F1F1F', borderRadius: 6,
    padding: '8px 12px 8px 32px',
    fontSize: 13, color: '#FFFFFF', outline: 'none',
    fontFamily: 'inherit', boxSizing: 'border-box',
  },
  filters: { display: 'flex', gap: 4 },
  filterBtn: {
    background: 'transparent', border: '1px solid #1F1F1F',
    borderRadius: 6, padding: '7px 12px',
    fontSize: 12, color: '#A1A1AA', cursor: 'pointer', fontFamily: 'inherit',
  },
  filterBtnActive: { background: '#1A1A1A', color: '#FFFFFF', borderColor: '#3F3F46' },
  sortSelect: {
    background: '#111111', border: '1px solid #1F1F1F',
    borderRadius: 6, padding: '7px 12px',
    fontSize: 12, color: '#A1A1AA', cursor: 'pointer', fontFamily: 'inherit',
    outline: 'none',
  },
  tableWrap: {
    margin: '0 32px 32px',
    border: '1px solid #1F1F1F', borderRadius: 8, overflow: 'hidden',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    padding: '10px 16px', textAlign: 'left',
    fontSize: 11, color: '#52525B', fontWeight: 500,
    borderBottom: '1px solid #1F1F1F', background: '#111111',
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  tr: {
    borderBottom: '1px solid #1F1F1F', cursor: 'pointer',
    transition: 'background 0.1s',
  },
  trHover: { background: '#111111' },
  td: { padding: '14px 16px', fontSize: 13 },
  wfName: { fontWeight: 500, marginBottom: 2 },
  wfNodes: { fontSize: 11, color: '#52525B' },
  statusBadge: {
    display: 'inline-block', padding: '2px 8px',
    borderRadius: 4, fontSize: 11, fontWeight: 600,
  },
  triggerBadge: {
    fontSize: 11, color: '#52525B',
    background: '#111111', border: '1px solid #1F1F1F',
    borderRadius: 4, padding: '2px 8px',
  },
  rateWrap: { display: 'flex', alignItems: 'center', gap: 8 },
  rateBar: { flex: 1, height: 3, background: '#1F1F1F', borderRadius: 4, overflow: 'hidden', maxWidth: 60 },
  rateFill: { height: '100%', borderRadius: 4 },
  rateText: { fontSize: 12, color: '#A1A1AA', minWidth: 36 },
  rowActions: { display: 'flex', gap: 4, opacity: 0, transition: 'opacity 0.15s' },
  rowBtn: {
    background: '#111111', border: '1px solid #1F1F1F',
    borderRadius: 4, padding: '4px 8px',
    fontSize: 11, color: '#A1A1AA', cursor: 'pointer', fontFamily: 'inherit',
  },
  empty: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', padding: '80px 24px', textAlign: 'center',
  },
  emptyIcon: { fontSize: 32, marginBottom: 16, color: '#3F3F46' },
  emptyTitle: { fontSize: 16, fontWeight: 500, marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: '#52525B', maxWidth: 320 },
}