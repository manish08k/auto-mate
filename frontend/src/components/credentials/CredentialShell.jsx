/**
 * CredentialShell.jsx — FlowOS internal base
 *
 * Renders the consistent credential card frame used by every
 * OAuth and API key connector. Not exported to consumers directly —
 * each connector wraps this.
 *
 * States:
 *   'idle'        — not connected, ready to connect
 *   'connecting'  — OAuth popup open / API call in flight
 *   'connected'   — account linked, showing account info
 *   'error'       — connection failed, showing reason
 *   'expired'     — token expired, needs re-auth
 */

const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M20 6L9 17l-5-5"/>
  </svg>
);

const AlertIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
  </svg>
);

const UnlinkIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
    <line x1="3" y1="3" x2="21" y2="21"/>
  </svg>
);

const RefreshIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 4v6h-6"/>
    <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
  </svg>
);

const Spinner = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
    style={{ animation: 'cred-spin 0.7s linear infinite', flexShrink: 0 }}>
    <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.25"/>
    <path d="M7 1.5A5.5 5.5 0 0112.5 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export default function CredentialShell({
  /* Branding */
  serviceName,        // e.g. "Google"
  serviceIcon,        // ReactElement — the service logo SVG
  serviceColor,       // hex accent, e.g. "#4285F4"
  description,        // e.g. "Connect your Google account to use Gmail, Sheets, and Drive nodes."

  /* State */
  status        = 'idle',   // 'idle'|'connecting'|'connected'|'error'|'expired'
  accountName   = '',       // e.g. "hello@startup.com"
  accountAvatar = '',       // URL, optional
  errorMessage  = '',

  /* Scopes granted */
  scopes        = [],       // e.g. ['Gmail (read)', 'Gmail (send)', 'Sheets']

  /* Actions */
  onConnect,
  onDisconnect,
  onReconnect,

  /* Optional extra content (API key form, scope picker, etc.) */
  children,
}) {
  const isConnecting = status === 'connecting';
  const isConnected  = status === 'connected';
  const isError      = status === 'error';
  const isExpired    = status === 'expired';

  return (
    <div className="cred-card">
      {/* ── Header ── */}
      <div className="cred-card__header">
        <div
          className="cred-card__service-icon"
          style={{ background: `${serviceColor}12`, color: serviceColor }}
        >
          {serviceIcon}
        </div>

        <div className="cred-card__meta">
          <span className="cred-card__name">{serviceName}</span>
          {description && (
            <span className="cred-card__desc">{description}</span>
          )}
        </div>

        {/* Status pill */}
        <span className={`cred-status cred-status--${status}`}>
          {isConnected  && <><CheckIcon /> Connected</>}
          {isConnecting && <><Spinner  /> Connecting…</>}
          {isError      && <><AlertIcon/> Failed</>}
          {isExpired    && <><AlertIcon/> Expired</>}
          {status === 'idle' && 'Not connected'}
        </span>
      </div>

      {/* ── Connected account row ── */}
      {isConnected && accountName && (
        <div className="cred-account">
          {accountAvatar
            ? <img src={accountAvatar} alt="" className="cred-account__avatar" />
            : (
              <div className="cred-account__initials" style={{ background: `${serviceColor}1A`, color: serviceColor }}>
                {accountName.charAt(0).toUpperCase()}
              </div>
            )
          }
          <span className="cred-account__name">{accountName}</span>
        </div>
      )}

      {/* ── Scopes granted ── */}
      {isConnected && scopes.length > 0 && (
        <div className="cred-scopes">
          <span className="cred-scopes__label">Permissions</span>
          <div className="cred-scopes__list">
            {scopes.map(s => (
              <span key={s} className="cred-scope-pill">
                <CheckIcon /> {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Error message ── */}
      {(isError || isExpired) && errorMessage && (
        <div className="cred-error-banner">
          <AlertIcon />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ── Extra content slot (API key input, scope checkboxes, etc.) ── */}
      {children && (
        <div className="cred-card__body">
          {children}
        </div>
      )}

      {/* ── Footer actions ── */}
      <div className="cred-card__footer">
        {(status === 'idle' || isError) && (
          <button
            className="cred-btn cred-btn--primary"
            onClick={onConnect}
            disabled={isConnecting}
            style={{ '--service-color': serviceColor }}
          >
            {isConnecting ? <Spinner /> : serviceIcon}
            {isConnecting ? 'Connecting…' : `Connect ${serviceName}`}
          </button>
        )}

        {isExpired && (
          <button
            className="cred-btn cred-btn--primary"
            onClick={onReconnect ?? onConnect}
            style={{ '--service-color': serviceColor }}
          >
            <RefreshIcon /> Reconnect {serviceName}
          </button>
        )}

        {isConnected && (
          <>
            <button className="cred-btn cred-btn--ghost" onClick={onReconnect ?? onConnect}>
              <RefreshIcon /> Re-authenticate
            </button>
            <button className="cred-btn cred-btn--danger" onClick={onDisconnect}>
              <UnlinkIcon /> Disconnect
            </button>
          </>
        )}
      </div>
    </div>
  );
}