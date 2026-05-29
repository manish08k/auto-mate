import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function Signup() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.name || !form.email || !form.password) {
      setError('All fields are required.')
      return
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setLoading(true)
    try {
      await new Promise(r => setTimeout(r, 900))
      navigate('/dashboard')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const strength = (() => {
    const p = form.password
    if (!p) return null
    if (p.length < 6) return { label: 'Weak', color: '#EF4444', width: '25%' }
    if (p.length < 10) return { label: 'Fair', color: '#F59E0B', width: '55%' }
    return { label: 'Strong', color: '#22C55E', width: '100%' }
  })()

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.cardHeader}>
          <Link to="/" style={s.logo}>Flowmatic</Link>
          <h1 style={s.title}>Create your account</h1>
          <p style={s.subtitle}>
            Already have an account?{' '}
            <Link to="/login" style={s.link}>Sign in</Link>
          </p>
        </div>

        {/* Value props */}
        <div style={s.perks}>
          {['Free up to 10k runs/month', 'No credit card required', 'Deploy in under 5 minutes'].map(p => (
            <div key={p} style={s.perk}>
              <span style={s.checkmark}>✓</span>
              <span style={s.perkText}>{p}</span>
            </div>
          ))}
        </div>

        {error && <div style={s.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} style={s.form}>
          <div style={s.field}>
            <label style={s.label}>Full name</label>
            <input
              type="text"
              autoComplete="name"
              placeholder="Jane Smith"
              value={form.name}
              onChange={set('name')}
              style={s.input}
            />
          </div>

          <div style={s.field}>
            <label style={s.label}>Work email</label>
            <input
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              value={form.email}
              onChange={set('email')}
              style={s.input}
            />
          </div>

          <div style={s.field}>
            <label style={s.label}>Password</label>
            <input
              type="password"
              autoComplete="new-password"
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={set('password')}
              style={s.input}
            />
            {strength && (
              <div style={s.strengthWrap}>
                <div style={s.strengthBar}>
                  <div style={{ ...s.strengthFill, width: strength.width, background: strength.color }} />
                </div>
                <span style={{ ...s.strengthLabel, color: strength.color }}>{strength.label}</span>
              </div>
            )}
          </div>

          <button type="submit" style={s.submit} disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <div style={s.divider}>
          <span style={s.dividerLine} />
          <span style={s.dividerText}>or sign up with</span>
          <span style={s.dividerLine} />
        </div>

        <div style={s.oauthRow}>
          <button style={s.oauthBtn}>
            <GithubIcon />
            GitHub
          </button>
          <button style={s.oauthBtn}>
            <GoogleIcon />
            Google
          </button>
        </div>

        <p style={s.legal}>
          By creating an account, you agree to our{' '}
          <a href="/terms" style={s.link}>Terms of Service</a> and{' '}
          <a href="/privacy" style={s.link}>Privacy Policy</a>.
        </p>
      </div>
    </div>
  )
}

function GithubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 8 }}>
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" style={{ marginRight: 8 }}>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

const s = {
  page: {
    background: '#0A0A0A',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'GeistMono', 'JetBrains Mono', monospace",
    padding: '24px',
  },
  card: { width: '100%', maxWidth: 420 },
  cardHeader: { marginBottom: 24 },
  logo: {
    display: 'block', fontWeight: 600, fontSize: 16,
    color: '#FFFFFF', textDecoration: 'none',
    marginBottom: 32, letterSpacing: '-0.5px',
  },
  title: { fontSize: 22, fontWeight: 600, letterSpacing: '-0.5px', color: '#FFFFFF', margin: '0 0 8px' },
  subtitle: { fontSize: 14, color: '#A1A1AA', margin: 0 },
  link: { color: '#FFFFFF', textDecoration: 'underline' },
  perks: {
    display: 'flex', flexDirection: 'column', gap: 6,
    marginBottom: 24, padding: '14px 16px',
    background: '#111111', border: '1px solid #1F1F1F', borderRadius: 6,
  },
  perk: { display: 'flex', alignItems: 'center', gap: 8 },
  checkmark: { color: '#22C55E', fontSize: 13, fontWeight: 600 },
  perkText: { fontSize: 13, color: '#A1A1AA' },
  errorBox: {
    background: '#1A0A0A', border: '1px solid #3F1515',
    borderRadius: 6, padding: '10px 14px',
    fontSize: 13, color: '#F87171', marginBottom: 16,
  },
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, color: '#A1A1AA' },
  input: {
    background: '#111111', border: '1px solid #1F1F1F',
    borderRadius: 6, padding: '10px 12px',
    fontSize: 14, color: '#FFFFFF', outline: 'none', fontFamily: 'inherit',
  },
  strengthWrap: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 },
  strengthBar: {
    flex: 1, height: 3, background: '#1F1F1F', borderRadius: 4, overflow: 'hidden',
  },
  strengthFill: { height: '100%', borderRadius: 4, transition: 'all 0.3s' },
  strengthLabel: { fontSize: 11, fontWeight: 600, minWidth: 40 },
  submit: {
    background: '#FFFFFF', color: '#0A0A0A', border: 'none',
    borderRadius: 6, padding: '11px', fontSize: 14, fontWeight: 600,
    cursor: 'pointer', marginTop: 4, fontFamily: 'inherit',
  },
  divider: { display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' },
  dividerLine: { flex: 1, height: 1, background: '#1F1F1F' },
  dividerText: { fontSize: 12, color: '#52525B', whiteSpace: 'nowrap' },
  oauthRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 },
  oauthBtn: {
    background: '#111111', border: '1px solid #1F1F1F',
    borderRadius: 6, padding: '10px', fontSize: 13,
    color: '#A1A1AA', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit',
  },
  legal: { fontSize: 12, color: '#52525B', textAlign: 'center', marginTop: 20 },
}