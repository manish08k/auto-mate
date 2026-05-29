import { useState } from 'react'
import { Sidebar } from './dashboard.jsx'

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: { monthly: 0, annual: 0 },
    desc: 'For individuals exploring automation.',
    cta: 'Current plan',
    current: false,
    features: [
      '3 active workflows',
      '500 executions / month',
      '5 integrations',
      'Community support',
      '7-day execution history',
    ],
    limits: {
      workflows: 3,
      executions: 500,
      team: 1,
      history: '7 days',
    }
  },
  {
    id: 'starter',
    name: 'Starter',
    price: { monthly: 29, annual: 23 },
    desc: 'For small teams building production workflows.',
    cta: 'Upgrade to Starter',
    current: true,
    popular: false,
    features: [
      '20 active workflows',
      '10,000 executions / month',
      'All integrations',
      'Email support (24h SLA)',
      '30-day execution history',
      'Webhooks & scheduling',
      '3 team seats',
    ],
    limits: {
      workflows: 20,
      executions: 10000,
      team: 3,
      history: '30 days',
    }
  },
  {
    id: 'pro',
    name: 'Pro',
    price: { monthly: 89, annual: 71 },
    desc: 'For growing teams that need scale and control.',
    cta: 'Upgrade to Pro',
    current: false,
    popular: true,
    features: [
      'Unlimited workflows',
      '100,000 executions / month',
      'All integrations',
      'Priority support (4h SLA)',
      '90-day execution history',
      'Webhooks, scheduling & cron',
      '10 team seats',
      'Custom retry logic',
      'Audit log',
    ],
    limits: {
      workflows: '∞',
      executions: 100000,
      team: 10,
      history: '90 days',
    }
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: { monthly: null, annual: null },
    desc: 'For companies with advanced security and compliance needs.',
    cta: 'Contact sales',
    current: false,
    popular: false,
    features: [
      'Unlimited workflows',
      'Unlimited executions',
      'All integrations + custom',
      'Dedicated support + SLA',
      '1-year execution history',
      'Unlimited team seats',
      'SSO / SAML',
      'Custom data retention',
      'SoC 2 Type II, HIPAA',
      'On-prem deployment option',
      'Custom contracts & invoicing',
    ],
    limits: {
      workflows: '∞',
      executions: '∞',
      team: '∞',
      history: '1 year',
    }
  },
]

const INVOICES = [
  { id: 'inv_001', date: 'May 1, 2026', amount: '$29.00', status: 'paid', plan: 'Starter — Monthly' },
  { id: 'inv_002', date: 'Apr 1, 2026', amount: '$29.00', status: 'paid', plan: 'Starter — Monthly' },
  { id: 'inv_003', date: 'Mar 1, 2026', amount: '$29.00', status: 'paid', plan: 'Starter — Monthly' },
  { id: 'inv_004', date: 'Feb 1, 2026', amount: '$29.00', status: 'paid', plan: 'Starter — Monthly' },
  { id: 'inv_005', date: 'Jan 1, 2026', amount: '$0.00', status: 'paid', plan: 'Free' },
]

const USAGE = {
  workflows: { used: 7, limit: 20, label: 'Active Workflows' },
  executions: { used: 4821, limit: 10000, label: 'Executions this month' },
  seats: { used: 4, limit: 3, label: 'Team Seats', over: true },
  apiCalls: { used: 12440, limit: 50000, label: 'API Calls' },
}

function UsageBar({ used, limit, over }) {
  const pct = typeof limit === 'number' ? Math.min((used / limit) * 100, 100) : 0
  const color = over ? '#eb5757' : pct > 80 ? '#f2c94c' : '#6fcf97'
  return (
    <div>
      <div style={{ height: 4, background: '#1f1f1f', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, transition: 'width 0.4s ease' }} />
      </div>
    </div>
  )
}

function PlanCard({ plan, billing }) {
  const price = billing === 'annual' ? plan.price.annual : plan.price.monthly

  return (
    <div style={{
      background: plan.popular ? '#111' : '#0d0d0d',
      border: `1px solid ${plan.current ? '#3a3a3a' : plan.popular ? '#2a2a2a' : '#1a1a1a'}`,
      borderRadius: 10,
      padding: 24,
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {plan.popular && (
        <div style={{
          position: 'absolute', top: -1, left: 24,
          background: '#fff', color: '#0A0A0A',
          fontSize: 10, fontWeight: 700, padding: '3px 10px',
          borderRadius: '0 0 5px 5px', letterSpacing: '0.05em', textTransform: 'uppercase',
        }}>Most Popular</div>
      )}
      {plan.current && (
        <div style={{
          position: 'absolute', top: 16, right: 16,
          background: '#1a3a1a', color: '#6fcf97',
          fontSize: 10, fontWeight: 600, padding: '3px 10px',
          borderRadius: 4, letterSpacing: '0.03em',
        }}>Current</div>
      )}

      <div style={{ marginBottom: 'auto' }}>
        <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{plan.name}</p>

        <div style={{ margin: '12px 0 8px', display: 'flex', alignItems: 'baseline', gap: 4 }}>
          {price === null ? (
            <span style={{ fontSize: 28, fontWeight: 700, color: '#fff', letterSpacing: -1 }}>Custom</span>
          ) : price === 0 ? (
            <span style={{ fontSize: 28, fontWeight: 700, color: '#fff', letterSpacing: -1 }}>Free</span>
          ) : (
            <>
              <span style={{ fontSize: 28, fontWeight: 700, color: '#fff', letterSpacing: -1 }}>${price}</span>
              <span style={{ fontSize: 13, color: '#555' }}>/mo</span>
              {billing === 'annual' && <span style={{ fontSize: 11, color: '#6fcf97', marginLeft: 4 }}>billed annually</span>}
            </>
          )}
        </div>

        <p style={{ margin: '0 0 20px', fontSize: 12, color: '#555', lineHeight: 1.6 }}>{plan.desc}</p>

        <div style={{ height: 1, background: '#1a1a1a', marginBottom: 16 }} />

        <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          {plan.features.map((f, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8, fontSize: 12, color: '#a1a1aa' }}>
              <span style={{ color: '#6fcf97', fontSize: 13, marginTop: 1, flexShrink: 0 }}>✓</span>
              {f}
            </li>
          ))}
        </ul>
      </div>

      <button style={{
        marginTop: 24, padding: '9px 0', borderRadius: 7, fontSize: 13, fontWeight: 600,
        cursor: 'pointer', width: '100%', border: '1px solid',
        background: plan.current ? 'transparent' : plan.popular ? '#fff' : 'transparent',
        color: plan.current ? '#555' : plan.popular ? '#0A0A0A' : '#a1a1aa',
        borderColor: plan.current ? '#2a2a2a' : plan.popular ? '#fff' : '#2a2a2a',
      }}>
        {plan.cta}
      </button>
    </div>
  )
}

function Comparison() {
  const features = [
    { label: 'Active workflows', values: ['3', '20', 'Unlimited', 'Unlimited'] },
    { label: 'Executions / month', values: ['500', '10,000', '100,000', 'Unlimited'] },
    { label: 'Team seats', values: ['1', '3', '10', 'Unlimited'] },
    { label: 'Execution history', values: ['7 days', '30 days', '90 days', '1 year'] },
    { label: 'All integrations', values: [false, true, true, true] },
    { label: 'Webhooks & scheduling', values: [false, true, true, true] },
    { label: 'Custom retry logic', values: [false, false, true, true] },
    { label: 'Audit log', values: [false, false, true, true] },
    { label: 'SSO / SAML', values: [false, false, false, true] },
    { label: 'SoC 2 / HIPAA', values: [false, false, false, true] },
    { label: 'Priority support', values: [false, false, true, true] },
    { label: 'On-prem option', values: [false, false, false, true] },
  ]

  return (
    <div style={{ marginTop: 48 }}>
      <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 600, color: '#fff' }}>Full comparison</h3>
      <div style={{ border: '1px solid #1f1f1f', borderRadius: 8, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1f1f1f' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 500, color: '#555', width: '35%' }}></th>
              {PLANS.map(p => (
                <th key={p.id} style={{ padding: '12px 16px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: p.current ? '#fff' : '#555' }}>{p.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {features.map((row, i) => (
              <tr key={row.label} style={{ borderBottom: i < features.length - 1 ? '1px solid #141414' : 'none', background: i % 2 === 0 ? 'transparent' : '#0d0d0d' }}>
                <td style={{ padding: '10px 16px', fontSize: 12, color: '#a1a1aa' }}>{row.label}</td>
                {row.values.map((v, j) => (
                  <td key={j} style={{ padding: '10px 16px', textAlign: 'center', fontSize: 12, color: '#fff' }}>
                    {typeof v === 'boolean'
                      ? v
                        ? <span style={{ color: '#6fcf97', fontSize: 14 }}>✓</span>
                        : <span style={{ color: '#2a2a2a', fontSize: 14 }}>—</span>
                      : v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function Pricing() {
  const [billing, setBilling] = useState('monthly')
  const [tab, setTab] = useState('plans')

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0A0A0A', color: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <Sidebar />

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Top header */}
        <div style={{ padding: '28px 40px 0', borderBottom: '1px solid #1f1f1f' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
            <div>
              <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, letterSpacing: -0.4, color: '#fff' }}>Plans & Billing</h1>
              <p style={{ margin: 0, fontSize: 13, color: '#555' }}>Manage your subscription, usage, and payment method.</p>
            </div>
          </div>

          {/* Tab nav */}
          <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #1f1f1f', marginBottom: -1 }}>
            {[
              { id: 'plans', label: 'Plans' },
              { id: 'usage', label: 'Usage' },
              { id: 'billing', label: 'Billing' },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                padding: '10px 18px', border: 'none', background: 'transparent', cursor: 'pointer',
                fontSize: 13, fontWeight: 500,
                color: tab === t.id ? '#fff' : '#555',
                borderBottom: `2px solid ${tab === t.id ? '#fff' : 'transparent'}`,
                marginBottom: -1,
              }}>{t.label}</button>
            ))}
          </div>
        </div>

        <div style={{ padding: '32px 40px', maxWidth: 1100 }}>

          {/* ── PLANS TAB ── */}
          {tab === 'plans' && (
            <div>
              {/* Current plan banner */}
              <div style={{
                background: '#111', border: '1px solid #1f1f1f', borderRadius: 8,
                padding: '16px 20px', marginBottom: 32,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6fcf97' }} />
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#fff' }}>Starter plan — $29/mo</p>
                    <p style={{ margin: '3px 0 0', fontSize: 12, color: '#555' }}>
                      Renews on <strong style={{ color: '#a1a1aa' }}>June 1, 2026</strong>. Next charge: <strong style={{ color: '#a1a1aa' }}>$29.00</strong>
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: '#555' }}>●●●● ●●●● ●●●● 4242</span>
                  <button style={{
                    padding: '6px 14px', borderRadius: 5, fontSize: 12,
                    border: '1px solid #2a2a2a', background: 'transparent', color: '#a1a1aa', cursor: 'pointer',
                  }}>Manage payment</button>
                </div>
              </div>

              {/* Billing toggle */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
                <div style={{ display: 'flex', background: '#111', border: '1px solid #1f1f1f', borderRadius: 8, padding: 3 }}>
                  {['monthly', 'annual'].map(b => (
                    <button key={b} onClick={() => setBilling(b)} style={{
                      padding: '7px 22px', borderRadius: 6, border: 'none', cursor: 'pointer',
                      fontSize: 13, fontWeight: 500,
                      background: billing === b ? '#fff' : 'transparent',
                      color: billing === b ? '#0A0A0A' : '#555',
                    }}>
                      {b === 'monthly' ? 'Monthly' : 'Annual'}
                      {b === 'annual' && billing === 'monthly' && (
                        <span style={{ marginLeft: 8, fontSize: 10, color: '#6fcf97', fontWeight: 600 }}>Save 20%</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Plan cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
                {PLANS.map(plan => <PlanCard key={plan.id} plan={plan} billing={billing} />)}
              </div>

              <Comparison />

              {/* FAQ */}
              <div style={{ marginTop: 48 }}>
                <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 600, color: '#fff' }}>Frequently asked</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  {[
                    { q: 'Can I downgrade at any time?', a: 'Yes. Downgrades take effect at the end of your billing cycle. Your data is preserved.' },
                    { q: 'What counts as an execution?', a: 'Each workflow run counts as one execution, regardless of the number of steps inside it.' },
                    { q: 'Is there a free trial for Pro?', a: '14-day free trial on Pro, no credit card required. You can upgrade or cancel any time.' },
                    { q: 'How does annual billing work?', a: 'You pay for 12 months upfront and save 20%. The annual amount appears as a single invoice.' },
                  ].map(faq => (
                    <div key={faq.q} style={{ padding: '18px 20px', background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 8 }}>
                      <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: '#fff' }}>{faq.q}</p>
                      <p style={{ margin: 0, fontSize: 12, color: '#555', lineHeight: 1.65 }}>{faq.a}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── USAGE TAB ── */}
          {tab === 'usage' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <p style={{ margin: 0, fontSize: 13, color: '#555' }}>Usage resets on <strong style={{ color: '#a1a1aa' }}>June 1, 2026</strong></p>
                <span style={{ fontSize: 12, color: '#555', background: '#111', border: '1px solid #1f1f1f', padding: '4px 12px', borderRadius: 5 }}>Starter Plan</span>
              </div>

              {/* Usage meters */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 32 }}>
                {Object.entries(USAGE).map(([key, u]) => {
                  const pct = typeof u.limit === 'number' ? Math.round((u.used / u.limit) * 100) : null
                  return (
                    <div key={key} style={{ background: '#111', border: `1px solid ${u.over ? '#3a1a1a' : '#1f1f1f'}`, borderRadius: 8, padding: 20 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                        <p style={{ margin: 0, fontSize: 12, color: '#555', fontWeight: 500 }}>{u.label}</p>
                        {u.over && <span style={{ fontSize: 10, background: '#3a1a1a', color: '#eb5757', padding: '2px 8px', borderRadius: 3, fontWeight: 600 }}>Over limit</span>}
                      </div>
                      <p style={{ margin: '0 0 12px', fontSize: 22, fontWeight: 700, color: u.over ? '#eb5757' : '#fff', letterSpacing: -0.5 }}>
                        {u.used.toLocaleString()}
                        <span style={{ fontSize: 13, fontWeight: 400, color: '#3a3a3a', marginLeft: 4 }}>
                          / {typeof u.limit === 'number' ? u.limit.toLocaleString() : u.limit}
                        </span>
                      </p>
                      <UsageBar used={u.used} limit={u.limit} over={u.over} />
                      {pct !== null && (
                        <p style={{ margin: '8px 0 0', fontSize: 11, color: u.over ? '#eb5757' : '#555' }}>
                          {u.over ? `${u.used - u.limit} over limit` : `${pct}% used · ${(u.limit - u.used).toLocaleString()} remaining`}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Execution history chart placeholder */}
              <div style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 8, padding: 24, marginBottom: 16 }}>
                <p style={{ margin: '0 0 20px', fontSize: 13, fontWeight: 600, color: '#fff' }}>Execution history (last 30 days)</p>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 80 }}>
                  {[320, 510, 280, 620, 410, 740, 490, 380, 560, 810, 630, 420, 290, 670,
                    720, 540, 380, 490, 610, 520, 430, 780, 490, 360, 540, 680, 420, 580, 760, 480].map((h, i) => (
                    <div key={i} style={{
                      flex: 1, background: i === 29 ? '#6fcf97' : '#1f1f1f',
                      borderRadius: '2px 2px 0 0',
                      height: `${(h / 810) * 100}%`,
                      minHeight: 2,
                    }} />
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                  <span style={{ fontSize: 11, color: '#3a3a3a' }}>May 1</span>
                  <span style={{ fontSize: 11, color: '#3a3a3a' }}>May 29</span>
                </div>
              </div>

              {/* Upgrade nudge for over-limit */}
              <div style={{ background: '#1a0f0f', border: '1px solid #3a1a1a', borderRadius: 8, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: '#eb5757' }}>Team seats over limit</p>
                  <p style={{ margin: 0, fontSize: 12, color: '#555' }}>You have 4 members but your plan allows 3. Upgrade to Pro for 10 seats.</p>
                </div>
                <button style={{ padding: '8px 18px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: 'none', background: '#fff', color: '#0A0A0A', cursor: 'pointer', flexShrink: 0, marginLeft: 24 }}>
                  Upgrade to Pro
                </button>
              </div>
            </div>
          )}

          {/* ── BILLING TAB ── */}
          {tab === 'billing' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 32 }}>
                {/* Payment method */}
                <div style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 8, padding: 20 }}>
                  <p style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 600, color: '#fff' }}>Payment method</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <div style={{ width: 40, height: 26, background: '#1f1f1f', border: '1px solid #2a2a2a', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#a1a1aa' }}>VISA</div>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, color: '#fff' }}>Visa ending in 4242</p>
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: '#555' }}>Expires 08/2028</p>
                    </div>
                  </div>
                  <button style={{ padding: '7px 14px', borderRadius: 5, fontSize: 12, border: '1px solid #2a2a2a', background: 'transparent', color: '#a1a1aa', cursor: 'pointer' }}>Update card</button>
                </div>

                {/* Billing info */}
                <div style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 8, padding: 20 }}>
                  <p style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 600, color: '#fff' }}>Billing address</p>
                  {[
                    ['Company', 'Startup Inc.'],
                    ['Address', '123 Broadway, New York, NY 10001'],
                    ['Tax ID', 'US 12-3456789'],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 12 }}>
                      <span style={{ color: '#555' }}>{k}</span>
                      <span style={{ color: '#a1a1aa' }}>{v}</span>
                    </div>
                  ))}
                  <button style={{ marginTop: 4, padding: '7px 14px', borderRadius: 5, fontSize: 12, border: '1px solid #2a2a2a', background: 'transparent', color: '#a1a1aa', cursor: 'pointer' }}>Edit details</button>
                </div>
              </div>

              {/* Invoice history */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#fff' }}>Invoice history</p>
                  <button style={{ padding: '6px 14px', borderRadius: 5, fontSize: 12, border: '1px solid #2a2a2a', background: 'transparent', color: '#a1a1aa', cursor: 'pointer' }}>Download all</button>
                </div>

                <div style={{ border: '1px solid #1f1f1f', borderRadius: 8, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #1f1f1f' }}>
                        {['Invoice', 'Date', 'Amount', 'Status', ''].map(h => (
                          <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 500, color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {INVOICES.map((inv, i) => (
                        <tr key={inv.id} style={{ borderBottom: i < INVOICES.length - 1 ? '1px solid #141414' : 'none', background: i % 2 === 0 ? 'transparent' : '#0d0d0d' }}>
                          <td style={{ padding: '11px 16px' }}>
                            <p style={{ margin: 0, fontSize: 13, color: '#fff', fontWeight: 500 }}>{inv.plan}</p>
                            <p style={{ margin: '2px 0 0', fontSize: 11, color: '#3a3a3a' }}>{inv.id}</p>
                          </td>
                          <td style={{ padding: '11px 16px', fontSize: 13, color: '#a1a1aa' }}>{inv.date}</td>
                          <td style={{ padding: '11px 16px', fontSize: 13, color: '#fff', fontWeight: 500 }}>{inv.amount}</td>
                          <td style={{ padding: '11px 16px' }}>
                            <span style={{ fontSize: 11, background: '#1a3a1a', color: '#6fcf97', padding: '2px 8px', borderRadius: 3, fontWeight: 500 }}>Paid</span>
                          </td>
                          <td style={{ padding: '11px 16px', textAlign: 'right' }}>
                            <button style={{ fontSize: 12, padding: '4px 12px', border: '1px solid #1f1f1f', borderRadius: 4, background: 'transparent', color: '#555', cursor: 'pointer' }}>PDF</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Cancel plan */}
              <div style={{ marginTop: 32, padding: '16px 20px', background: '#0d0d0d', border: '1px solid #1f1f1f', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: '#a1a1aa' }}>Cancel subscription</p>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#3a3a3a' }}>You'll keep access until June 1, 2026. After that, you'll move to the Free plan.</p>
                </div>
                <button style={{ padding: '7px 16px', borderRadius: 5, fontSize: 12, fontWeight: 500, border: '1px solid #3a1a1a', background: 'transparent', color: '#eb5757', cursor: 'pointer', flexShrink: 0, marginLeft: 24 }}>
                  Cancel plan
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
