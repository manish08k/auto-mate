import BaseNode from './BaseNode';

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" fill="currentColor"/>
    <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.978-1.305A9.956 9.956 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
);

/**
 * WhatsAppNode
 * data props:
 *  - action    'Send Message' | 'New Message Received'
 *  - to        string  e.g. '+1 555 000 0000' or 'Group: Team Alerts'
 *  - template  string  message template name
 *  - status    'idle'|'running'|'success'|'error'
 */
export default function WhatsAppNode({ data = {}, selected }) {
  const {
    action   = 'Send Message',
    to       = '',
    template = '',
    status   = 'idle',
  } = data;

  return (
    <BaseNode
      icon={<WhatsAppIcon />}
      label="WhatsApp"
      sublabel={action}
      color="#25D366"
      status={status}
      hasInput={action === 'Send Message'}
      hasOutput
      selected={selected}
    >
      {to && (
        <div className="node-field">
          <span className="node-field__key">To</span>
          <span className="node-field__value">{to}</span>
        </div>
      )}

      {!to && (
        <div className="node-field">
          <span className="node-field__key">To</span>
          <span className="node-field__value node-field__value--dim">Not configured</span>
        </div>
      )}

      {template && (
        <div className="node-field">
          <span className="node-field__key">Template</span>
          <span className="node-field__value">{template}</span>
        </div>
      )}
    </BaseNode>
  );
}
