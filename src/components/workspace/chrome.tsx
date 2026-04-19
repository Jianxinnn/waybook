import type { ReactNode } from 'react';

interface EyebrowProps {
  children: ReactNode;
  muted?: boolean;
}

export function Eyebrow({ children, muted = false }: EyebrowProps) {
  return (
    <span className="eyebrow" style={muted ? { color: 'var(--ink-muted)' } : undefined}>
      {children}
    </span>
  );
}

export interface MetaItem {
  label: ReactNode;
  value: ReactNode;
}

/**
 * Narrow key/value rail used in DetailPage asides. Keys are captions, values
 * sit in tabular-num sans, one row per entry with a hairline between.
 */
export function MetaList({ items }: { items: MetaItem[] }) {
  return (
    <dl className="space-y-3 text-sm">
      {items.map((item, idx) => (
        <div key={idx} className="flex flex-col gap-0.5">
          <dt className="caption">{item.label}</dt>
          <dd className="num text-stone-900">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

interface PillProps {
  tone?: 'default' | 'accent' | 'emerald' | 'amber';
  children: ReactNode;
}

export function Pill({ tone = 'default', children }: PillProps) {
  const classes = {
    default: 'pill',
    accent: 'pill pill-accent',
    emerald: 'pill pill-emerald',
    amber: 'pill pill-amber'
  }[tone];
  return <span className={classes}>{children}</span>;
}
