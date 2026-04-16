import { createWaybookConfig } from '@/lib/config';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { PromotionSuggestionList } from '@/components/dashboard/PromotionSuggestionList';
import { ReviewSummaryCard } from '@/components/dashboard/ReviewSummaryCard';
import { EntityCard } from '@/components/entities/EntityCard';
import { ScopeTabs } from '@/components/reviews/ScopeTabs';
import { TimelineList } from '@/components/timeline/TimelineList';
import { buildWorkspaceSnapshot } from '@/server/bootstrap/pipeline';
import { parseRequestedScope } from '@/server/reviews/scopeOptions';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function HomePage({
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
  const dailyBrief = snapshot.latestDailyBrief;
  const weeklyReview = snapshot.latestWeeklyReview;
  const weeklySuggestions = weeklyReview?.promotionSuggestions ?? [];

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-6 py-10">
      <section className="rounded-[2rem] border border-amber-200/70 bg-white/75 p-8 shadow-sm backdrop-blur">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-700">Waybook</p>
        <h1 className="mt-4 text-5xl font-semibold tracking-tight text-stone-950">
          Research Memory Backbone
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-stone-600">
          A local-first control surface for AI-native work. Every collector flows through the same
          persisted pipeline before it reaches the timeline, entity compiler, and markdown export.
        </p>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-stone-900">Scope</h2>
          <p className="text-sm text-stone-500">{snapshot.currentScope.scopeLabel}</p>
        </div>
        <ScopeTabs
          basePath="/"
          scopes={snapshot.availableScopes}
          currentScope={snapshot.currentScope}
        />
      </section>

      <section>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-stone-900">Connector Provenance</h2>
          <a className="text-sm font-medium text-amber-700" href="/timeline">
            Open full timeline
          </a>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard
            label="Events"
            value={snapshot.stats.eventCount}
            hint="Raw records normalized into timeline events."
          />
          <MetricCard
            label="Projects"
            value={snapshot.stats.projectCount}
            hint={`Projects visible in the ${snapshot.currentScope.scopeLabel} scope.`}
          />
          <MetricCard
            label="Sources"
            value={Object.keys(snapshot.stats.bySource).length}
            hint="Live, derived, and synthetic connectors can coexist."
          />
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-stone-900">Timeline</h2>
            <a className="text-sm font-medium text-amber-700" href="/api/timeline">
              JSON feed
            </a>
          </div>
          <TimelineList items={snapshot.items.slice(0, 8)} />
        </div>
        <div>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-stone-900">Entities</h2>
            <a className="text-sm font-medium text-amber-700" href="/entities">
              Browse all
            </a>
          </div>
          <div className="space-y-4">
            {snapshot.entities.slice(0, 4).map((entity) => (
              <EntityCard key={entity.id} entity={entity} />
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-stone-900">Weekly Outlook</h2>
            <a className="text-sm font-medium text-amber-700" href="/reviews">
              Open reviews
            </a>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {dailyBrief ? (
              <ReviewSummaryCard
                heading="Daily Brief"
                summary={dailyBrief.canonicalSummary}
                href={`/reviews/${dailyBrief.slug}`}
              />
            ) : null}
            {weeklyReview ? (
              <ReviewSummaryCard
                heading="Weekly Outlook"
                summary={weeklyReview.context.weeklyOutlook}
                href={`/reviews/${weeklyReview.slug}`}
              />
            ) : null}
          </div>
        </div>
        <div>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-stone-900">Drafts To Promote</h2>
            <a className="text-sm font-medium text-amber-700" href="/reviews">
              See secretary loop
            </a>
          </div>
          <PromotionSuggestionList items={weeklySuggestions.slice(0, 4)} />
        </div>
      </section>
    </main>
  );
}
