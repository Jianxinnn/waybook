import type { WaybookConfig } from '@/lib/config';
import { createDatabaseClient } from '@/server/db/client';
import { listReviewDrafts } from '@/server/reviews/reviewStore';
import type { ReviewScope } from '@/types/review';
import { buildAvailableScopes, matchesScope } from '@/server/reviews/scopeOptions';
import { listWikiEntities } from '@/server/search/entityService';
import { listResearchEvents, summarizeTimeline, type TimelineFilters } from '@/server/search/timelineService';
import { buildProjectSummaries } from '@/server/workspace/projectSummaries';

export async function buildWorkspaceSnapshot(
  config: WaybookConfig,
  {
    filters = {},
    scope = {
      scopeKind: 'portfolio',
      scopeValue: 'portfolio',
      scopeLabel: 'Portfolio'
    } satisfies ReviewScope,
    itemLimit = 500
  }: {
    filters?: TimelineFilters;
    scope?: ReviewScope;
    itemLimit?: number;
  } = {}
) {
  const client = createDatabaseClient(config.databasePath);
  const allItems = await listResearchEvents(client, filters);
  const scopedItems = allItems.filter((event) => matchesScope(scope, event));
  const totalEventCount = scopedItems.length;
  const totalProjectCount = new Set(scopedItems.map((event) => event.projectKey)).size;
  const items = [...scopedItems]
    .sort((a, b) => b.occurredAt - a.occurredAt)
    .slice(0, itemLimit);
  const entities = (await listWikiEntities(client)).filter((entity) => matchesScope(scope, entity));
  const stats = await summarizeTimeline(client);
  const projectSummaries = buildProjectSummaries(scopedItems, entities);
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
      eventCount: totalEventCount,
      projectCount: totalProjectCount
    },
    projectSummaries,
    reviews,
    currentScope: scope,
    availableScopes,
    latestDailyBrief,
    latestDailyReview,
    latestWeeklyReview
  };
}
