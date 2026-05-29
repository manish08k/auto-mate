/**
 * nodeTypes.js
 * Import this object and pass it to <ReactFlow nodeTypes={nodeTypes} />
 * so React Flow knows which component to render for each node type.
 *
 * Usage:
 *   import nodeTypes from './nodes/nodeTypes';
 *   <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} />
 */

import GmailNode        from './GmailNode';
import WhatsAppNode     from './WhatsAppNode';
import TelegramNode     from './TelegramNode';
import SheetsNode       from './SheetsNode';
import SlackNode        from './SlackNode';
import WebhookNode      from './WebhookNode';
import HttpNode         from './HttpNode';
import ScheduleNode     from './ScheduleNode';
import IfConditionNode  from './IfConditionNode';

const nodeTypes = {
  gmail:        GmailNode,
  whatsapp:     WhatsAppNode,
  telegram:     TelegramNode,
  sheets:       SheetsNode,
  slack:        SlackNode,
  webhook:      WebhookNode,
  http:         HttpNode,
  schedule:     ScheduleNode,
  ifCondition:  IfConditionNode,
};

export default nodeTypes;

/**
 * Example nodes array for testing on the canvas:
 *
 * const demoNodes = [
 *   {
 *     id: '1', type: 'schedule',
 *     position: { x: 40, y: 100 },
 *     data: { cron: '0 9 * * 1', tz: 'UTC' },
 *   },
 *   {
 *     id: '2', type: 'http',
 *     position: { x: 340, y: 80 },
 *     data: { method: 'POST', url: 'https://api.stripe.com/v1/charges', auth: 'Bearer' },
 *   },
 *   {
 *     id: '3', type: 'ifCondition',
 *     position: { x: 640, y: 80 },
 *     data: { field: '{{response.status}}', operator: 'equals', value: '200' },
 *   },
 *   {
 *     id: '4', type: 'gmail',
 *     position: { x: 940, y: 40 },
 *     data: { trigger: 'Send Email', account: 'alerts@startup.com', status: 'success' },
 *   },
 *   {
 *     id: '5', type: 'slack',
 *     position: { x: 940, y: 160 },
 *     data: { action: 'Send Message', channel: '#errors', workspace: 'Acme Inc', status: 'error' },
 *   },
 * ];
 */
