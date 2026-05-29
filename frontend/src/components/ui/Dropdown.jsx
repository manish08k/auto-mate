/**
 * Dropdown.jsx — FlowOS UI
 *
 * A lightweight select replacement. Keyboard navigable (↑↓ Enter Escape).
 *
 * Usage:
 *   <Dropdown
 *     label="Trigger"
 *     value={selected}
 *     onChange={setSelected}
 *     options={[
 *       { value: 'new_email',    label: 'New Email' },
 *       { value: 'new_match',   label: 'New Email Matching', hint: 'With filter' },
 *       { value: 'send',        label: 'Send Email' },
 *       { value: 'old_trigger', label: 'Legacy Trigger', disabled: true },
 *     ]}
 *   />
 *
 *   // With groups:
 *   options={[
 *     { group: 'Triggers' },
 *     { value: 'new_email', label: 'New Email' },
 *     { group: 'Actions' },
 *     { value: 'send', label: 'Send Email' },
 *   ]}
 */

import { useState, useRef, useEffect, useId } from 'react';

const ChevronIcon = ({ open }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
    style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
    <path d="M6 9l6 6 6-6"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M20 6L9 17l-5-5"/>
  </svg>
);

export default function Dropdown({
  label,
  hint,
  error,
  value,
  onChange,
  options   = [],
  placeholder = 'Select…',
  disabled  = false,
  id,
}) {
  const [open, setOpen]       = useState(false);
  const [cursor, setCursor]   = useState(-1);
  const wrapRef               = useRef(null);
  const listRef               = useRef(null);
  const uid                   = useId();
  const fieldId               = id || uid;

  const selectableOptions = options.filter(o => !o.group && !o.disabled);
  const selected = options.find(o => o.value === value);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (!wrapRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!open) { setOpen(true); setCursor(0); return; }
      const opt = selectableOptions[cursor];
      if (opt) { onChange?.(opt.value); setOpen(false); }
    }
    if (e.key === 'Escape') { setOpen(false); }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) { setOpen(true); setCursor(0); return; }
      setCursor(c => Math.min(c + 1, selectableOptions.length - 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor(c => Math.max(c - 1, 0));
    }
  };

  return (
    <div className={`flowos-field ${error ? 'flowos-field--error' : ''}`} ref={wrapRef}>
      {label && <label htmlFor={fieldId} className="flowos-field__label">{label}</label>}

      <button
        id={fieldId}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={[
          'flowos-dropdown-trigger',
          open     ? 'flowos-dropdown-trigger--open'  : '',
          error    ? 'flowos-dropdown-trigger--error'  : '',
          disabled ? 'flowos-dropdown-trigger--disabled' : '',
        ].filter(Boolean).join(' ')}
        onClick={() => { if (!disabled) { setOpen(o => !o); setCursor(0); } }}
        onKeyDown={handleKeyDown}
      >
        <span className={selected ? 'flowos-dropdown-trigger__value' : 'flowos-dropdown-trigger__placeholder'}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <ul
          ref={listRef}
          role="listbox"
          className="flowos-dropdown-menu"
        >
          {options.map((opt, i) => {
            if (opt.group) {
              return (
                <li key={`group-${i}`} className="flowos-dropdown-menu__group" role="presentation">
                  {opt.group}
                </li>
              );
            }

            const selIdx = selectableOptions.indexOf(opt);
            const isActive = opt.value === value;
            const isCursor = selIdx === cursor;

            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={isActive}
                aria-disabled={opt.disabled}
                className={[
                  'flowos-dropdown-menu__item',
                  isActive  ? 'flowos-dropdown-menu__item--active'  : '',
                  isCursor  ? 'flowos-dropdown-menu__item--cursor'  : '',
                  opt.disabled ? 'flowos-dropdown-menu__item--disabled' : '',
                ].filter(Boolean).join(' ')}
                onMouseEnter={() => setCursor(selIdx)}
                onClick={() => {
                  if (opt.disabled) return;
                  onChange?.(opt.value);
                  setOpen(false);
                }}
              >
                <span className="flowos-dropdown-menu__item-text">
                  <span>{opt.label}</span>
                  {opt.hint && <span className="flowos-dropdown-menu__item-hint">{opt.hint}</span>}
                </span>
                {isActive && <CheckIcon />}
              </li>
            );
          })}
        </ul>
      )}

      {error && <span className="flowos-field__error">{error}</span>}
      {!error && hint && <span className="flowos-field__hint">{hint}</span>}
    </div>
  );
}
