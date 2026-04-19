interface ReviewSummaryCardProps {
  heading: string;
  summary: string;
  href: string;
  accent?: 'amber' | 'sky' | 'violet';
  actionLabel?: string;
}

const ACCENT: Record<string, { bar: string; text: string; bg: string }> = {
  amber: { bar: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50/80' },
  sky: { bar: 'bg-sky-500', text: 'text-sky-700', bg: 'bg-sky-50/60' },
  violet: { bar: 'bg-violet-500', text: 'text-violet-700', bg: 'bg-violet-50/60' }
};

export function ReviewSummaryCard({
  heading,
  summary,
  href,
  accent = 'amber',
  actionLabel = 'Open review'
}: ReviewSummaryCardProps) {
  const acc = ACCENT[accent] ?? ACCENT.amber;
  return (
    <article
      className={`relative overflow-hidden rounded-3xl border border-stone-200 ${acc.bg} p-5 shadow-sm`}
    >
      <div className={`absolute left-0 top-0 h-full w-1 ${acc.bar}`} />
      <h3 className="font-serif text-xl font-semibold text-stone-900">{heading}</h3>
      <p className="mt-3 text-sm leading-7 text-stone-700">{summary}</p>
      <a className={`mt-4 inline-flex text-sm font-medium ${acc.text}`} href={href}>
        {actionLabel} →
      </a>
    </article>
  );
}
