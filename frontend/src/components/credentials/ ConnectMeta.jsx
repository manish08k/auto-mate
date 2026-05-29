/**
 * ConnectMeta.jsx — FlowOS Credentials
 *
 * Meta's Graph API covers Facebook Pages, Instagram Business,
 * and WhatsApp Business. The user selects which products they
 * need before connecting; this drives the scope request.
 *
 * Usage:
 *   <ConnectMeta
 *     products={['whatsapp', 'instagram']}
 *     status="idle"
 *     onConnect={handleConnect}
 *     onDisconnect={handleDisconnect}
 *   />
 *
 *   // Connected:
 *   <ConnectMeta
 *     products={['whatsapp']}
 *     status="connected"
 *     accountName="Acme Business · +1 555 000 0000"
 *     onDisconnect={handleDisconnect}
 *   />
 *
 * products: 'whatsapp' | 'instagram' | 'facebook'
 */

import { useState } from 'react';
import CredentialShell from './CredentialShell';

/* ── Meta "M" logo ── */
const MetaIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.002 12c0-5.523 4.476-10 9.999-10 5.522 0 9.999 4.477 9.999 10s-4.477 10-9.999 10C6.478 22 2.002 17.523 2.002 12z" fill="#0866FF"/>
    <path d="M13.5 19.5v-6h2l.5-2.5H13.5V9.5c0-.667.333-1 1-1H16V6h-2c-1.667 0-2.5.833-2.5 2.5V11H9.5V13.5H11.5v6H13.5z" fill="white"/>
  </svg>
);

/* ── Product scopes ── */
const META_PRODUCTS = {
  whatsapp: {
    label: 'WhatsApp Business',
    permissions: ['WhatsApp — send messages', 'WhatsApp — manage templates'],
  },
  instagram: {
    label: 'Instagram Business',
    permissions: ['Instagram — read comments', 'Instagram — send DMs'],
  },
  facebook: {
    label: 'Facebook Pages',
    permissions: ['Facebook Pages — post content', 'Facebook Pages — read messages'],
  },
};

/* ── Checkbox for product selection ── */
function ProductCheckbox({ productKey, label, checked, onChange, disabled }) {
  return (
    <label className={`meta-product-row ${disabled ? 'meta-product-row--disabled' : ''}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(productKey, e.target.checked)}
        disabled={disabled}
        className="meta-product-row__input"
      />
      <span className="meta-product-row__check" aria-hidden="true">
        {checked && (
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        )}
      </span>
      <span className="meta-product-row__label">{label}</span>
    </label>
  );
}

export default function ConnectMeta({
  products      = ['whatsapp'],   // initial selection
  status        = 'idle',
  accountName   = '',
  errorMessage  = 'Meta authorization failed. Make sure you granted all required permissions.',
  onConnect,
  onDisconnect,
  onReconnect,
}) {
  const [selected, setSelected] = useState(() => new Set(products));
  const isConnected  = status === 'connected';
  const isConnecting = status === 'connecting';

  const toggleProduct = (key, on) => {
    setSelected(prev => {
      const next = new Set(prev);
      on ? next.add(key) : next.delete(key);
      return next;
    });
  };

  const scopes = [...selected].flatMap(k => META_PRODUCTS[k]?.permissions ?? []);

  /* Pass selected products into the connect handler */
  const handleConnect = () => onConnect?.([...selected]);

  return (
    <CredentialShell
      serviceName="Meta"
      serviceIcon={<MetaIcon />}
      serviceColor="#0866FF"
      description="Connect your Meta Business account to use WhatsApp, Instagram, and Facebook nodes."
      status={status}
      accountName={accountName}
      errorMessage={errorMessage}
      scopes={isConnected ? scopes : []}
      onConnect={handleConnect}
      onDisconnect={onDisconnect}
      onReconnect={onReconnect}
    >
      {/* Product selector — only shown when not yet connected */}
      {!isConnected && (
        <div className="meta-products">
          <span className="meta-products__label">Products to connect</span>
          <div className="meta-products__list">
            {Object.entries(META_PRODUCTS).map(([key, { label }]) => (
              <ProductCheckbox
                key={key}
                productKey={key}
                label={label}
                checked={selected.has(key)}
                onChange={toggleProduct}
                disabled={isConnecting}
              />
            ))}
          </div>
          {selected.size === 0 && (
            <span className="meta-products__warn">Select at least one product to continue.</span>
          )}
        </div>
      )}
    </CredentialShell>
  );
}