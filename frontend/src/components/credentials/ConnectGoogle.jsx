/**
 * ConnectGoogle.jsx — FlowOS Credentials
 *
 * Handles Google OAuth for Gmail, Sheets, Drive, Calendar, etc.
 * Scopes are declared per-service and shown as human-readable
 * permission pills after connection.
 *
 * Usage:
 *   <ConnectGoogle
 *     services={['gmail', 'sheets']}
 *     status="idle"
 *     onConnect={handleConnect}
 *     onDisconnect={handleDisconnect}
 *   />
 *
 *   // Already connected:
 *   <ConnectGoogle
 *     services={['gmail', 'sheets']}
 *     status="connected"
 *     accountName="hello@startup.com"
 *     accountAvatar="https://…"
 *     onDisconnect={handleDisconnect}
 *     onReconnect={handleReconnect}
 *   />
 *
 * services: array of keys from GOOGLE_SERVICES below.
 * Each service declares human label + OAuth scope strings.
 */

import CredentialShell from './CredentialShell';

/* ── Service → human label + scope descriptions ── */
const GOOGLE_SERVICES = {
  gmail: {
    label: 'Gmail',
    permissions: ['Gmail — read emails', 'Gmail — send emails'],
  },
  sheets: {
    label: 'Sheets',
    permissions: ['Google Sheets — read & write'],
  },
  drive: {
    label: 'Drive',
    permissions: ['Google Drive — read files'],
  },
  calendar: {
    label: 'Calendar',
    permissions: ['Google Calendar — read & write'],
  },
  contacts: {
    label: 'Contacts',
    permissions: ['Google Contacts — read'],
  },
};

/* ── Google "G" logo — exact brand colors ── */
const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export default function ConnectGoogle({
  services     = ['gmail'],
  status       = 'idle',
  accountName  = '',
  accountAvatar = '',
  errorMessage = 'Authorization was denied or the popup was closed.',
  onConnect,
  onDisconnect,
  onReconnect,
}) {
  /* Collect human-readable permission labels for all requested services */
  const scopes = services.flatMap(key => GOOGLE_SERVICES[key]?.permissions ?? []);

  /* Human list of service names for the description */
  const serviceNames = services
    .map(k => GOOGLE_SERVICES[k]?.label ?? k)
    .join(', ');

  return (
    <CredentialShell
      serviceName="Google"
      serviceIcon={<GoogleIcon />}
      serviceColor="#4285F4"
      description={`Authorize access to ${serviceNames} to use these nodes in your workflows.`}
      status={status}
      accountName={accountName}
      accountAvatar={accountAvatar}
      errorMessage={errorMessage}
      scopes={status === 'connected' ? scopes : []}
      onConnect={onConnect}
      onDisconnect={onDisconnect}
      onReconnect={onReconnect}
    />
  );
}