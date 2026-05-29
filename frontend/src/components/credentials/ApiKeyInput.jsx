/**
 * ApiKeyInput.jsx — FlowOS Credentials
 *
 * Generic API key connector used by services that don't have OAuth:
 * Stripe, OpenAI, Anthropic, Airtable, Notion, Resend, Twilio, etc.
 *
 * Features:
 *  - Show/hide key toggle
 *  - Masked display of saved key (only last 4 chars visible)
 *  - Optional key prefix validation (e.g. must start with "sk-")
 *  - Optional "where to find this key" help link
 *  - Test connection button that fires onTest() → resolves true/false
 *
 * Usage:
 *   <ApiKeyInput
 *     serviceName="OpenAI"
 *     serviceIcon={<OpenAIIcon />}
 *     serviceColor="#10A37F"
 *     description="Used for AI-powered nodes. Keys start with sk-."
 *     keyPrefix="sk-"
 *     helpUrl="https://platform.openai.com/api-keys"
 *     helpLabel="Find your key →"
 *     status="idle"
 *     onSave={handleSave}
 *     onTest={handleTest}
 *     onDisconnect={handleDisconnect}
 *   />
 *
 *   // Already saved (show masked key):
 *   <ApiKeyInput
 *     ...
 *     status="connected"
 *     maskedKey="sk-…1a2b"
 *   />
 *
 * onSave(key: string) → Promise<void>
 * onTest(key: string) → Promise<boolean>
 */

import { useState, useId } from 'react';
import CredentialShell     from './CredentialShell';

/* ── Icons ── */
const KeyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="7.5" cy="15.5" r="5.5"/>
    <path d="M21 2l-9.6 9.6M15.5 7.5l3 3"/>
  </svg>
);

const EyeIcon = ({ open }) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {open
      ? <><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7"/><circle cx="12" cy="12" r="3"/></>
      : <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
    }
  </svg>
);

const Spinner = () => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none"
    style={{ animation: 'cred-spin 0.7s linear infinite' }}>
    <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.25"/>
    <path d="M7 1.5A5.5 5.5 0 0112.5 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const CheckSmall = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M20 6L9 17l-5-5"/>
  </svg>
);

export default function ApiKeyInput({
  /* Branding */
  serviceName   = 'API Key',
  serviceIcon,
  serviceColor  = '#525252',
  description   = '',
  placeholder   = 'Paste your API key…',
  keyPrefix     = '',       // e.g. "sk-" — validated client-side
  helpUrl       = '',
  helpLabel     = 'Where to find this →',

  /* State */
  status        = 'idle',   // 'idle'|'saving'|'testing'|'connected'|'error'
  maskedKey     = '',       // e.g. "sk-…ef91" shown when connected
  errorMessage  = '',

  /* Callbacks */
  onSave,
  onTest,
  onDisconnect,
}) {
  const [key,       setKey]       = useState('');
  const [showKey,   setShowKey]   = useState(false);
  const [testState, setTestState] = useState('idle'); // 'idle'|'testing'|'ok'|'fail'
  const inputId = useId();

  const isConnected = status === 'connected';
  const isSaving    = status === 'saving';

  /* Prefix validation */
  const prefixError = keyPrefix && key.length > 0 && !key.startsWith(keyPrefix)
    ? `Key must start with "${keyPrefix}"`
    : '';

  const canSave = key.length > 8 && !prefixError && !isSaving;

  /* Test connection */
  const handleTest = async () => {
    if (!onTest) return;
    setTestState('testing');
    try {
      const ok = await onTest(key || maskedKey);
      setTestState(ok ? 'ok' : 'fail');
      setTimeout(() => setTestState('idle'), 3000);
    } catch {
      setTestState('fail');
      setTimeout(() => setTestState('idle'), 3000);
    }
  };

  return (
    <CredentialShell
      serviceName={serviceName}
      serviceIcon={serviceIcon ?? <KeyIcon />}
      serviceColor={serviceColor}
      description={description}
      status={status}
      accountName={isConnected ? maskedKey : ''}
      errorMessage={errorMessage}
      scopes={[]}
      onDisconnect={onDisconnect}
      /* Suppress the default connect button — we render our own form */
      onConnect={undefined}
    >
      {/* ── Key input form ── */}
      {!isConnected ? (
        <div className="apikey-form">
          {/* Input row */}
          <div className="apikey-input-wrap">
            <div className="apikey-input-wrap__icon"><KeyIcon /></div>
            <input
              id={inputId}
              type={showKey ? 'text' : 'password'}
              value={key}
              onChange={e => setKey(e.target.value)}
              placeholder={placeholder}
              autoComplete="off"
              spellCheck={false}
              className={`apikey-input ${prefixError ? 'apikey-input--error' : ''}`}
            />
            <button
              type="button"
              className="apikey-input-wrap__eye"
              onClick={() => setShowKey(v => !v)}
              tabIndex={-1}
              aria-label={showKey ? 'Hide key' : 'Show key'}
            >
              <EyeIcon open={showKey} />
            </button>
          </div>

          {/* Prefix validation error */}
          {prefixError && (
            <span className="apikey-form__error">{prefixError}</span>
          )}

          {/* Help link */}
          {helpUrl && (
            <a
              href={helpUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="apikey-form__help"
            >
              {helpLabel}
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </a>
          )}

          {/* Actions */}
          <div className="apikey-form__actions">
            {onTest && (
              <button
                type="button"
                className={`cred-btn cred-btn--ghost apikey-test-btn apikey-test-btn--${testState}`}
                onClick={handleTest}
                disabled={key.length < 4 || testState === 'testing' || !!prefixError}
              >
                {testState === 'testing' && <><Spinner /> Testing…</>}
                {testState === 'ok'      && <><CheckSmall /> Connected</>}
                {testState === 'fail'    && <>Test failed</>}
                {testState === 'idle'    && <>Test connection</>}
              </button>
            )}

            <button
              type="button"
              className="cred-btn cred-btn--primary"
              style={{ '--service-color': serviceColor }}
              onClick={() => onSave?.(key)}
              disabled={!canSave}
            >
              {isSaving ? <><Spinner /> Saving…</> : 'Save key'}
            </button>
          </div>
        </div>
      ) : (
        /* ── Connected state: show masked key + test option ── */
        <div className="apikey-saved">
          <div className="apikey-saved__row">
            <KeyIcon />
            <span className="apikey-saved__mask">{maskedKey}</span>
            {onTest && (
              <button
                type="button"
                className={`cred-btn cred-btn--ghost apikey-test-btn apikey-test-btn--${testState}`}
                onClick={handleTest}
                disabled={testState === 'testing'}
                style={{ marginLeft: 'auto' }}
              >
                {testState === 'testing' && <><Spinner /> Testing…</>}
                {testState === 'ok'      && <><CheckSmall /> OK</>}
                {testState === 'fail'    && <>Failed</>}
                {testState === 'idle'    && <>Test</>}
              </button>
            )}
          </div>
        </div>
      )}
    </CredentialShell>
  );
}