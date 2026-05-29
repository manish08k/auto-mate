import { create } from 'zustand'
import { persist, devtools } from 'zustand/middleware'

// ─────────────────────────────────────────────
// authStore — global authentication state
//
// Persists user + token to localStorage so session
// survives page refreshes without a round-trip.
// bootstrap() is called once on app mount to
// validate the stored token against the backend.
// ─────────────────────────────────────────────

const useAuthStore = create(
  devtools(
    persist(
      (set, get) => ({
        // ── State ──
        user:            null,   // { id, name, email, avatar, plan, role }
        token:           null,   // JWT access token
        isAuthenticated: false,
        isLoading:       true,   // true while bootstrap() is running

        // ── Actions ──

        /**
         * bootstrap()
         * Called once on app mount (main.jsx via useSessionBootstrap).
         * Validates stored JWT against backend /auth/me.
         * Sets isAuthenticated = true/false.
         */
        bootstrap: async () => {
          const { token } = get()
          if (!token) {
            set({ isLoading: false, isAuthenticated: false })
            return
          }

          try {
            const { validateToken } = await import('../services/authService.js')
            const user = await validateToken(token)
            set({ user, isAuthenticated: true, isLoading: false })
          } catch {
            // Token invalid or expired — clear session
            set({ user: null, token: null, isAuthenticated: false, isLoading: false })
          }
        },

        /**
         * login({ email, password })
         * On success: stores token + user, sets isAuthenticated.
         */
        login: async (credentials) => {
          const { loginRequest } = await import('../services/authService.js')
          const { token, user }  = await loginRequest(credentials)
          set({ token, user, isAuthenticated: true })
          return user
        },

        /**
         * signup({ name, email, password })
         */
        signup: async (data) => {
          const { signupRequest } = await import('../services/authService.js')
          const { token, user }   = await signupRequest(data)
          set({ token, user, isAuthenticated: true })
          return user
        },

        /**
         * logout()
         * Clears all state + persisted storage.
         */
        logout: () => {
          set({ user: null, token: null, isAuthenticated: false, isLoading: false })
        },

        /**
         * updateUser(patch)
         * Partial update to user object (e.g. after profile edit).
         */
        updateUser: (patch) => {
          set((s) => ({ user: { ...s.user, ...patch } }))
        },
      }),
      {
        name:    'flowos_auth',
        partialize: (s) => ({ token: s.token, user: s.user }),
      }
    ),
    { name: 'authStore' }
  )
)

export default useAuthStore
