import { Link } from 'react-router-dom'

const features = [
  {
    icon: '⚡',
    title: 'Visual Workflow Builder',
    desc: 'Drag and drop nodes to build automation pipelines. No code required, but full code access when you need it.',
  },
  {
    icon: '🔗',
    title: '200+ Integrations',
    desc: 'Connect to any API, database, or service. OAuth, API keys, webhooks — all managed in one place.',
  },
  {
    icon: '📊',
    title: 'Real-time Execution Logs',
    desc: 'Watch your workflows run in real time. Every step logged, every error traced, every run replayable.',
  },
  {
    icon: '🔒',
    title: 'Enterprise Security',
    desc: 'SOC 2 Type II, SSO, role-based access control, and audit logs built in from day one.',
  },
  {
    icon: '🚀',
    title: 'Instant Deployment',
    desc: 'Push workflows to production in one click. Auto-scaling infrastructure, zero DevOps overhead.',
  },
  {
    icon: '🧩',
    title: 'Custom Nodes',
    desc: 'Write your own nodes in JavaScript. Share them with your team or publish to the community marketplace.',
  },
]

const stats = [
  { value: '10M+', label: 'Workflow runs / month' },
  { value: '99.99%', label: 'Uptime SLA' },
  { value: '200+', label: 'Integrations' },
  { value: '<50ms', label: 'Median latency' },
]

const logos = ['Stripe', 'Vercel', 'Linear', 'Notion', 'Retool', 'Figma']

export default function Landing() {
  return (
    <div style={s.page}>
      {/* Nav */}
      <nav style={s.nav}>
        <div style={s.navInner}>
          <span style={s.logo}>Flowmatic</span>
          <div style={s.navLinks}>
            <a href="#features" style={s.navLink}>Features</a>
            <a href="#pricing" style={s.navLink}>Pricing</a>
            <a href="https://docs.flowmatic.dev" style={s.navLink}>Docs</a>
          </div>
          <div style={s.navActions}>
            <Link to="/login" style={s.navBtn}>Log in</Link>
            <Link to="/signup" style={s.navCta}>Get started free</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={s.hero}>
        <div style={s.heroInner}>
          <div style={s.badge}>Now in GA — v2.0 with AI nodes</div>
          <h1 style={s.h1}>
            Automate anything.<br />
            Deploy in minutes.
          </h1>
          <p style={s.heroSub}>
            The workflow automation platform built for engineers and operators.
            Visual editor, 200+ integrations, real-time logs, and full API access.
          </p>
          <div style={s.heroActions}>
            <Link to="/signup" style={s.ctaPrimary}>Start building free</Link>
            <a href="#demo" style={s.ctaSecondary}>Watch demo →</a>
          </div>
          <p style={s.heroNote}>No credit card required · Free up to 10k runs/month</p>
        </div>

        {/* Terminal preview */}
        <div style={s.terminal}>
          <div style={s.terminalHeader}>
            <span style={{ ...s.dot, background: '#FF5F57' }} />
            <span style={{ ...s.dot, background: '#FEBC2E' }} />
            <span style={{ ...s.dot, background: '#28C840' }} />
            <span style={s.terminalTitle}>workflow.json</span>
          </div>
          <pre style={s.terminalBody}>{`{
  "id": "wf_stripe_to_notion",
  "trigger": {
    "type": "webhook",
    "event": "payment.succeeded"
  },
  "nodes": [
    {
      "id": "parse",
      "type": "transform",
      "fn": "extractCustomer"
    },
    {
      "id": "notion",
      "type": "integration",
      "service": "notion",
      "action": "createPage"
    },
    {
      "id": "slack",
      "type": "integration",
      "service": "slack",
      "action": "sendMessage"
    }
  ]
}`}</pre>
        </div>
      </section>

      {/* Logos */}
      <section style={s.logos}>
        <p style={s.logosLabel}>Trusted by engineering teams at</p>
        <div style={s.logoRow}>
          {logos.map(l => (
            <span key={l} style={s.logoItem}>{l}</span>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section style={s.stats}>
        {stats.map(st => (
          <div key={st.label} style={s.statCard}>
            <div style={s.statValue}>{st.value}</div>
            <div style={s.statLabel}>{st.label}</div>
          </div>
        ))}
      </section>

      {/* Features */}
      <section id="features" style={s.section}>
        <div style={s.sectionHeader}>
          <h2 style={s.h2}>Everything you need to automate at scale</h2>
          <p style={s.sectionSub}>
            Built for the use cases that matter — from simple API chaining to complex multi-step enterprise workflows.
          </p>
        </div>
        <div style={s.featureGrid}>
          {features.map(f => (
            <div key={f.title} style={s.featureCard}>
              <div style={s.featureIcon}>{f.icon}</div>
              <h3 style={s.featureTitle}>{f.title}</h3>
              <p style={s.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section style={s.ctaBanner}>
        <h2 style={s.ctaBannerH2}>Ready to automate?</h2>
        <p style={s.ctaBannerSub}>
          Join 12,000+ teams shipping automation workflows in production.
        </p>
        <Link to="/signup" style={s.ctaPrimary}>Create your free account</Link>
      </section>

      {/* Footer */}
      <footer style={s.footer}>
        <div style={s.footerInner}>
          <span style={s.logo}>Flowmatic</span>
          <div style={s.footerLinks}>
            <a href="/privacy" style={s.footerLink}>Privacy</a>
            <a href="/terms" style={s.footerLink}>Terms</a>
            <a href="https://status.flowmatic.dev" style={s.footerLink}>Status</a>
            <a href="mailto:support@flowmatic.dev" style={s.footerLink}>Support</a>
          </div>
          <span style={s.footerCopy}>© 2026 Flowmatic, Inc.</span>
        </div>
      </footer>
    </div>
  )
}

const s = {
  page: {
    background: '#0A0A0A',
    color: '#FFFFFF',
    fontFamily: "'GeistMono', 'JetBrains Mono', monospace",
    minHeight: '100vh',
  },
  nav: {
    borderBottom: '1px solid #1F1F1F',
    position: 'sticky',
    top: 0,
    background: '#0A0A0A',
    zIndex: 100,
  },
  navInner: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '0 24px',
    height: 56,
    display: 'flex',
    alignItems: 'center',
    gap: 32,
  },
  logo: { fontWeight: 600, fontSize: 16, letterSpacing: '-0.5px', flex: '0 0 auto' },
  navLinks: { display: 'flex', gap: 24, flex: 1 },
  navLink: { color: '#A1A1AA', fontSize: 14, textDecoration: 'none' },
  navActions: { display: 'flex', gap: 8, alignItems: 'center' },
  navBtn: {
    color: '#A1A1AA', fontSize: 14, textDecoration: 'none',
    padding: '6px 12px',
  },
  navCta: {
    background: '#FFFFFF', color: '#0A0A0A', fontSize: 14,
    textDecoration: 'none', padding: '6px 14px',
    borderRadius: 6, fontWeight: 500,
  },
  hero: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '80px 24px 64px',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 64,
    alignItems: 'center',
  },
  heroInner: {},
  badge: {
    display: 'inline-block',
    background: '#111111',
    border: '1px solid #1F1F1F',
    borderRadius: 20,
    padding: '4px 12px',
    fontSize: 12,
    color: '#A1A1AA',
    marginBottom: 24,
  },
  h1: {
    fontSize: 52,
    fontWeight: 700,
    lineHeight: 1.1,
    letterSpacing: '-2px',
    margin: '0 0 20px',
  },
  heroSub: {
    fontSize: 17,
    color: '#A1A1AA',
    lineHeight: 1.7,
    margin: '0 0 32px',
    maxWidth: 480,
  },
  heroActions: { display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 },
  ctaPrimary: {
    background: '#FFFFFF', color: '#0A0A0A',
    padding: '10px 20px', borderRadius: 6,
    textDecoration: 'none', fontSize: 14, fontWeight: 600,
  },
  ctaSecondary: {
    color: '#A1A1AA', fontSize: 14, textDecoration: 'none',
  },
  heroNote: { fontSize: 12, color: '#52525B', margin: 0 },
  terminal: {
    background: '#111111',
    border: '1px solid #1F1F1F',
    borderRadius: 10,
    overflow: 'hidden',
  },
  terminalHeader: {
    background: '#1A1A1A',
    borderBottom: '1px solid #1F1F1F',
    padding: '10px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  dot: { width: 12, height: 12, borderRadius: '50%', display: 'inline-block' },
  terminalTitle: { marginLeft: 8, fontSize: 12, color: '#52525B' },
  terminalBody: {
    padding: '20px 24px',
    fontSize: 13,
    lineHeight: 1.7,
    color: '#A1A1AA',
    margin: 0,
    overflowX: 'auto',
  },
  logos: {
    borderTop: '1px solid #1F1F1F',
    borderBottom: '1px solid #1F1F1F',
    padding: '32px 24px',
    textAlign: 'center',
  },
  logosLabel: { fontSize: 12, color: '#52525B', marginBottom: 20, letterSpacing: 1, textTransform: 'uppercase' },
  logoRow: { display: 'flex', gap: 48, justifyContent: 'center', flexWrap: 'wrap' },
  logoItem: { fontSize: 16, fontWeight: 600, color: '#3F3F46', letterSpacing: '-0.5px' },
  stats: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '64px 24px',
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 1,
    background: '#1F1F1F',
    border: '1px solid #1F1F1F',
    borderRadius: 10,
  },
  statCard: {
    background: '#0A0A0A',
    padding: '32px 24px',
    textAlign: 'center',
  },
  statValue: { fontSize: 36, fontWeight: 700, letterSpacing: '-2px', marginBottom: 8 },
  statLabel: { fontSize: 13, color: '#A1A1AA' },
  section: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '80px 24px',
  },
  sectionHeader: { textAlign: 'center', marginBottom: 56 },
  h2: { fontSize: 36, fontWeight: 700, letterSpacing: '-1.5px', margin: '0 0 16px' },
  sectionSub: { fontSize: 16, color: '#A1A1AA', maxWidth: 520, margin: '0 auto' },
  featureGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 1,
    background: '#1F1F1F',
    border: '1px solid #1F1F1F',
    borderRadius: 10,
    overflow: 'hidden',
  },
  featureCard: {
    background: '#0A0A0A',
    padding: '32px 28px',
  },
  featureIcon: { fontSize: 24, marginBottom: 16 },
  featureTitle: { fontSize: 15, fontWeight: 600, margin: '0 0 10px' },
  featureDesc: { fontSize: 14, color: '#A1A1AA', lineHeight: 1.7, margin: 0 },
  ctaBanner: {
    maxWidth: 1200,
    margin: '0 auto 80px',
    padding: '64px 24px',
    textAlign: 'center',
    background: '#111111',
    border: '1px solid #1F1F1F',
    borderRadius: 10,
  },
  ctaBannerH2: { fontSize: 36, fontWeight: 700, letterSpacing: '-1.5px', margin: '0 0 12px' },
  ctaBannerSub: { fontSize: 16, color: '#A1A1AA', marginBottom: 32 },
  footer: {
    borderTop: '1px solid #1F1F1F',
    padding: '24px',
  },
  footerInner: {
    maxWidth: 1200,
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    gap: 32,
  },
  footerLinks: { display: 'flex', gap: 20, flex: 1 },
  footerLink: { fontSize: 13, color: '#52525B', textDecoration: 'none' },
  footerCopy: { fontSize: 13, color: '#3F3F46' },
}