import { useState } from 'react'
import { Sidebar } from './Dashboard'

const STATUSES = {
  success: { label: 'Success', color: '#22C55E', bg: '#0D2A19' },
  failed: { label: 'Failed', color: '#EF4444', bg: '#2A0D0D' },
  running: { label: 'Running', color: '#38BDF8', bg: '#0A1F2E' },
  skipped: { label: 'Skipped', color: '#A1A1AA', bg: '#1A1A1A' },
}

const MOCK_RUNS = Array.from({ length: 24 }, (_, i) => ({
  id: `run_${1000 + i}`,
  workflow: i % 3 === 0 ? 'Stripe → Notion CRM' : i % 3 === 1 ? 'GitHub PR → Slack' : 'Daily Airtable Digest',
  workflowId: `wf_${(i % 3) + 1}`,
  status: i === 4 ? 'running' : i % 7 === 0 ? 'failed' : i % 11 === 0 ? 'skipped' : 'success',
  trigger: i % 3 === 2 ? 'schedule' : 'webhook',
  duration: i === 4 ? null : `${(Math.random() * 3 + 0.1).toFixed(2)}s`,
  startedAt: new Date(Date.now() - i * 7 * 60 * 1000).toLocaleTimeString(),
  date: i < 5 ? 'Today' : i < 10 ? 'Yesterday' : `May ${28 - Math.floor(i / 5)}`,
  steps: Math.floor(Math.random() * 6) + 3,
  error: i % 7 === 0 ? 'IntegrationError: Notion API rate limit exceeded (429)' : null,
}))

const MOCK_STEPS = [
  { name: 'Stripe Webhook', status: 'success', duration: '12ms', output: '{"amount":250,"customer":"cus_abc123"}' },
  { name: 'Extract Customer', status: 'success', duration: '3ms', output: '{"id":"cus_abc123","email":"user@example.com"}' },
  { name: 'Amount > $100?', status: 'success', duration: '1ms', output: 'true' },
  { name: 'Notion: Create Page', status: 'failed', duration: '820ms', output: 'Error: Rate limit exceeded' },
]

export default function Executions() {
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('all')
  const [wfFilter, setWfFilter] = useState('all')
  const [search, setSearch] = useState('')

  const filtered = MOCK_RUNS.filter(r => {
    if (filter !== 'all' && r.status !== filter) return false
    if (wfFilter !== 'all' && r.workflowId !== wfFilter) return false
    if (search && !r.id.includes(search) && !r.workflow.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const selectedRun = MOCK_RUNS.find(r => r.id === selected)

  return (
    <div style={s.page}>
      <Sidebar active="executions" />

      <div style={s.main}>
        {/* Header */}
        <div style={s.header}>
          <div>
            <h1 style={s.pageTitle}>Executions</h1>
            <p style={s.pageSubtitle}>All workflow runs across your workspace</p>
          </div>
        </div>

        {/* Stats */}
        <div style={s.statsRow}>
          {[
            { label: 'Total runs (24h)', value: MOCK_RUNS.length },
            { label: 'Success', value: MOCK_RUNS.filter(r => r.status === 'success').length },
            { label: 'Failed', value: MOCK_RUNS.filter(r => r.status === 'failed').length },
            { label: 'Avg duration', value: '1.24s' },
          ].map(st => (
            <div key={st.label} style={s.statCard}>
              <div style={s.statLabel}>{st.label}</div>
              <div style={s.statValue}>{st.value}</div>
            </div>
          ))}
        </div>

        <div style={s.body}>
          {/* Run list */}
          <div style={s.listPanel}>
            {/* Toolbar */}
            <div style={s.toolbar}>
              <input
                style={s.searchInput}
                placeholder="Search runs…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <div style={s.filterRow}>
                {['all', 'success', 'failed', 'running', 'skipped'].map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    style={{ ...s.filterBtn, ...(filter === f ? s.filterBtnActive : {}) }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            <div style={s.runList}>
              {filtered.length === 0 ? (
                <div style={s.empty}>No executions found</div>
              ) : (
                filtered.map(run => (
                  <RunItem
                    key={run.id}
                    run={run}
                    isSelected={selected === run.id}
                    onClick={() => setSelected(run.id)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Detail panel */}
          <div style={s.detailPanel}>
            {selectedRun ? (
              <RunDetail run={selectedRun} />
            ) : (
              <div style={s.detailEmpty}>
                <div style={s.emptyIcon}>◈</div>
                <div style={s.emptyText}>Select a run to inspect</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function RunItem({ run, isSelected, onClick }) {
  const st = STATUSES[run.status]
  return (
    <div
      style={{ ...s.runItem, ...(isSelected ? s.runItemSelected : {}) }}
      onClick={onClick}
    >
      <div style={s.runItemTop}>
        <span style={{ ...s.statusDot, background: st.color }} />
        <span style={s.runId}>{run.id}</span>
        <span style={s.runTime}>{run.startedAt}</span>
      </div>
      <div style={s.runItemBottom}>
        <span style={s.runWorkflow}>{run.workflow}</span>
        {run.duration && <span style={s.runDuration}>{run.duration}</span>}
        {run.status === 'running' && <span style={{ ...s.runDuration, color: '#38BDF8' }}>running…</span>}
      </div>
      {run.error && (
        <div style={s.runError}>{run.error}</div>
      )}
    </div>
  )
}

function RunDetail({ run }) {
  const [activeTab, setActiveTab] = useState('steps')
  const st = STATUSES[run.status]

  return (
    <div style={s.detail}>
      <div style={s.detailHeader}>
        <div style={s.detailMeta}>
          <span style={{ ...s.statusBadge, color: st.color, background: st.bg }}>{st.label}</span>
          <span style={s.detailId}>{run.id}</span>
        </div>
        <div style={s.detailWorkflow}>{run.workflow}</div>
        <div style={s.detailRow}>
          <span style={s.detailKey}>Started</span>
          <span style={s.detailVal}>{run.date} · {run.startedAt}</span>
        </div>
        <div style={s.detailRow}>
          <span style={s.detailKey}>Duration</span>
          <span style={s.detailVal}>{run.duration ?? 'In progress'}</span>
        </div>
        <div style={s.detailRow}>
          <span style={s.detailKey}>Trigger</span>
          <span style={s.detailVal}>{run.trigger}</span>
        </div>
        <div style={s.detailRow}>
          <span style={s.detailKey}>Steps</span>
          <span style={s.detailVal}>{run.steps}</span>
        </div>
      </div>

      <div style={s.tabs}>
        {['steps', 'input', 'output'].map(t => (
          <button
            key={t}
            style={{ ...s.tab, ...(activeTab === t ? s.tabActive : {}) }}
            onClick={() => setActiveTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {activeTab === 'steps' && (
        <div style={s.steps}>
          {MOCK_STEPS.slice(0, run.steps > 4 ? 4 : run.steps).map((step, i) => (
            <StepRow key={i} step={step} index={i} />
          ))}
        </div>
      )}

      {activeTab === 'input' && (
        <pre style={s.codeBlock}>{`{
  "event": "payment.succeeded",
  "data": {
    "amount": 25000,
    "currency": "usd",
    "customer": "cus_abc123",
    "created": 1748476800
  }
}`}</pre>
      )}

      {activeTab === 'output' && (
        <pre style={s.codeBlock}>{run.error
          ? `Error: ${run.error}`
          : `{
  "status": "completed",
  "results": {
    "notionPageId": "page_xyz789",
    "slackTs": "1748476801.000200"
  }
}`}</pre>
      )}

      {run.status === 'failed' && (
        <div style={s.errorPanel}>
          <div style={s.errorTitle}>Error</div>
          <div style={s.errorMsg}>{run.error}</div>
          <button style={s.rerunBtn}>Re-run execution</button>
        </div>
      )}
    </div>
  )
}

function StepRow({ step, index }) {
  const [open, setOpen] = useState(false)
  const st = STATUSES[step.status]
  return (
    <div style={s.stepWrap}>
      <div style={s.stepHeader} onClick={() => setOpen(o => !o)}>
        <span style={{ ...s.stepDot, background: st.color }} />
        <span style={s.stepIndex}>{index + 1}</span>
        <span style={s.stepName}>{step.name}</span>
        <span style={s.stepDuration}>{step.duration}</span>
        <span style={s.stepChevron}>{open ? '▾' : '▸'}</span>
      </div>
      {open && (
        <pre style={s.stepOutput}>{step.output}</pre>
      )}
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
    padding: '24px 32px 0',
  },
  pageTitle: { fontSize: 20, fontWeight: 600, letterSpacing: '-0.5px', margin: '0 0 4px' },
  pageSubtitle: { fontSize: 13, color: '#52525B', margin: 0 },
  statsRow: {
    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 12, padding: '20px 32px 0',
  },
  statCard: {
    background: '#111111', border: '1px solid #1F1F1F',
    borderRadius: 8, padding: '14px 16px',
  },
  statLabel: { fontSize: 11, color: '#52525B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { fontSize: 22, fontWeight: 600, letterSpacing: '-1px' },
  body: {
    flex: 1, display: 'flex', gap: 0,
    margin: '20px 32px 32px', border: '1px solid #1F1F1F',
    borderRadius: 8, overflow: 'hidden', minHeight: 0,
  },
  listPanel: {
    width: 360, flexShrink: 0, borderRight: '1px solid #1F1F1F',
    display: 'flex', flexDirection: 'column',
  },
  toolbar: { padding: '12px', borderBottom: '1px solid #1F1F1F', display: 'flex', flexDirection: 'column', gap: 8 },
  searchInput: {
    width: '100%', background: '#111111', border: '1px solid #1F1F1F',
    borderRadius: 5, padding: '7px 10px',
    fontSize: 12, color: '#FFFFFF', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
  },
  filterRow: { display: 'flex', gap: 4, flexWrap: 'wrap' },
  filterBtn: {
    background: 'transparent', border: '1px solid #1F1F1F',
    borderRadius: 4, padding: '3px 8px',
    fontSize: 11, color: '#52525B', cursor: 'pointer', fontFamily: 'inherit',
  },
  filterBtnActive: { background: '#1A1A1A', color: '#FFFFFF', borderColor: '#3F3F46' },
  runList: { flex: 1, overflowY: 'auto' },
  runItem: {
    padding: '12px 14px', borderBottom: '1px solid #1F1F1F',
    cursor: 'pointer',
  },
  runItemSelected: { background: '#111111' },
  runItemTop: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 },
  statusDot: { width: 6, height: 6, borderRadius: '50%', flexShrink: 0 },
  runId: { fontSize: 12, fontFamily: 'monospace', flex: 1 },
  runTime: { fontSize: 11, color: '#52525B' },
  runItemBottom: { display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 14 },
  runWorkflow: { fontSize: 12, color: '#A1A1AA', flex: 1 },
  runDuration: { fontSize: 11, color: '#52525B' },
  runError: {
    marginTop: 6, paddingLeft: 14,
    fontSize: 11, color: '#EF4444',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  empty: { padding: 40, textAlign: 'center', fontSize: 13, color: '#52525B' },
  detailPanel: { flex: 1, overflowY: 'auto', background: '#0A0A0A' },
  detail: { padding: '20px 24px' },
  detailHeader: { marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #1F1F1F' },
  detailMeta: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 },
  statusBadge: {
    display: 'inline-block', padding: '2px 8px',
    borderRadius: 4, fontSize: 11, fontWeight: 600,
  },
  detailId: { fontSize: 12, color: '#52525B', fontFamily: 'monospace' },
  detailWorkflow: { fontSize: 15, fontWeight: 500, marginBottom: 12 },
  detailRow: { display: 'flex', gap: 16, marginBottom: 4 },
  detailKey: { fontSize: 12, color: '#52525B', minWidth: 80 },
  detailVal: { fontSize: 12, color: '#A1A1AA' },
  tabs: {
    display: 'flex', gap: 0, marginBottom: 16,
    borderBottom: '1px solid #1F1F1F',
  },
  tab: {
    background: 'transparent', border: 'none',
    borderBottom: '2px solid transparent',
    padding: '8px 16px', fontSize: 12, color: '#52525B',
    cursor: 'pointer', fontFamily: 'inherit',
    marginBottom: -1,
  },
  tabActive: { color: '#FFFFFF', borderBottomColor: '#FFFFFF' },
  steps: { display: 'flex', flexDirection: 'column', gap: 4 },
  stepWrap: { border: '1px solid #1F1F1F', borderRadius: 6, overflow: 'hidden' },
  stepHeader: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '10px 12px', cursor: 'pointer', background: '#111111',
  },
  stepDot: { width: 6, height: 6, borderRadius: '50%', flexShrink: 0 },
  stepIndex: { fontSize: 11, color: '#52525B', minWidth: 16 },
  stepName: { fontSize: 12, flex: 1 },
  stepDuration: { fontSize: 11, color: '#52525B' },
  stepChevron: { fontSize: 10, color: '#52525B' },
  stepOutput: {
    background: '#0D0D0D', padding: '12px',
    fontSize: 11, color: '#A1A1AA',
    margin: 0, borderTop: '1px solid #1F1F1F',
    overflowX: 'auto',
  },
  codeBlock: {
    background: '#0D0D0D', border: '1px solid #1F1F1F',
    borderRadius: 6, padding: '16px',
    fontSize: 12, color: '#A1A1AA',
    margin: 0, overflowX: 'auto',
  },
  errorPanel: {
    marginTop: 20, background: '#1A0D0D',
    border: '1px solid #2A1515', borderRadius: 6, padding: '16px',
  },
  errorTitle: { fontSize: 12, color: '#EF4444', fontWeight: 600, marginBottom: 6 },
  errorMsg: { fontSize: 12, color: '#F87171', marginBottom: 12, fontFamily: 'monospace' },
  rerunBtn: {
    background: 'transparent', border: '1px solid #2A1515',
    borderRadius: 5, padding: '6px 12px',
    fontSize: 12, color: '#EF4444', cursor: 'pointer', fontFamily: 'inherit',
  },
  detailEmpty: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', height: '100%', gap: 12, padding: 40,
  },
  emptyIcon: { fontSize: 28, color: '#3F3F46' },
  emptyText: { fontSize: 13, color: '#52525B' },
}