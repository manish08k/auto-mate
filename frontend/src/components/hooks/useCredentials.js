import { useState, useCallback } from 'react';

const API_BASE = '/api/credentials';

export function useCredentials() {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [testState, setTestState] = useState({}); // { [credentialId]: 'idle' | 'testing' | 'ok' | 'fail' }

  const fetchCredentials = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_BASE);
      if (!res.ok) throw new Error('Failed to fetch credentials');
      const data = await res.json();
      setCredentials(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createCredential = useCallback(async ({ name, type, key }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type, key }),
      });
      if (!res.ok) throw new Error('Failed to create credential');
      const created = await res.json();
      setCredentials((prev) => [...prev, created]);
      return created;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCredential = useCallback(async (id, { name, key }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, key }),
      });
      if (!res.ok) throw new Error('Failed to update credential');
      const updated = await res.json();
      setCredentials((prev) =>
        prev.map((c) => (c.id === id ? updated : c))
      );
      return updated;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteCredential = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete credential');
      setCredentials((prev) => prev.filter((c) => c.id !== id));
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const testCredential = useCallback(async (id) => {
    setTestState((prev) => ({ ...prev, [id]: 'testing' }));
    try {
      const res = await fetch(`${API_BASE}/${id}/test`, { method: 'POST' });
      const result = await res.json();
      const state = result.success ? 'ok' : 'fail';
      setTestState((prev) => ({ ...prev, [id]: state }));

      // reset back to idle after 3s
      setTimeout(() => {
        setTestState((prev) => ({ ...prev, [id]: 'idle' }));
      }, 3000);

      return result;
    } catch {
      setTestState((prev) => ({ ...prev, [id]: 'fail' }));
      setTimeout(() => {
        setTestState((prev) => ({ ...prev, [id]: 'idle' }));
      }, 3000);
      return { success: false };
    }
  }, []);

  const getTestState = useCallback(
    (id) => testState[id] ?? 'idle',
    [testState]
  );

  const getMaskedKey = useCallback((key) => {
    if (!key || key.length < 8) return '••••••••';
    return key.slice(0, 3) + '•'.repeat(key.length - 7) + key.slice(-4);
  }, []);

  return {
    credentials,
    loading,
    error,
    fetchCredentials,
    createCredential,
    updateCredential,
    deleteCredential,
    testCredential,
    getTestState,
    getMaskedKey,
  };
}