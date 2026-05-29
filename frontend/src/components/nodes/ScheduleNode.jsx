import BaseNode from './BaseNode';

const ScheduleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M12 7V12L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/** Maps a basic cron to a human-readable label (covers common cases) */
function cronToHuman(expr) {
  if (!expr) return null;
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return null;
  const [min, hr, dom, mon, dow] = parts;

  if (expr === '* * * * *')     return 'Every minute';
  if (expr === '0 * * * *')     return 'Every hour';
  if (expr === '0 0 * * *')     return 'Daily at midnight';
  if (expr === '0 9 * * *')     return 'Daily at 9:00 AM';
  if (expr === '0 9 * * 1')     return 'Every Monday at 9 AM';
  if (expr === '0 0 1 * *')     return '1st of every month';
  if (expr === '0 0 * * 0')     return 'Every Sunday';
  if (min !== '*' && hr !== '*' && dom === '*' && mon === '*' && dow === '*')
    return `Daily at ${hr.padStart(2, '0')}:${min.padStart(2, '0')}`;
  return null;
}

/**
 * ScheduleNode — trigger-only node (no input handle)
 * data props:
 *  - cron     string  e.g. '0 9 * * 1'
 *  - label    string  optional human override e.g. 'Every Monday'
 *  - tz       string  e.g. 'UTC' | 'America/New_York'
 *  - status   'idle'|'running'|'success'|'error'
 */
export default function ScheduleNode({ data = {}, selected }) {
  const {
    cron   = '0 9 * * *',
    label  = '',
    tz     = 'UTC',
    status = 'idle',
  } = data;

  const human = label || cronToHuman(cron) || 'Custom schedule';

  return (
    <BaseNode
      icon={<ScheduleIcon />}
      label="Schedule"
      sublabel={human}
      color="#F59E0B"
      status={status}
      hasInput={false}
      hasOutput
      selected={selected}
    >
      <div className="node-cron">
        <span className="node-cron__expr">{cron}</span>
        <span className="node-cron__human">{tz}</span>
      </div>
    </BaseNode>
  );
}
