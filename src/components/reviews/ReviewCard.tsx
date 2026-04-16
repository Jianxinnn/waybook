import type { ReviewDraft } from '@/types/review';

interface ReviewCardProps {
  review: ReviewDraft;
}

export function ReviewCard({ review }: ReviewCardProps) {
  const label =
    review.reviewType === 'daily-brief'
      ? 'daily brief'
      : review.reviewType === 'daily-review'
        ? 'daily review'
        : review.reviewType === 'weekly-review'
          ? 'weekly review'
          : review.reviewType;

  return (
    <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
        {label}
      </p>
      <h3 className="mt-2 text-xl font-semibold text-stone-900">{review.title}</h3>
      <p className="mt-3 text-sm leading-6 text-stone-600">{review.canonicalSummary}</p>
      <div className="mt-4 flex flex-wrap gap-2 text-xs text-stone-500">
        <span>{review.promotionSuggestions.length} promotion candidates</span>
        <span>{review.suggestedNextSteps.length} suggested next steps</span>
      </div>
      <a className="mt-4 inline-flex text-sm font-medium text-amber-700" href={`/reviews/${review.slug}`}>
        Open draft
      </a>
    </article>
  );
}
