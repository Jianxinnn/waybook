import { createWaybookConfig } from '@/lib/config';
import { PromotionSuggestionList } from '@/components/dashboard/PromotionSuggestionList';
import { ReviewCard } from '@/components/reviews/ReviewCard';
import { ScopeTabs } from '@/components/reviews/ScopeTabs';
import { buildWorkspaceSnapshot } from '@/server/bootstrap/pipeline';
import { parseRequestedScope } from '@/server/reviews/scopeOptions';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function ReviewsPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const scope = parseRequestedScope(
    typeof resolvedSearchParams.scopeKind === 'string' ? resolvedSearchParams.scopeKind : undefined,
    typeof resolvedSearchParams.scopeValue === 'string' ? resolvedSearchParams.scopeValue : undefined,
    typeof resolvedSearchParams.scopeLabel === 'string' ? resolvedSearchParams.scopeLabel : undefined
  );
  const snapshot = await buildWorkspaceSnapshot(createWaybookConfig(), { scope });
  const weeklyReview = snapshot.latestWeeklyReview;

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-700">Waybook</p>
        <h1 className="mt-3 text-4xl font-semibold text-stone-950">Review Drafts</h1>
        <p className="mt-3 text-base leading-7 text-stone-600">
          Daily and weekly secretary drafts generated from persisted evidence, with optional LLM prose.
        </p>
        <div className="mt-5">
          <ScopeTabs
            basePath="/reviews"
            scopes={snapshot.availableScopes}
            currentScope={snapshot.currentScope}
          />
        </div>
      </div>

      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-stone-900">Review Drafts</h2>
            <a className="text-sm font-medium text-amber-700" href="/api/reviews">
              JSON feed
            </a>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {snapshot.reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        </div>
        <div className="space-y-8">
          <section>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-stone-900">Weekly Outlook</h2>
            </div>
            <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
              <p className="text-sm leading-7 text-stone-600">
                {weeklyReview?.context.weeklyOutlook ??
                  'No weekly draft has been generated yet.'}
              </p>
            </div>
          </section>
          <section>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-stone-900">Daily Brief</h2>
            </div>
            <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
              <p className="text-sm leading-7 text-stone-600">
                {snapshot.latestDailyBrief?.canonicalSummary ??
                  'No daily brief has been generated yet.'}
              </p>
            </div>
          </section>
          <section>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-stone-900">Drafts To Promote</h2>
            </div>
            <PromotionSuggestionList items={weeklyReview?.promotionSuggestions ?? []} />
          </section>
        </div>
      </section>
    </main>
  );
}
