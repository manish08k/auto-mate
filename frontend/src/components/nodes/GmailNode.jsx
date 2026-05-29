import BaseNode from './BaseNode';

const GmailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 6L12 13L22 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/**
 * GmailNode
 * data props:
 *  - trigger     'New Email' | 'New Email Matching' | 'Send Email'
 *  - account     string  e.g. 'hello@startup.com'
 *  - filter      string  e.g. 'from:boss@corp.com'
 *  - status      'idle'|'running'|'success'|'error'
 */
export default function GmailNode({ data = {}, selected }) {
  const {
    trigger  = 'New Email',
    account  = 'Not connected',
    filter   = '',
    status   = 'idle',
  } = data;

  return (
    <BaseNode
      icon={<GmailIcon />}
      label="Gmail"
      sublabel={account}
      color="#EA4335"
      status={status}
      hasInput={trigger === 'Send Email'}
      hasOutput
      selected={selected}
    >
      <div className="node-field">
        <span className="node-field__key">Trigger</span>
        <span className="node-field__value">{trigger}</span>
      </div>

      {filter && (
        <div className="node-field">
          <span className="node-field__key">Filter</span>
          <span className="node-field__value">{filter}</span>
        </div>
      )}

      {!filter && trigger === 'New Email Matching' && (
        <div className="node-field">
          <span className="node-field__key">Filter</span>
          <span className="node-field__value node-field__value--dim">No filter set</span>
        </div>
      )}
    </BaseNode>
  );
}
