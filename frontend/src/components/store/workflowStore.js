import { create } from 'zustand';

export const useWorkflowStore = create((set, get) => ({
  workflows: [],
  activeWorkflow: null,
  runStates: {}, // { [workflowId]: 'idle' | 'running' | 'success' | 'error' }
  loading: false,
  error: null,

  setActiveWorkflow: (workflow) => set({ activeWorkflow: workflow }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  fetchWorkflows: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch('/api/workflows');
      if (!res.ok) throw new Error('Failed to fetch workflows');
      const data = await res.json();
      set({ workflows: data, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  fetchWorkflow: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`/api/workflows/${id}`);
      if (!res.ok) throw new Error('Failed to fetch workflow');
      const data = await res.json();
      set({ activeWorkflow: data, loading: false });
      return data;
    } catch (err) {
      set({ error: err.message, loading: false });
      return null;
    }
  },

  createWorkflow: async ({ name, description }) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, nodes: [], edges: [] }),
      });
      if (!res.ok) throw new Error('Failed to create workflow');
      const created = await res.json();
      set((state) => ({ workflows: [created, ...state.workflows], loading: false }));
      return created;
    } catch (err) {
      set({ error: err.message, loading: false });
      return null;
    }
  },

  updateWorkflow: async (id, updates) => {
    set({ error: null });
    try {
      const res = await fetch(`/api/workflows/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to update workflow');
      const updated = await res.json();
      set((state) => ({
        workflows: state.workflows.map((w) => (w.id === id ? updated : w)),
        activeWorkflow: state.activeWorkflow?.id === id ? updated : state.activeWorkflow,
      }));
      return updated;
    } catch (err) {
      set({ error: err.message });
      return null;
    }
  },

  deleteWorkflow: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`/api/workflows/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete workflow');
      set((state) => ({
        workflows: state.workflows.filter((w) => w.id !== id),
        activeWorkflow: state.activeWorkflow?.id === id ? null : state.activeWorkflow,
        loading: false,
      }));
      return true;
    } catch (err) {
      set({ error: err.message, loading: false });
      return false;
    }
  },

  runWorkflow: async (id, payload = {}) => {
    set((state) => ({ runStates: { ...state.runStates, [id]: 'running' }, error: null }));
    try {
      const res = await fetch(`/api/workflows/${id}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Workflow run failed');
      const result = await res.json();
      set((state) => ({ runStates: { ...state.runStates, [id]: 'success' } }));
      setTimeout(() => {
        set((state) => ({ runStates: { ...state.runStates, [id]: 'idle' } }));
      }, 3000);
      return result;
    } catch (err) {
      set((state) => ({ runStates: { ...state.runStates, [id]: 'error' }, error: err.message }));
      setTimeout(() => {
        set((state) => ({ runStates: { ...state.runStates, [id]: 'idle' } }));
      }, 3000);
      return null;
    }
  },

  toggleActive: async (id, enabled) => {
    return get().updateWorkflow(id, { enabled });
  },

  getRunState: (id) => get().runStates[id] ?? 'idle',
}));
