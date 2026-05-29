/**
 * Toggle.jsx — FlowOS UI
 *
 * Sizes: 'sm' | 'md'
 *
 * Usage:
 *   <Toggle checked={enabled} onChange={setEnabled} label="Enable notifications" />
 *   <Toggle checked={val} onChange={set} label="Auto-retry" hint="Retries up to 3 times on failure" />
 *   <Toggle checked={val} onChange={set} disabled />
 */

import { useId } from 'react';

export default function Toggle({
  checked   = false,
  onChange,
  label,
  hint,
  disabled  = false,
  size      = 'md',
  id,
}) {
  const uid      = useId();
  const toggleId = id || uid;

  return (
    <div className={`flowos-toggle-wrap flowos-toggle-wrap--${size} ${disabled ? 'flowos-toggle-wrap--disabled' : ''}`}>
      <button
        id={toggleId}
        role="switch"
        type="button"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange?.(!checked)}
        className={[
          'flowos-toggle',
          `flowos-toggle--${size}`,
          checked  ? 'flowos-toggle--on'       : '',
          disabled ? 'flowos-toggle--disabled' : '',
        ].filter(Boolean).join(' ')}
      >
        <span className="flowos-toggle__thumb" />
        <span className="sr-only">{label}</span>
      </button>

      {(label || hint) && (
        <label htmlFor={toggleId} className="flowos-toggle-wrap__labels">
          {label && <span className="flowos-toggle-wrap__label">{label}</span>}
          {hint  && <span className="flowos-toggle-wrap__hint">{hint}</span>}
        </label>
      )}
    </div>
  );
}
