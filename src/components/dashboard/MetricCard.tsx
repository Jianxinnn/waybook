import type { ReactNode } from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  hint: string;
  trend?: ReactNode;
  tone?: 'amber' | 'sky' | 'violet' | 'emerald';
}

const TONE: Record<string, { bar: string; value: string }> = {
  amber: { bar: 'from-amber-400 to-amber-600', value: 'text-amber-900' },
  sky: { bar: 'from-sky-400 to-sky-600', value: 'text-sky-900' },
  violet: { bar: 'from-violet-400 to-violet-600', value: 'text-violet-900' },
  emerald: { bar: 'from-emerald-400 to-emerald-600', value: 'text-emerald-900' }
};

export function MetricCard({ label, value, hint, trend, tone = 'amber' }: MetricCardProps) {
  const t = TONE[tone] ?? TONE.amber;
  return (
    <article className="relative overflow-hidden rounded-3xl border border-stone-200 bg-white/90 p-5 shadow-sm">
      <div className={`absolute left-0 top-0 h-full w-1 bg-gradient-to-b ${t.bar}`} />
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">{label}</p>
      <p className={`mt-3 text-3xl font-semibold ${t.value}`}>{value}</p>
      {trend ? <div className="mt-3">{trend}</div> : null}
      <p className="mt-2 text-sm text-stone-600">{hint}</p>
    </article>
  );
}
