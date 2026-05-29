/**
 * ConnectSlack.jsx — FlowOS Credentials
 *
 * Slack uses workspace-level OAuth (not user-level).
 * Shows the workspace name + icon after connection.
 * Supports scope selection before connecting.
 *
 * Usage:
 *   <ConnectSlack
 *     status="idle"
 *     onConnect={handleConnect}
 *     onDisconnect={handleDisconnect}
 *   />
 *
 *   // Connected:
 *   <ConnectSlack
 *     status="connected"
 *     accountName="Acme Inc"
 *     workspaceUrl="acmeinc.slack.com"
 *     onDisconnect={handleDisconnect}
 *   />
 *
 * workspaceUrl: shown as secondary info under the workspace name.
 */

import CredentialShell from './CredentialShell';

/* ── Slack hash-mark logo — brand color ── */
const SlackIcon = () => (
  <svg width="16" height="16" viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.712.133a5.381 5.381 0 00-5.376 5.387 5.381 5.381 0 005.376 5.386h5.376V5.52A5.381 5.381 0 0019.712.133m0 14.365H5.376A5.381 5.381 0 000 19.884a5.381 5.381 0 005.376 5.387h14.336a5.381 5.381 0 005.376-5.387 5.381 5.381 0 00-5.376-5.386" fill="#36C5F0"/>
    <path d="M53.76 19.884a5.381 5.381 0 00-5.376-5.386 5.381 5.381 0 00-5.376 5.386v5.387h5.376a5.381 5.381 0 005.376-5.387m-14.336 0V5.52A5.381 5.381 0 0034.048.133a5.381 5.381 0 00-5.376 5.387v14.364a5.381 5.381 0 005.376 5.387 5.381 5.381 0 005.376-5.387" fill="#2EB67D"/>
    <path d="M34.048 54a5.381 5.381 0 005.376-5.387 5.381 5.381 0 00-5.376-5.386h-5.376v5.386A5.381 5.381 0 0034.048 54m0-14.365h14.336a5.381 5.381 0 005.376-5.387 5.381 5.381 0 00-5.376-5.386H34.048a5.381 5.381 0 00-5.376 5.386 5.381 5.381 0 005.376 5.387" fill="#ECB22E"/>
    <path d="M0 34.248a5.381 5.381 0 005.376 5.387 5.381 5.381 0 005.376-5.387v-5.386H5.376A5.381 5.381 0 000 34.248m14.336 0v14.365A5.381 5.381 0 0019.712 54a5.381 5.381 0 005.376-5.387V34.248a5.381 5.381 0 00-5.376-5.386 5.381 5.381 0 00-5.376 5.386" fill="#E01E5A"/>
  </svg>
);

/* ── Scope definitions shown as pills ── */
const SLACK_SCOPES = [
  'Post messages to channels',
  'Read channel history',
  'Send direct messages',
  'List channels & members',
];

export default function ConnectSlack({
  status        = 'idle',
  accountName   = '',       // workspace name, e.g. "Acme Inc"
  workspaceUrl  = '',       // e.g. "acmeinc.slack.com"
  errorMessage  = 'Slack authorization failed. Make sure you approved the required permissions.',
  onConnect,
  onDisconnect,
  onReconnect,
}) {
  /* Compose the display name: show workspace URL as secondary if available */
  const displayName = workspaceUrl
    ? `${accountName} · ${workspaceUrl}`
    : accountName;

  return (
    <CredentialShell
      serviceName="Slack"
      serviceIcon={<SlackIcon />}
      serviceColor="#E01E5A"
      description="Connect your Slack workspace to send messages, post to channels, and trigger automations."
      status={status}
      accountName={displayName}
      errorMessage={errorMessage}
      scopes={status === 'connected' ? SLACK_SCOPES : []}
      onConnect={onConnect}
      onDisconnect={onDisconnect}
      onReconnect={onReconnect}
    />
  );
}