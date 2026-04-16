import type { WaybookConfig } from '@/lib/config';
import { createDatabaseClient } from '@/server/db/client';
import { runIngestJob } from '@/server/jobs/ingestJob';
import { ensureCurrentReviewDrafts } from '@/server/reviews/secretaryLoop';
import { listReviewDrafts } from '@/server/reviews/reviewStore';
import type { ReviewScope } from '@/types/review';
import { buildAvailableScopes, matchesScope } from '@/server/reviews/scopeOptions';
import { listWikiEntities } from '@/server/search/entityService';
import { listResearchEvents, summarizeTimeline, type TimelineFilters } from '@/server/search/timelineService';

export async function buildWorkspaceSnapshot(
  config: WaybookConfig,
  {
    filters = {},
    scope = {
      scopeKind: 'portfolio',
      scopeValue: 'portfolio',
      scopeLabel: 'Portfolio'
    } satisfies ReviewScope
  }: {
    filters?: TimelineFilters;
    scope?: ReviewScope;
  } = {}
) {
  await runIngestJob(config);
  if (config.secretaryAutogenerateOnRead) {
    await ensureCurrentReviewDrafts(config, { scope, useLlm: false });
  }

  const client = createDatabaseClient(config.databasePath);
  const allItems = await listResearchEvents(client, filters);
  const items = allItems.filter((event) => matchesScope(scope, event));
  const entities = (await listWikiEntities(client)).filter((entity) => matchesScope(scope, entity));
  const stats = await summarizeTimeline(client);
  const reviews = (await listReviewDrafts(client)).filter((review) => matchesScope(scope, review));
  const availableScopes = await buildAvailableScopes(config, allItems);
  const latestDailyBrief = reviews.find((review) => review.reviewType === 'daily-brief') ?? null;
  const latestDailyReview = reviews.find((review) => review.reviewType === 'daily-review') ?? null;
  const latestWeeklyReview = reviews.find((review) => review.reviewType === 'weekly-review') ?? null;

  return {
    items,
    entities,
    stats: {
      ...stats,
      eventCount: items.length,
      projectCount: new Set(items.map((event) => event.projectKey)).size
    },
    reviews,
    currentScope: scope,
    availableScopes,
    latestDailyBrief,
    latestDailyReview,
    latestWeeklyReview
  };
}
