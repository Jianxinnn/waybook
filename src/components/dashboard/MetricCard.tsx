interface MetricCardProps {
  label: string;
  value: string | number;
  hint: string;
}

export function MetricCard({ label, value, hint }: MetricCardProps) {
  return (
    <article className="rounded-3xl border border-stone-200 bg-white/90 p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-stone-900">{value}</p>
      <p className="mt-2 text-sm text-stone-600">{hint}</p>
    </article>
  );
}
