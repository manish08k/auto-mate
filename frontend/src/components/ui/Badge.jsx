/**
 * Badge.jsx — FlowOS UI
 *
 * Variants: 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple'
 * Sizes:    'sm' | 'md'
 * dot:      bool — show a status dot before the label
 *
 * Usage:
 *   <Badge>Draft</Badge>
 *   <Badge variant="success" dot>Active</Badge>
 *   <Badge variant="error">Failed</Badge>
 *   <Badge variant="warning" size="sm">Degraded</Badge>
 *   <Badge variant="info">Beta</Badge>
 *   <Badge variant="purple">Pro</Badge>
 */

export default function Badge({
  children,
  variant = 'default',
  size    = 'md',
  dot     = false,
}) {
  return (
    <span
      className={[
        'flowos-badge',
        `flowos-badge--${variant}`,
        `flowos-badge--${size}`,
      ].join(' ')}
    >
      {dot && <span className="flowos-badge__dot" />}
      {children}
    </span>
  );
}
