/**
 * Loader.jsx — FlowOS UI
 *
 * Exports:
 *   Loader          — inline spinner (default export)
 *   Skeleton        — content placeholder block
 *   SkeletonText    — multi-line text placeholder
 *   PageLoader      — full-page centered spinner
 *
 * Loader sizes: 'sm' (14px) | 'md' (20px) | 'lg' (32px)
 *
 * Usage:
 *   <Loader />
 *   <Loader size="lg" />
 *
 *   <Skeleton width={200} height={16} />
 *   <Skeleton width="100%" height={44} radius={8} />
 *
 *   <SkeletonText lines={3} />
 *
 *   <PageLoader label="Loading workflows…" />
 */

/* ── Spinner ── */
export default function Loader({ size = 'md' }) {
  const px = { sm: 14, md: 20, lg: 32 }[size] ?? 20;
  const sw = { sm: 1.5, md: 1.5, lg: 2 }[size] ?? 1.5;

  return (
    <svg
      width={px} height={px}
      viewBox="0 0 20 20"
      fill="none"
      className="flowos-loader"
      role="status"
      aria-label="Loading"
    >
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth={sw} strokeOpacity="0.2" />
      <path
        d="M10 2a8 8 0 0 1 8 8"
        stroke="currentColor"
        strokeWidth={sw}
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ── Skeleton block ── */
export function Skeleton({
  width  = '100%',
  height = 16,
  radius = 4,
  style  = {},
}) {
  return (
    <span
      className="flowos-skeleton"
      style={{
        display: 'block',
        width:  typeof width  === 'number' ? `${width}px`  : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: radius,
        ...style,
      }}
      aria-hidden="true"
    />
  );
}

/* ── Skeleton text (multiple lines) ── */
export function SkeletonText({ lines = 3, gap = 8 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap }} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 ? '65%' : '100%'}
          height={14}
        />
      ))}
    </div>
  );
}

/* ── Full-page loader ── */
export function PageLoader({ label }) {
  return (
    <div className="flowos-page-loader" role="status">
      <Loader size="lg" />
      {label && <span className="flowos-page-loader__label">{label}</span>}
    </div>
  );
}
