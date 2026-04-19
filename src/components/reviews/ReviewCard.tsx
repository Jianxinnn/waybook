import { buildWorkspaceHref, dict, type Lang } from '@/lib/i18n';
import type { ReviewDraft, ReviewScope } from '@/types/review';
import { formatWorkspaceTimestamp } from '@/components/workspace/formatting';

interface ReviewCardProps {
  review: ReviewDraft;
  scope?: ReviewScope | null;
  lang?: Lang;
  variant?: 'feed' | 'front-page';
}

const TYPE_ACCENT: Record<string, string> = {
  'daily-brief': 'bg-amber-500',
  'daily-review': 'bg-sky-500',
  'weekly-review': 'bg-violet-500'
};

export function ReviewCard({
  review,
  scope = null,
  lang = 'en',
  variant = 'feed'
}: ReviewCardProps) {
  const t = dict[lang];
  const label =
    review.reviewType === 'daily-brief'
      ? t.reviews.labelBrief
      : review.reviewType === 'daily-review'
        ? t.reviews.labelDaily
        : review.reviewType === 'weekly-review'
          ? t.reviews.labelWeekly
          : review.reviewType;
  const accent = TYPE_ACCENT[review.reviewType] ?? 'bg-stone-400';
  const href = buildWorkspaceHref(`/reviews/${review.slug}`, scope, lang);

  if (variant === 'front-page') {
    return (
      <article className="relative overflow-hidden rounded-[1.75rem] border border-stone-300/60 bg-[radial-gradient(ellipse_at_top,_rgba(255,244,220,0.6),_rgba(255,255,255,0.95))] p-7 shadow-md">
        <div className={`absolute left-0 top-0 h-full w-1 ${accent}`} />
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-stone-500">
          <span>{label}</span>
          <span className="h-3 w-px bg-stone-300" />
          <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-amber-800 ring-1 ring-amber-200">
            {review.scope.scopeLabel}
          </span>
          <span className="h-3 w-px bg-stone-300" />
          <span className="font-mono text-stone-500">
            {formatWorkspaceTimestamp(review.generatedAt ?? null, lang)}
          </span>
        </div>
        <h2 className="mt-4 font-serif text-3xl font-semibold leading-tight tracking-tight text-stone-950 md:text-4xl">
          {review.title}
        </h2>
        <p className="mt-4 border-l-2 border-amber-400 pl-4 text-base leading-8 text-stone-700">
          {review.canonicalSummary}
        </p>
        <dl className="mt-6 grid grid-cols-2 gap-3 text-[11px] uppercase tracking-[0.2em] text-stone-500">
          <div className="rounded-xl bg-white/80 px-4 py-3 ring-1 ring-stone-200/60">
            <dt>{t.review.promotionCandidates}</dt>
            <dd className="mt-1 font-serif text-2xl font-semibold text-amber-700">
              {review.promotionSuggestions.length}
            </dd>
          </div>
          <div className="rounded-xl bg-white/80 px-4 py-3 ring-1 ring-stone-200/60">
            <dt>{t.review.suggestedNextSteps}</dt>
            <dd className="mt-1 font-serif text-2xl font-semibold text-sky-700">
              {review.suggestedNextSteps.length}
            </dd>
          </div>
        </dl>
        <a
          className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-amber-700 hover:text-amber-900"
          href={href}
        >
          {t.reviews.openDraft} →
        </a>
      </article>
    );
  }

  return (
    <article className="relative overflow-hidden rounded-[1.25rem] border border-stone-200/80 bg-white/85 p-5 shadow-sm">
      <div className={`absolute left-0 top-0 h-full w-[3px] ${accent}`} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">
            {label}
          </p>
          <h3 className="mt-1.5 text-lg font-semibold text-stone-950">{review.title}</h3>
        </div>
        <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-800">
          {review.scope.scopeLabel}
        </span>
      </div>
      <p className="mt-3 text-sm leading-7 text-stone-600">{review.canonicalSummary}</p>
      <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] uppercase tracking-[0.18em] text-stone-500">
        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-800">
          {t.reviews.promotions(review.promotionSuggestions.length)}
        </span>
        <span className="rounded-full bg-sky-50 px-2 py-0.5 text-sky-800">
          {t.reviews.nextSteps(review.suggestedNextSteps.length)}
        </span>
      </div>
      <a className="mt-4 inline-flex text-sm font-medium text-amber-700" href={href}>
        {t.reviews.openDraft} →
      </a>
    </article>
  );
}
