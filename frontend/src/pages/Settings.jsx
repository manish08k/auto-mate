import { useState } from 'react'
import { Sidebar } from './dashboard.jsx'

const NAV_ITEMS = [
  { id: 'profile', label: 'Profile', icon: '👤' },
  { id: 'account', label: 'Account', icon: '🔐' },
  { id: 'notifications', label: 'Notifications', icon: '🔔' },
  { id: 'api', label: 'API Keys', icon: '🔑' },
  { id: 'integrations', label: 'Integrations', icon: '🔌' },
  { id: 'team', label: 'Team & Members', icon: '👥' },
  { id: 'audit', label: 'Audit Log', icon: '📋' },
  { id: 'danger', label: 'Danger Zone', icon: '⚠️' },
]

const INTEGRATIONS = [
  { id: 'slack', name: 'Slack', desc: 'Send workflow alerts to Slack channels', connected: true, icon: 'S', color: '#4A154B' },
  { id: 'notion', name: 'Notion', desc: 'Read and write Notion databases', connected: true, icon: 'N', color: '#1A1A1A' },
  { id: 'stripe', name: 'Stripe', desc: 'Trigger workflows on payment events', connected: false, icon: '⚡', color: '#635BFF' },
  { id: 'github', name: 'GitHub', desc: 'Automate issues, PRs, and releases', connected: false, icon: 'G', color: '#24292E' },
  { id: 'airtable', name: 'Airtable', desc: 'Sync records with Airtable bases', connected: true, icon: 'A', color: '#FF6F61' },
  { id: 'hubspot', name: 'HubSpot', desc: 'CRM automation and contact sync', connected: false, icon: 'H', color: '#FF7A59' },
]

const MOCK_API_KEYS = [
  { id: 'key_1', name: 'Production Key', prefix: 'sk_prod_...4f2a', created: 'May 1, 2026', lastUsed: '2 hours ago', perms: 'Full Access' },
  { id: 'key_2', name: 'CI/CD Pipeline', prefix: 'sk_prod_...9c1e', created: 'Apr 12, 2026', lastUsed: '1 day ago', perms: 'Read Only' },
  { id: 'key_3', name: 'Staging Env', prefix: 'sk_test_...3b7f', created: 'Mar 28, 2026', lastUsed: '5 days ago', perms: 'Write Only' },
]

const MEMBERS = [
  { id: 1, name: 'Alex Monroe', email: 'alex@startup.io', role: 'Owner', avatar: 'AM', joined: 'Jan 10, 2026' },
  { id: 2, name: 'Priya Singh', email: 'priya@startup.io', role: 'Admin', avatar: 'PS', joined: 'Feb 3, 2026' },
  { id: 3, name: 'James Okafor', email: 'james@startup.io', role: 'Member', avatar: 'JO', joined: 'Mar 17, 2026' },
  { id: 4, name: 'Luna Chen', email: 'luna@startup.io', role: 'Member', avatar: 'LC', joined: 'Apr 22, 2026' },
]

const AUDIT_LOGS = [
  { id: 1, action: 'API Key Created', user: 'Alex Monroe', time: 'Today, 10:42 AM', detail: 'Production Key', type: 'create' },
  { id: 2, action: 'Workflow Deleted', user: 'Priya Singh', time: 'Today, 9:15 AM', detail: 'Daily Airtable Digest', type: 'delete' },
  { id: 3, action: 'Member Invited', user: 'Alex Monroe', time: 'Yesterday, 4:30 PM', detail: 'luna@startup.io', type: 'create' },
  { id: 4, action: 'Integration Connected', user: 'James Okafor', time: 'Yesterday, 2:12 PM', detail: 'Airtable', type: 'update' },
  { id: 5, action: 'Plan Upgraded', user: 'Alex Monroe', time: 'May 20, 2026', detail: 'Starter → Pro', type: 'update' },
  { id: 6, action: 'Member Role Changed', user: 'Alex Monroe', time: 'May 18, 2026', detail: 'Priya → Admin', type: 'update' },
]

function Toggle({ enabled, onChange }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      style={{
        width: 36,
        height: 20,
        borderRadius: 10,
        border: 'none',
        background: enabled ? '#ffffff' : '#2a2a2a',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background 0.15s',
        flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute',
        top: 3,
        left: enabled ? 19 : 3,
        width: 14,
        height: 14,
        borderRadius: '50%',
        background: enabled ? '#0A0A0A' : '#555',
        transition: 'left 0.15s',
      }} />
    </button>
  )
}

function Badge({ role }) {
  const colors = {
    Owner: { bg: '#1a1a2e', color: '#8b8bff', border: '#2a2a4a' },
    Admin: { bg: '#1a2a1a', color: '#6fcf97', border: '#2a4a2a' },
    Member: { bg: '#1f1f1f', color: '#a1a1aa', border: '#2a2a2a' },
  }
  const c = colors[role] || colors.Member
  return (
    <span style={{
      fontSize: 11,
      fontWeight: 500,
      padding: '2px 8px',
      borderRadius: 4,
      background: c.bg,
      color: c.color,
      border: `1px solid ${c.border}`,
      letterSpacing: '0.02em',
    }}>
      {role}
    </span>
  )
}

function ActionTypeDot({ type }) {
  const c = { create: '#6fcf97', delete: '#eb5757', update: '#f2c94c' }
  return <span style={{ width: 6, height: 6, borderRadius: '50%', background: c[type] || '#555', display: 'inline-block', marginRight: 8, flexShrink: 0 }} />
}

// ─── Section Components ────────────────────────────────────────────────

function ProfileSection() {
  const [form, setForm] = useState({ name: 'Alex Monroe', email: 'alex@startup.io', company: 'Startup Inc.', timezone: 'UTC-5 (Eastern)' })
  const update = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div>
      <SectionHeader title="Profile" desc="Your public-facing identity and contact details." />
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32 }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: '#1f1f1f', border: '1px solid #2a2a2a',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, fontWeight: 600, color: '#fff', letterSpacing: -1,
        }}>AM</div>
        <div>
          <button style={btnSecondary}>Change avatar</button>
          <p style={{ margin: '6px 0 0', fontSize: 12, color: '#555' }}>JPG, PNG up to 2MB</p>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <Field label="Full name" value={form.name} onChange={update('name')} />
        <Field label="Email address" value={form.email} onChange={update('email')} />
        <Field label="Company" value={form.company} onChange={update('company')} />
        <div>
          <label style={labelStyle}>Timezone</label>
          <select style={inputStyle} value={form.timezone} onChange={update('timezone')}>
            <option>UTC-8 (Pacific)</option>
            <option>UTC-7 (Mountain)</option>
            <option>UTC-6 (Central)</option>
            <option>UTC-5 (Eastern)</option>
            <option>UTC+0 (London)</option>
            <option>UTC+5:30 (India)</option>
          </select>
        </div>
      </div>
      <SaveRow />
    </div>
  )
}

function AccountSection() {
  const [twofa, setTwofa] = useState(true)
  const [sessions, setSessions] = useState(true)

  return (
    <div>
      <SectionHeader title="Account & Security" desc="Manage your password, 2FA, and active sessions." />
      <Card title="Password">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <Field label="Current password" type="password" value="••••••••••" />
          <div />
          <Field label="New password" type="password" value="" placeholder="Min. 8 characters" />
          <Field label="Confirm new password" type="password" value="" placeholder="Repeat password" />
        </div>
        <button style={btnPrimary}>Update password</button>
      </Card>
      <Card title="Two-Factor Authentication" style={{ marginTop: 16 }}>
        <ToggleRow label="Enable 2FA via authenticator app" sub="Adds a second layer of verification on login." enabled={twofa} onChange={setTwofa} />
        {twofa && (
          <div style={{ marginTop: 16, padding: '12px 14px', background: '#0f1f0f', border: '1px solid #1e3a1e', borderRadius: 6 }}>
            <p style={{ margin: 0, fontSize: 13, color: '#6fcf97' }}>✓ 2FA is active. Authenticator app configured on May 1, 2026.</p>
          </div>
        )}
      </Card>
      <Card title="Sessions" style={{ marginTop: 16 }}>
        <ToggleRow label="Email me on new sign-in" sub="Get notified when your account is accessed from a new device." enabled={sessions} onChange={setSessions} />
        <Divider />
        {[
          { device: 'Chrome on macOS', loc: 'New York, US', current: true, time: 'Now' },
          { device: 'Safari on iPhone', loc: 'New York, US', current: false, time: '3 hours ago' },
          { device: 'Firefox on Windows', loc: 'Austin, US', current: false, time: '2 days ago' },
        ].map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < 2 ? '1px solid #1f1f1f' : 'none' }}>
            <div>
              <p style={{ margin: 0, fontSize: 13, color: '#fff', fontWeight: 500 }}>{s.device} {s.current && <span style={{ fontSize: 10, background: '#1a3a1a', color: '#6fcf97', padding: '1px 6px', borderRadius: 3, marginLeft: 6 }}>current</span>}</p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#555' }}>{s.loc} · {s.time}</p>
            </div>
            {!s.current && <button style={{ ...btnSecondary, fontSize: 12, color: '#eb5757', borderColor: '#2a1a1a' }}>Revoke</button>}
          </div>
        ))}
      </Card>
    </div>
  )
}

function NotificationsSection() {
  const [prefs, setPrefs] = useState({
    execFail: true, execSuccess: false, newMember: true,
    weeklyDigest: true, apiLimit: true, billing: true,
    slackEnabled: true, emailEnabled: true,
  })
  const toggle = k => setPrefs(p => ({ ...p, [k]: !p[k] }))

  const groups = [
    {
      title: 'Workflow Events',
      items: [
        { key: 'execFail', label: 'Execution failed', sub: 'Alert when a workflow run errors out.' },
        { key: 'execSuccess', label: 'Execution succeeded', sub: 'Notify after every successful run.' },
      ]
    },
    {
      title: 'Team Activity',
      items: [
        { key: 'newMember', label: 'New member joined', sub: 'When someone accepts a team invite.' },
      ]
    },
    {
      title: 'System',
      items: [
        { key: 'weeklyDigest', label: 'Weekly digest', sub: 'A summary of your workspace activity every Monday.' },
        { key: 'apiLimit', label: 'API limit warnings', sub: 'Alert at 80% and 100% of API quota.' },
        { key: 'billing', label: 'Billing & invoices', sub: 'Receipts and upcoming renewal reminders.' },
      ]
    }
  ]

  return (
    <div>
      <SectionHeader title="Notifications" desc="Choose what you want to be notified about." />
      <Card title="Delivery Channels" style={{ marginBottom: 16 }}>
        <ToggleRow label="Email notifications" sub="Sent to alex@startup.io" enabled={prefs.emailEnabled} onChange={() => toggle('emailEnabled')} />
        <Divider />
        <ToggleRow label="Slack notifications" sub="Posting to #alerts in your workspace" enabled={prefs.slackEnabled} onChange={() => toggle('slackEnabled')} />
      </Card>
      {groups.map(g => (
        <Card key={g.title} title={g.title} style={{ marginBottom: 16 }}>
          {g.items.map((item, i) => (
            <div key={item.key}>
              <ToggleRow label={item.label} sub={item.sub} enabled={prefs[item.key]} onChange={() => toggle(item.key)} />
              {i < g.items.length - 1 && <Divider />}
            </div>
          ))}
        </Card>
      ))}
      <SaveRow />
    </div>
  )
}

function ApiKeysSection() {
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')

  return (
    <div>
      <SectionHeader title="API Keys" desc="Keys grant programmatic access to your workspace. Keep them secret." />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <p style={{ margin: 0, fontSize: 13, color: '#555' }}>{MOCK_API_KEYS.length} keys · All activity logged in Audit Log</p>
        <button style={btnPrimary} onClick={() => setShowNew(s => !s)}>+ Create key</button>
      </div>

      {showNew && (
        <div style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: 8, padding: 20, marginBottom: 16 }}>
          <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 500, color: '#fff' }}>New API Key</p>
          <div style={{ display: 'flex', gap: 12 }}>
            <input style={{ ...inputStyle, flex: 1 }} placeholder="Key name (e.g. Production)" value={newName} onChange={e => setNewName(e.target.value)} />
            <select style={{ ...inputStyle, width: 160 }}>
              <option>Full Access</option>
              <option>Read Only</option>
              <option>Write Only</option>
            </select>
            <button style={btnPrimary}>Generate</button>
          </div>
        </div>
      )}

      <div style={{ border: '1px solid #1f1f1f', borderRadius: 8, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1f1f1f' }}>
              {['Name', 'Key', 'Permissions', 'Last Used', 'Created', ''].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 500, color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_API_KEYS.map((k, i) => (
              <tr key={k.id} style={{ borderBottom: i < MOCK_API_KEYS.length - 1 ? '1px solid #1a1a1a' : 'none', background: 'transparent' }}>
                <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 500, color: '#fff' }}>{k.name}</td>
                <td style={{ padding: '12px 14px' }}>
                  <code style={{ fontSize: 12, color: '#a1a1aa', background: '#1a1a1a', padding: '2px 8px', borderRadius: 4 }}>{k.prefix}</code>
                </td>
                <td style={{ padding: '12px 14px', fontSize: 12, color: '#a1a1aa' }}>{k.perms}</td>
                <td style={{ padding: '12px 14px', fontSize: 12, color: '#555' }}>{k.lastUsed}</td>
                <td style={{ padding: '12px 14px', fontSize: 12, color: '#555' }}>{k.created}</td>
                <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                  <button style={{ ...btnSecondary, fontSize: 12, color: '#eb5757', borderColor: '#2a1a1a' }}>Revoke</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 20, padding: '14px 16px', background: '#0f1a0f', border: '1px solid #1e3a1e', borderRadius: 6 }}>
        <p style={{ margin: 0, fontSize: 12, color: '#6fcf97' }}>
          ⚡ Use <code style={{ background: '#1a2a1a', padding: '1px 4px', borderRadius: 3 }}>Authorization: Bearer sk_prod_...</code> in request headers. Keys never expire unless revoked.
        </p>
      </div>
    </div>
  )
}

function IntegrationsSection() {
  const [connected, setConnected] = useState(
    Object.fromEntries(INTEGRATIONS.map(i => [i.id, i.connected]))
  )

  return (
    <div>
      <SectionHeader title="Integrations" desc="Connect third-party services to use in your workflows." />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {INTEGRATIONS.map(int => (
          <div key={int.id} style={{
            background: '#111', border: '1px solid #1f1f1f', borderRadius: 8, padding: 18,
            display: 'flex', gap: 14, alignItems: 'flex-start',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8, flexShrink: 0,
              background: int.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700, color: '#fff',
            }}>{int.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#fff' }}>{int.name}</p>
                {connected[int.id]
                  ? <span style={{ fontSize: 10, background: '#1a3a1a', color: '#6fcf97', padding: '2px 7px', borderRadius: 3, fontWeight: 500 }}>Connected</span>
                  : <span style={{ fontSize: 10, background: '#1f1f1f', color: '#555', padding: '2px 7px', borderRadius: 3 }}>Not connected</span>
                }
              </div>
              <p style={{ margin: '0 0 12px', fontSize: 12, color: '#555', lineHeight: 1.5 }}>{int.desc}</p>
              <button
                style={connected[int.id] ? { ...btnSecondary, fontSize: 12, color: '#eb5757', borderColor: '#2a1a1a' } : { ...btnSecondary, fontSize: 12 }}
                onClick={() => setConnected(c => ({ ...c, [int.id]: !c[int.id] }))}
              >
                {connected[int.id] ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TeamSection() {
  const [invite, setInvite] = useState('')

  return (
    <div>
      <SectionHeader title="Team & Members" desc="Manage who has access to your workspace." />
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <input style={{ ...inputStyle, flex: 1 }} placeholder="colleague@company.com" value={invite} onChange={e => setInvite(e.target.value)} />
        <select style={{ ...inputStyle, width: 140 }}>
          <option>Member</option>
          <option>Admin</option>
        </select>
        <button style={btnPrimary}>Invite</button>
      </div>

      <div style={{ border: '1px solid #1f1f1f', borderRadius: 8, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1f1f1f' }}>
              {['Member', 'Role', 'Joined', ''].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 500, color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MEMBERS.map((m, i) => (
              <tr key={m.id} style={{ borderBottom: i < MEMBERS.length - 1 ? '1px solid #1a1a1a' : 'none' }}>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: '#1f1f1f', border: '1px solid #2a2a2a',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 600, color: '#a1a1aa',
                    }}>{m.avatar}</div>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: '#fff' }}>{m.name}</p>
                      <p style={{ margin: 0, fontSize: 12, color: '#555' }}>{m.email}</p>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '12px 16px' }}><Badge role={m.role} /></td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: '#555' }}>{m.joined}</td>
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  {m.role !== 'Owner' && (
                    <button style={{ ...btnSecondary, fontSize: 12 }}>···</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AuditSection() {
  const [filter, setFilter] = useState('all')

  return (
    <div>
      <SectionHeader title="Audit Log" desc="A complete record of actions taken in your workspace." />
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['all', 'create', 'update', 'delete'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '5px 14px', borderRadius: 5, fontSize: 12, fontWeight: 500,
            border: '1px solid', cursor: 'pointer', textTransform: 'capitalize',
            background: filter === f ? '#fff' : 'transparent',
            color: filter === f ? '#0A0A0A' : '#555',
            borderColor: filter === f ? '#fff' : '#2a2a2a',
          }}>{f}</button>
        ))}
        <div style={{ marginLeft: 'auto' }}>
          <input style={{ ...inputStyle, width: 220 }} placeholder="Search logs..." />
        </div>
      </div>

      <div style={{ border: '1px solid #1f1f1f', borderRadius: 8, overflow: 'hidden' }}>
        {AUDIT_LOGS.filter(l => filter === 'all' || l.type === filter).map((log, i, arr) => (
          <div key={log.id} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
            borderBottom: i < arr.length - 1 ? '1px solid #1a1a1a' : 'none',
          }}>
            <ActionTypeDot type={log.type} />
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 13, color: '#fff', fontWeight: 500 }}>{log.action}</span>
              <span style={{ fontSize: 12, color: '#555', marginLeft: 8 }}>{log.detail}</span>
            </div>
            <span style={{ fontSize: 12, color: '#555', minWidth: 120, textAlign: 'right' }}>{log.user}</span>
            <span style={{ fontSize: 12, color: '#3a3a3a', minWidth: 150, textAlign: 'right' }}>{log.time}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function DangerSection() {
  const [confirmDelete, setConfirmDelete] = useState('')

  return (
    <div>
      <SectionHeader title="Danger Zone" desc="These actions are permanent and cannot be undone." />
      <div style={{ border: '1px solid #3a1a1a', borderRadius: 8, overflow: 'hidden' }}>
        {[
          {
            title: 'Export workspace data',
            sub: 'Download all workflows, executions, and settings as a JSON archive.',
            action: 'Export',
            danger: false,
          },
          {
            title: 'Transfer ownership',
            sub: 'Transfer this workspace to another admin member.',
            action: 'Transfer',
            danger: false,
          },
          {
            title: 'Pause all workflows',
            sub: 'Immediately stop all running and scheduled workflows.',
            action: 'Pause all',
            danger: true,
          },
          {
            title: 'Delete workspace',
            sub: 'Permanently delete this workspace, all workflows, and data. This cannot be undone.',
            action: 'Delete workspace',
            danger: true,
          },
        ].map((item, i, arr) => (
          <div key={item.title} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '18px 20px',
            borderBottom: i < arr.length - 1 ? '1px solid #2a1a1a' : 'none',
            background: i % 2 === 0 ? 'transparent' : '#0d0d0d',
          }}>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: item.danger ? '#eb5757' : '#fff' }}>{item.title}</p>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: '#555' }}>{item.sub}</p>
            </div>
            <button style={{
              padding: '7px 16px', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer',
              border: `1px solid ${item.danger ? '#3a1a1a' : '#2a2a2a'}`,
              background: 'transparent',
              color: item.danger ? '#eb5757' : '#a1a1aa',
            }}>{item.action}</button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Shared UI Atoms ───────────────────────────────────────────────────

function SectionHeader({ title, desc }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 600, color: '#fff', letterSpacing: -0.3 }}>{title}</h2>
      <p style={{ margin: 0, fontSize: 13, color: '#555' }}>{desc}</p>
      <div style={{ height: 1, background: '#1f1f1f', marginTop: 20 }} />
    </div>
  )
}

function Card({ title, children, style }) {
  return (
    <div style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 8, ...style }}>
      {title && <div style={{ padding: '14px 18px', borderBottom: '1px solid #1f1f1f' }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#fff' }}>{title}</p>
      </div>}
      <div style={{ padding: 18 }}>{children}</div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input style={inputStyle} type={type} defaultValue={value} placeholder={placeholder} onChange={onChange} />
    </div>
  )
}

function ToggleRow({ label, sub, enabled, onChange }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
      <div>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: '#fff' }}>{label}</p>
        {sub && <p style={{ margin: '3px 0 0', fontSize: 12, color: '#555' }}>{sub}</p>}
      </div>
      <Toggle enabled={enabled} onChange={onChange} />
    </div>
  )
}

function Divider() {
  return <div style={{ height: 1, background: '#1a1a1a', margin: '14px 0' }} />
}

function SaveRow() {
  return (
    <div style={{ display: 'flex', gap: 10, marginTop: 24, paddingTop: 20, borderTop: '1px solid #1f1f1f' }}>
      <button style={btnPrimary}>Save changes</button>
      <button style={btnSecondary}>Cancel</button>
    </div>
  )
}

// ─── Styles ────────────────────────────────────────────────────────────

const labelStyle = {
  display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 500,
  color: '#a1a1aa', letterSpacing: '0.02em',
}

const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  padding: '8px 12px', borderRadius: 6,
  border: '1px solid #2a2a2a', background: '#0f0f0f',
  color: '#fff', fontSize: 13, outline: 'none',
  fontFamily: 'inherit',
}

const btnPrimary = {
  padding: '8px 18px', borderRadius: 6, fontSize: 13, fontWeight: 500,
  border: 'none', background: '#ffffff', color: '#0A0A0A', cursor: 'pointer',
}

const btnSecondary = {
  padding: '7px 16px', borderRadius: 6, fontSize: 13, fontWeight: 400,
  border: '1px solid #2a2a2a', background: 'transparent', color: '#a1a1aa', cursor: 'pointer',
}

// ─── Main Component ─────────────────────────────────────────────────────

const SECTION_MAP = {
  profile: ProfileSection,
  account: AccountSection,
  notifications: NotificationsSection,
  api: ApiKeysSection,
  integrations: IntegrationsSection,
  team: TeamSection,
  audit: AuditSection,
  danger: DangerSection,
}

export default function Settings() {
  const [activeSection, setActiveSection] = useState('profile')
  const ActiveSection = SECTION_MAP[activeSection]

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0A0A0A', color: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <Sidebar />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Settings left nav */}
        <div style={{ width: 220, borderRight: '1px solid #1f1f1f', padding: '32px 0', flexShrink: 0, overflowY: 'auto' }}>
          <p style={{ margin: '0 0 16px', padding: '0 20px', fontSize: 11, fontWeight: 600, color: '#3a3a3a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Settings</p>
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 20px', border: 'none', background: 'transparent', cursor: 'pointer',
                textAlign: 'left', fontSize: 13,
                color: activeSection === item.id ? '#fff' : '#555',
                borderLeft: `2px solid ${activeSection === item.id ? '#fff' : 'transparent'}`,
              }}
            >
              <span style={{ fontSize: 14 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '40px 48px' }}>
          <div style={{ maxWidth: 720 }}>
            <ActiveSection />
          </div>
        </div>
      </div>
    </div>
  )
}
