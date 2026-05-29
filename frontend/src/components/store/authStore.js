import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (token) => set({ token }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),

      login: async ({ email, password }) => {
        set({ loading: true, error: null });
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });
          if (!res.ok) throw new Error('Invalid credentials');
          const data = await res.json();
          set({ user: data.user, token: data.token, isAuthenticated: true, loading: false });
          return data.user;
        } catch (err) {
          set({ error: err.message, loading: false });
          return null;
        }
      },

      register: async ({ name, email, password }) => {
        set({ loading: true, error: null });
        try {
          const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password }),
          });
          if (!res.ok) throw new Error('Registration failed');
          const data = await res.json();
          set({ user: data.user, token: data.token, isAuthenticated: true, loading: false });
          return data.user;
        } catch (err) {
          set({ error: err.message, loading: false });
          return null;
        }
      },

      logout: async () => {
        try {
          await fetch('/api/auth/logout', { method: 'POST' });
        } finally {
          set({ user: null, token: null, isAuthenticated: false, error: null });
        }
      },

      updateProfile: async (updates) => {
        set({ loading: true, error: null });
        try {
          const res = await fetch('/api/auth/me', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
          });
          if (!res.ok) throw new Error('Failed to update profile');
          const user = await res.json();
          set({ user, loading: false });
          return user;
        } catch (err) {
          set({ error: err.message, loading: false });
          return null;
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
);
