interface ReviewSummaryCardProps {
  heading: string;
  summary: string;
  href: string;
}

export function ReviewSummaryCard({ heading, summary, href }: ReviewSummaryCardProps) {
  return (
    <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-stone-900">{heading}</h3>
      <p className="mt-3 text-sm leading-6 text-stone-600">{summary}</p>
      <a className="mt-4 inline-flex text-sm font-medium text-amber-700" href={href}>
        Open review
      </a>
    </article>
  );
}
