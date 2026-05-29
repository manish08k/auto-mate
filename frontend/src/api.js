import axios from 'axios'

// ─────────────────────────────────────────────
// Axios base instance
// All services import from here — never create
// a second axios instance.
// ─────────────────────────────────────────────

const api = axios.create({
  baseURL:         import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api',
  timeout:         15_000,
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
    'Accept':       'application/json',
  },
})

// ── Request interceptor: attach JWT ──
api.interceptors.request.use((config) => {
  try {
    const raw   = localStorage.getItem('flowos_auth')
    const state = raw ? JSON.parse(raw) : null
    const token = state?.state?.token
    if (token) config.headers.Authorization = `Bearer ${token}`
  } catch {
    // localStorage unavailable — no token
  }
  return config
})

// ── Response interceptor: handle 401 ──
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      // Clear auth state and redirect to login
      try {
        localStorage.removeItem('flowos_auth')
      } catch { /* ignore */ }
      window.location.href = '/login?session=expired'
    }
    return Promise.reject(err)
  }
)

export default api
