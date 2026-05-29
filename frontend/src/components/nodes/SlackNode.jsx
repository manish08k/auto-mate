import BaseNode from './BaseNode';

const SlackIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14.5 10C13.67 10 13 9.33 13 8.5V4.5C13 3.67 13.67 3 14.5 3C15.33 3 16 3.67 16 4.5C16 5.33 15.33 6 14.5 6H10C9.17 6 8.5 5.33 8.5 4.5C8.5 3.67 9.17 3 10 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 13.5C10 14.33 9.33 15 8.5 15H4.5C3.67 15 3 14.33 3 13.5C3 12.67 3.67 12 4.5 12C5.33 12 6 12.67 6 13.5V10C6 9.17 6.67 8.5 7.5 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 13.5C14 12.67 14.67 12 15.5 12H19.5C20.33 12 21 12.67 21 13.5C21 14.33 20.33 15 19.5 15C18.67 15 18 14.33 18 13.5V17.5C18 18.33 17.33 19 16.5 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10.5 14C11.33 14 12 14.67 12 15.5V19.5C12 20.33 11.33 21 10.5 21C9.67 21 9 20.33 9 19.5C9 18.67 9.67 18 10.5 18H14.5C15.33 18 16 18.67 16 19.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/**
 * SlackNode
 * data props:
 *  - action    'Send Message' | 'New Message' | 'Send DM' | 'Create Channel'
 *  - channel   string  e.g. '#alerts' or '@john'
 *  - workspace string  e.g. 'Acme Inc'
 *  - status    'idle'|'running'|'success'|'error'
 */
export default function SlackNode({ data = {}, selected }) {
  const {
    action    = 'Send Message',
    channel   = '',
    workspace = '',
    status    = 'idle',
  } = data;

  return (
    <BaseNode
      icon={<SlackIcon />}
      label="Slack"
      sublabel={workspace || action}
      color="#E01E5A"
      status={status}
      hasInput={action === 'Send Message' || action === 'Send DM'}
      hasOutput
      selected={selected}
    >
      <div className="node-field">
        <span className="node-field__key">Action</span>
        <span className="node-field__value">{action}</span>
      </div>

      <div className="node-field">
        <span className="node-field__key">Channel</span>
        {channel
          ? <span className="node-field__value">{channel}</span>
          : <span className="node-field__value node-field__value--dim">Not set</span>
        }
      </div>
    </BaseNode>
  );
}
