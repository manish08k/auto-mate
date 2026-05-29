import BaseNode from './BaseNode';

const WebhookIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 3C18 3 19 3.5 19 5C19 6.5 18 7 18 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M15 4.5C15 4.5 16 5 16 6C16 7 15 7.5 15 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M21 12C21 12 20 13 19 13C18 13 17.5 12.5 17 12L13 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 12C3 12 4 11 5 11C6 11 6.5 11.5 7 12L11 17C11 17 11 18.5 10 19.5C9 20.5 7.5 21 6 20C4.5 19 3 17.5 3 16C3 14.5 4 13 4 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 17L14 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

/**
 * WebhookNode
 * data props:
 *  - mode     'Trigger' | 'Response'
 *  - path     string  e.g. '/webhook/new-order'
 *  - method   'GET'|'POST'|'PUT'|'PATCH'|'DELETE'
 *  - status   'idle'|'running'|'success'|'error'
 */
export default function WebhookNode({ data = {}, selected }) {
  const {
    mode   = 'Trigger',
    path   = '/webhook',
    method = 'POST',
    status = 'idle',
  } = data;

  const methodClass = `node-method node-method--${method.toLowerCase()}`;

  return (
    <BaseNode
      icon={<WebhookIcon />}
      label="Webhook"
      sublabel={mode}
      color="#8B5CF6"
      status={status}
      hasInput={mode === 'Response'}
      hasOutput={mode === 'Trigger'}
      selected={selected}
    >
      <div className="node-field">
        <span className="node-field__key">Method</span>
        <span className={methodClass}>{method}</span>
      </div>

      <div className="node-field">
        <span className="node-field__key">Path</span>
        <span className="node-field__value" style={{ fontFamily: 'monospace', fontSize: 10 }}>
          {path}
        </span>
      </div>
    </BaseNode>
  );
}
