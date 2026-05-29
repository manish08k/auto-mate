import BaseNode from './BaseNode';

const TelegramIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22 2L11 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/**
 * TelegramNode
 * data props:
 *  - action   'Send Message' | 'New Message' | 'Send to Channel'
 *  - chatId   string   e.g. '@my_channel' or '1234567890'
 *  - botName  string   e.g. 'FlowOS Bot'
 *  - status   'idle'|'running'|'success'|'error'
 */
export default function TelegramNode({ data = {}, selected }) {
  const {
    action  = 'Send Message',
    chatId  = '',
    botName = '',
    status  = 'idle',
  } = data;

  return (
    <BaseNode
      icon={<TelegramIcon />}
      label="Telegram"
      sublabel={botName || action}
      color="#2AABEE"
      status={status}
      hasInput={action !== 'New Message'}
      hasOutput
      selected={selected}
    >
      <div className="node-field">
        <span className="node-field__key">Action</span>
        <span className="node-field__value">{action}</span>
      </div>

      <div className="node-field">
        <span className="node-field__key">Chat ID</span>
        {chatId
          ? <span className="node-field__value">{chatId}</span>
          : <span className="node-field__value node-field__value--dim">Not set</span>
        }
      </div>
    </BaseNode>
  );
}
