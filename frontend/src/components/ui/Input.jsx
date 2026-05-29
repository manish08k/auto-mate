/**
 * Input.jsx — FlowOS UI
 *
 * Types:    'text' | 'password' | 'email' | 'number' | 'search' | 'url'
 * States:   default, focused, error, disabled, readonly
 *
 * Usage:
 *   <Input label="API Key" placeholder="sk-…" />
 *   <Input label="Email" type="email" hint="We'll never share your email." />
 *   <Input label="Webhook URL" error="Invalid URL format" />
 *   <Input type="search" placeholder="Search workflows…" prefix={<SearchIcon />} />
 *   <Input label="Timeout" suffix="ms" type="number" />
 */

import { useState } from 'react';

const EyeIcon = ({ open }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    {open
      ? <><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></>
      : <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
    }
  </svg>
);

export default function Input({
  label,
  hint,
  error,
  type        = 'text',
  prefix      = null,
  suffix      = null,
  disabled    = false,
  readonly    = false,
  id,
  className   = '',
  ...rest
}) {
  const [showPwd, setShowPwd] = useState(false);
  const inputId   = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  const inputType = type === 'password' ? (showPwd ? 'text' : 'password') : type;

  return (
    <div className={`flowos-field ${className}`}>
      {label && (
        <label htmlFor={inputId} className="flowos-field__label">
          {label}
        </label>
      )}

      <div className={[
        'flowos-input-wrap',
        error    ? 'flowos-input-wrap--error'    : '',
        disabled ? 'flowos-input-wrap--disabled' : '',
      ].filter(Boolean).join(' ')}>

        {prefix && <span className="flowos-input-wrap__affix flowos-input-wrap__affix--pre">{prefix}</span>}

        <input
          id={inputId}
          type={inputType}
          disabled={disabled}
          readOnly={readonly}
          className="flowos-input"
          {...rest}
        />

        {type === 'password' && (
          <button
            type="button"
            tabIndex={-1}
            className="flowos-input-wrap__affix flowos-input-wrap__affix--post flowos-input-wrap__eye"
            onClick={() => setShowPwd(v => !v)}
          >
            <EyeIcon open={showPwd} />
          </button>
        )}

        {suffix && type !== 'password' && (
          <span className="flowos-input-wrap__affix flowos-input-wrap__affix--post">{suffix}</span>
        )}
      </div>

      {error && <span className="flowos-field__error">{error}</span>}
      {!error && hint && <span className="flowos-field__hint">{hint}</span>}
    </div>
  );
}
