import BaseNode from './BaseNode';

const HttpIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M12 3C12 3 8 7 8 12C8 17 12 21 12 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M12 3C12 3 16 7 16 12C16 17 12 21 12 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M3 12H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

/**
 * HttpNode
 * data props:
 *  - method      'GET'|'POST'|'PUT'|'PATCH'|'DELETE'
 *  - url         string  e.g. 'https://api.stripe.com/v1/charges'
 *  - auth        'None'|'Bearer'|'Basic'|'API Key'
 *  - status      'idle'|'running'|'success'|'error'
 */
export default function HttpNode({ data = {}, selected }) {
  const {
    method = 'GET',
    url    = '',
    auth   = 'None',
    status = 'idle',
  } = data;

  // Truncate long URLs for display
  const displayUrl = url.length > 28 ? url.slice(0, 28) + '…' : url;
  const methodClass = `node-method node-method--${method.toLowerCase()}`;

  return (
    <BaseNode
      icon={<HttpIcon />}
      label="HTTP Request"
      sublabel={method}
      color="#0EA5E9"
      status={status}
      hasInput
      hasOutput
      selected={selected}
    >
      <div className="node-field">
        <span className="node-field__key">Method</span>
        <span className={methodClass}>{method}</span>
      </div>

      <div className="node-field">
        <span className="node-field__key">URL</span>
        {url
          ? <span className="node-field__value" style={{ fontFamily: 'monospace', fontSize: 10 }}>{displayUrl}</span>
          : <span className="node-field__value node-field__value--dim">No URL set</span>
        }
      </div>

      {auth !== 'None' && (
        <div className="node-field">
          <span className="node-field__key">Auth</span>
          <span className="node-tag">{auth}</span>
        </div>
      )}
    </BaseNode>
  );
}
