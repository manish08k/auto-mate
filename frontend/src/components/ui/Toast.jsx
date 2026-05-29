/**
 * Toast.jsx — FlowOS UI
 *
 * Self-contained toast system. Includes:
 *   - <ToastProvider>   — wrap your app root
 *   - useToast()        — hook to fire toasts from anywhere
 *
 * Toast types: 'default' | 'success' | 'error' | 'warning' | 'loading'
 *
 * Usage:
 *   // 1. Wrap app
 *   <ToastProvider><App /></ToastProvider>
 *
 *   // 2. Use anywhere
 *   const toast = useToast();
 *   toast.show('Workflow saved');
 *   toast.success('Run completed in 1.2s');
 *   toast.error('Connection failed');
 *   toast.warning('Rate limit approaching');
 *   const id = toast.loading('Deploying…');
 *   toast.dismiss(id);          // dismiss a specific toast
 *   toast.update(id, { type: 'success', message: 'Deployed!' });
 */

import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

/* ── Icons ── */
const icons = {
  success: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M20 6L9 17l-5-5"/>
    </svg>
  ),
  error: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M18 6L6 18M6 6l12 12"/>
    </svg>
  ),
  warning: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    </svg>
  ),
  loading: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
      style={{ animation: 'btn-spin 0.7s linear infinite' }}>
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.3"/>
      <path d="M7 1.5A5.5 5.5 0 0 1 12.5 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
};

/* ── Context ── */
const ToastCtx = createContext(null);

let _nextId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts(ts => ts.map(t => t.id === id ? { ...t, exiting: true } : t));
    setTimeout(() => setToasts(ts => ts.filter(t => t.id !== id)), 300);
  }, []);

  const show = useCallback((message, opts = {}) => {
    const id      = _nextId++;
    const type    = opts.type ?? 'default';
    const duration = type === 'loading' ? null : (opts.duration ?? 4000);

    setToasts(ts => [...ts, { id, message, type, duration, exiting: false }]);

    if (duration) setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  const success = useCallback((msg, opts) => show(msg, { ...opts, type: 'success' }), [show]);
  const error   = useCallback((msg, opts) => show(msg, { ...opts, type: 'error'   }), [show]);
  const warning = useCallback((msg, opts) => show(msg, { ...opts, type: 'warning' }), [show]);
  const loading = useCallback((msg, opts) => show(msg, { ...opts, type: 'loading' }), [show]);

  const update = useCallback((id, patch) => {
    setToasts(ts => ts.map(t => t.id === id ? { ...t, ...patch, exiting: false } : t));
    if (patch.type && patch.type !== 'loading') {
      const duration = patch.duration ?? 4000;
      setTimeout(() => dismiss(id), duration);
    }
  }, [dismiss]);

  return (
    <ToastCtx.Provider value={{ show, success, error, warning, loading, dismiss, update }}>
      {children}
      {createPortal(
        <div className="flowos-toast-region" aria-live="polite" aria-atomic="false">
          {toasts.map(t => (
            <Toast key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
          ))}
        </div>,
        document.body
      )}
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

/* ── Single Toast ── */
function Toast({ toast, onDismiss }) {
  const { id, message, type, exiting } = toast;

  return (
    <div
      role="status"
      className={[
        'flowos-toast',
        `flowos-toast--${type}`,
        exiting ? 'flowos-toast--exit' : 'flowos-toast--enter',
      ].join(' ')}
    >
      {type !== 'default' && (
        <span className={`flowos-toast__icon flowos-toast__icon--${type}`}>
          {icons[type]}
        </span>
      )}
      <span className="flowos-toast__message">{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="flowos-toast__close"
        aria-label="Dismiss"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    </div>
  );
}

export default Toast;
