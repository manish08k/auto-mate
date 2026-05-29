/**
 * Button.jsx — FlowOS UI
 *
 * Variants:  'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
 * Sizes:     'sm' | 'md' | 'lg'
 * States:    loading, disabled
 *
 * Usage:
 *   <Button>Save</Button>
 *   <Button variant="primary" size="sm">Publish</Button>
 *   <Button variant="danger" loading>Deleting…</Button>
 *   <Button variant="ghost" icon={<PlusIcon />}>Add Node</Button>
 */

const Spinner = () => (
  <svg
    width="14" height="14"
    viewBox="0 0 14 14"
    fill="none"
    style={{ animation: 'btn-spin 0.7s linear infinite', flexShrink: 0 }}
  >
    <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.3" />
    <path d="M7 1.5A5.5 5.5 0 0 1 12.5 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export default function Button({
  children,
  variant  = 'secondary',
  size     = 'md',
  icon     = null,
  iconEnd  = null,
  loading  = false,
  disabled = false,
  fullWidth = false,
  onClick,
  type     = 'button',
  ...rest
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={[
        'flowos-btn',
        `flowos-btn--${variant}`,
        `flowos-btn--${size}`,
        fullWidth ? 'flowos-btn--full' : '',
        loading   ? 'flowos-btn--loading' : '',
      ].filter(Boolean).join(' ')}
      {...rest}
    >
      {loading && <Spinner />}
      {!loading && icon && <span className="flowos-btn__icon flowos-btn__icon--start">{icon}</span>}
      {children && <span className="flowos-btn__label">{children}</span>}
      {!loading && iconEnd && <span className="flowos-btn__icon flowos-btn__icon--end">{iconEnd}</span>}
    </button>
  );
}
