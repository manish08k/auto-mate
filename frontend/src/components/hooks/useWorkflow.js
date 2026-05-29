import { useState, useCallback } from 'react';

const API_BASE = '/api/workflows';

export function useWorkflow() {
  const [workflows, setWorkflows] = useState([]);
  const [activeWorkflow, setActiveWorkflow] = useState(null);
  const [runState, setRunState] = useState({}); // { [workflowId]: 'idle' | 'running' | 'success' | 'error' }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchWorkflows = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_BASE);
      if (!res.ok) throw new Error('Failed to fetch workflows');
      const data = await res.json();
      setWorkflows(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchWorkflow = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/${id}`);
      if (!res.ok) throw new Error('Failed to fetch workflow');
      const data = await res.json();
      setActiveWorkflow(data);
      return data;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createWorkflow = useCallback(async ({ name, description }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, nodes: [], edges: [] }),
      });
      if (!res.ok) throw new Error('Failed to create workflow');
      const created = await res.json();
      setWorkflows((prev) => [created, ...prev]);
      return created;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateWorkflow = useCallback(async (id, updates) => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to update workflow');
      const updated = await res.json();
      setWorkflows((prev) => prev.map((w) => (w.id === id ? updated : w)));
      if (activeWorkflow?.id === id) setActiveWorkflow(updated);
      return updated;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, [activeWorkflow]);

  const deleteWorkflow = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete workflow');
      setWorkflows((prev) => prev.filter((w) => w.id !== id));
      if (activeWorkflow?.id === id) setActiveWorkflow(null);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [activeWorkflow]);

  const runWorkflow = useCallback(async (id, payload = {}) => {
    setRunState((prev) => ({ ...prev, [id]: 'running' }));
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/${id}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Workflow run failed');
      const result = await res.json();
      setRunState((prev) => ({ ...prev, [id]: 'success' }));
      setTimeout(() => setRunState((prev) => ({ ...prev, [id]: 'idle' })), 3000);
      return result;
    } catch (err) {
      setError(err.message);
      setRunState((prev) => ({ ...prev, [id]: 'error' }));
      setTimeout(() => setRunState((prev) => ({ ...prev, [id]: 'idle' })), 3000);
      return null;
    }
  }, []);

  const toggleActive = useCallback(async (id, enabled) => {
    return updateWorkflow(id, { enabled });
  }, [updateWorkflow]);

  const getRunState = useCallback(
    (id) => runState[id] ?? 'idle',
    [runState]
  );

  return {
    workflows,
    activeWorkflow,
    loading,
    error,
    fetchWorkflows,
    fetchWorkflow,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    runWorkflow,
    toggleActive,
    getRunState,
  };
}
