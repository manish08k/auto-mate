import BaseNode from './BaseNode';

const SheetsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M3 9H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M3 15H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M9 9V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

/**
 * SheetsNode
 * data props:
 *  - action      'Append Row' | 'Get Rows' | 'Update Row' | 'New Row'
 *  - spreadsheet string  e.g. 'Q4 Pipeline'
 *  - sheet       string  e.g. 'Sheet1'
 *  - status      'idle'|'running'|'success'|'error'
 */
export default function SheetsNode({ data = {}, selected }) {
  const {
    action      = 'Append Row',
    spreadsheet = '',
    sheet       = 'Sheet1',
    status      = 'idle',
  } = data;

  return (
    <BaseNode
      icon={<SheetsIcon />}
      label="Google Sheets"
      sublabel={spreadsheet || 'No spreadsheet'}
      color="#34A853"
      status={status}
      hasInput={action !== 'New Row' && action !== 'Get Rows'}
      hasOutput
      selected={selected}
    >
      <div className="node-field">
        <span className="node-field__key">Action</span>
        <span className="node-field__value">{action}</span>
      </div>

      <div className="node-field">
        <span className="node-field__key">Sheet</span>
        <span className="node-field__value">{sheet}</span>
      </div>
    </BaseNode>
  );
}
