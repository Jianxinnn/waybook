import type {
  PromotionSuggestion,
  ReviewContext,
  ReviewPatternSummary,
  ReviewScope,
  ReviewThreadState,
  ReviewThreadSummary,
  ReviewType
} from '@/types/review';
import type { WikiEntityDraft } from '@/types/wiki';
import { slugify } from '@/server/ingest/shared';

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfUtcDay(timestamp: number) {
  const date = new Date(timestamp);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function startOfUtcWeek(timestamp: number) {
  const dayStart = startOfUtcDay(timestamp);
  const date = new Date(dayStart);
  const dayOfWeek = date.getUTCDay();
  const offset = (dayOfWeek + 6) % 7;
  return dayStart - offset * DAY_MS;
}

export function normalizeReviewType(reviewType: ReviewType): ReviewType {
  if (reviewType === 'daily') {
    return 'daily-review';
  }

  if (reviewType === 'weekly') {
    return 'weekly-review';
  }

  return reviewType;
}

function scopeMatches(threadState: ReviewThreadState, scope: ReviewScope) {
  if (scope.scopeKind === 'portfolio') {
    return true;
  }

  if (scope.scopeKind === 'project') {
    return threadState.projectKey === scope.scopeValue;
  }

  return threadState.repoPaths.includes(scope.scopeValue);
}

function toSummary(thread: ReviewThreadState): ReviewThreadSummary {
  return {
    threadKey: thread.threadKey,
    label: thread.label,
    projectKey: thread.projectKey,
    eventCount: thread.eventCount,
    lastEventAt: thread.lastEventAt,
    sourceFamilies: thread.sourceFamilies,
    supportingEventIds: thread.supportingEventIds,
    importanceScore: thread.importanceScore,
    repoPaths: thread.repoPaths,
    exemplarTitles: thread.exemplarTitles,
    topTags: thread.topTags,
    status: thread.status
  };
}

function buildPeriod(reviewType: ReviewType, now: number) {
  const normalized = normalizeReviewType(reviewType);
  if (normalized === 'weekly-review') {
    const periodStart = startOfUtcWeek(now);
    return { periodStart, periodEnd: periodStart + 7 * DAY_MS };
  }

  const periodStart = startOfUtcDay(now);
  return { periodStart, periodEnd: periodStart + DAY_MS };
}

function buildRepeatedPatterns(threads: ReviewThreadState[]): ReviewPatternSummary[] {
  const counts = new Map<string, { count: number; supportingEventIds: string[] }>();

  for (const thread of threads) {
    for (const tag of thread.topTags) {
      const existing = counts.get(tag) ?? { count: 0, supportingEventIds: [] };
      existing.count += 1;
      existing.supportingEventIds.push(...thread.supportingEventIds.slice(0, 2));
      counts.set(tag, existing);
    }
  }

  return [...counts.entries()]
    .map(([label, value]) => ({
      label,
      count: value.count,
      supportingEventIds: [...new Set(value.supportingEventIds)].slice(0, 8)
    }))
    .filter((pattern) => pattern.count >= 2)
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label))
    .slice(0, 8);
}

function buildPromotionSuggestions(
  patterns: ReviewPatternSummary[],
  activeThreads: ReviewThreadState[],
  entities: WikiEntityDraft[]
): PromotionSuggestion[] {
  const entitySlugs = new Set(entities.map((entity) => entity.slug));
  const suggestions: PromotionSuggestion[] = [];

  for (const pattern of patterns) {
    const topicSlug = `topic-${slugify(pattern.label)}`;
    suggestions.push({
      id: `promotion:${pattern.label}`,
      label: pattern.label,
      entityType: 'topic',
      action: entitySlugs.has(topicSlug) ? 'update' : 'promote',
      rationale: `The topic "${pattern.label}" repeated across ${pattern.count} active threads.`,
      supportingEventIds: pattern.supportingEventIds,
      relatedEntitySlugs: entitySlugs.has(topicSlug) ? [topicSlug] : [],
      score: Math.min(0.6 + pattern.count * 0.08, 0.95)
    });
  }

  for (const thread of activeThreads.filter((item) => item.threadKey.startsWith('experiment:'))) {
    const experimentName = thread.threadKey.split(':').at(-1) ?? thread.projectKey;
    const experimentSlug = `experiment-${slugify(experimentName)}`;
    suggestions.push({
      id: `promotion:${thread.threadKey}`,
      label: thread.label,
      entityType: 'experiment',
      action: entitySlugs.has(experimentSlug) ? 'update' : 'promote',
      rationale: `The experiment thread "${thread.label}" is active in the current review window.`,
      supportingEventIds: thread.supportingEventIds.slice(0, 8),
      relatedEntitySlugs: entitySlugs.has(experimentSlug) ? [experimentSlug] : [],
      score: Math.min(thread.importanceScore + 0.1, 0.95)
    });
  }

  return suggestions
    .sort((left, right) => right.score - left.score || left.label.localeCompare(right.label))
    .slice(0, 6);
}

function buildSuggestedNextSteps(
  reviewType: ReviewType,
  activeThreads: ReviewThreadState[],
  stalledThreads: ReviewThreadState[],
  promotions: PromotionSuggestion[]
) {
  const normalized = normalizeReviewType(reviewType);
  const steps: string[] = [];

  if (normalized === 'daily-brief') {
    if (activeThreads[0]) {
      steps.push(`Focus first on "${activeThreads[0].label}".`);
    }
    if (stalledThreads[0]) {
      steps.push(`Check whether "${stalledThreads[0].label}" still deserves attention today.`);
    }
  } else {
    if (activeThreads[0]) {
      steps.push(`Push "${activeThreads[0].label}" through its next proof point.`);
    }
    if (stalledThreads[0]) {
      steps.push(`Decide whether to resume or close "${stalledThreads[0].label}".`);
    }
  }

  if (promotions[0]) {
    steps.push(`Promote "${promotions[0].label}" into durable knowledge while the evidence is fresh.`);
  }

  if (steps.length === 0) {
    steps.push('Capture the next meaningful event so the secretary loop has stronger evidence.');
  }

  return [...new Set(steps)].slice(0, 6);
}

function buildTitle(reviewType: ReviewType, periodStart: number) {
  const dateLabel = new Date(periodStart).toISOString().slice(0, 10);
  const normalized = normalizeReviewType(reviewType);

  if (normalized === 'daily-brief') {
    return `Daily Brief ${dateLabel}`;
  }

  if (normalized === 'daily-review') {
    return `Daily Review ${dateLabel}`;
  }

  return `Weekly Review ${dateLabel}`;
}

function buildSlug(reviewType: ReviewType, scope: ReviewScope, periodStart: number) {
  const dateLabel = new Date(periodStart).toISOString().slice(0, 10);
  const normalized = normalizeReviewType(reviewType);
  if (scope.scopeKind === 'portfolio' && scope.scopeValue === 'portfolio') {
    return `${normalized}-${dateLabel}`;
  }

  return `${normalized}-${scope.scopeKind}-${slugify(scope.scopeValue)}-${dateLabel}`;
}

export function buildScopeDigest({
  reviewType,
  scope,
  now,
  threadStates,
  entities
}: {
  reviewType: ReviewType;
  scope: ReviewScope;
  now: number;
  threadStates: ReviewThreadState[];
  entities: WikiEntityDraft[];
}): ReviewContext {
  const normalizedType = normalizeReviewType(reviewType);
  const { periodStart, periodEnd } = buildPeriod(normalizedType, now);
  const scopedThreads = threadStates.filter((threadState) => scopeMatches(threadState, scope));
  const projectKeys = [...new Set(scopedThreads.map((thread) => thread.projectKey))].sort();
  const activeThreadsRaw = scopedThreads
    .filter((thread) => thread.lastEventAt >= periodStart && thread.lastEventAt < periodEnd)
    .sort((left, right) => right.lastEventAt - left.lastEventAt || right.importanceScore - left.importanceScore);
  const stalledLookback = normalizedType === 'weekly-review' ? 21 * DAY_MS : 7 * DAY_MS;
  const stalledThreadsRaw = scopedThreads
    .filter(
      (thread) =>
        thread.lastEventAt < periodStart &&
        thread.lastEventAt >= periodStart - stalledLookback &&
        thread.status !== 'dormant'
    )
    .sort((left, right) => right.lastEventAt - left.lastEventAt || right.importanceScore - left.importanceScore);
  const repeatedPatterns = buildRepeatedPatterns(activeThreadsRaw);
  const scopedEntities = entities.filter(
    (entity) => scope.scopeKind === 'portfolio' || projectKeys.includes(entity.projectKey)
  );
  const promotionSuggestions = buildPromotionSuggestions(repeatedPatterns, activeThreadsRaw, scopedEntities);
  const suggestedNextSteps = buildSuggestedNextSteps(
    normalizedType,
    activeThreadsRaw,
    stalledThreadsRaw,
    promotionSuggestions
  );
  const weeklyOutlook =
    normalizedType === 'daily-brief'
      ? suggestedNextSteps[0] ?? 'Keep the most active thread moving.'
      : suggestedNextSteps[0] ?? 'Keep collecting evidence so the weekly review can steer direction.';
  const activeThreads = activeThreadsRaw.slice(0, 6).map(toSummary);
  const stalledThreads = stalledThreadsRaw.slice(0, 6).map(toSummary);
  const supportingEventIds = [
    ...new Set(
      [...activeThreadsRaw, ...stalledThreadsRaw].flatMap((thread) => thread.supportingEventIds)
    )
  ].slice(0, 64);
  const relatedEntitySlugs = scopedEntities.map((entity) => entity.slug).slice(0, 32);

  return {
    reviewType: normalizedType,
    slug: buildSlug(normalizedType, scope, periodStart),
    title: buildTitle(normalizedType, periodStart),
    scope,
    periodStart,
    periodEnd,
    generatedAt: now,
    eventCount: activeThreadsRaw.reduce((sum, thread) => sum + thread.eventCount, 0),
    projectKeys,
    whatMoved:
      normalizedType === 'daily-brief'
        ? activeThreadsRaw.slice(0, 5).map((thread) => thread.label)
        : activeThreadsRaw
            .slice(0, 5)
            .flatMap((thread) => thread.exemplarTitles.slice(0, 2))
            .slice(0, 5),
    activeThreads,
    stalledThreads,
    repeatedPatterns,
    promotionSuggestions,
    suggestedNextSteps,
    weeklyOutlook,
    supportingEventIds,
    relatedEntitySlugs,
    packet: {
      reviewType: normalizedType,
      scope,
      eventCount: activeThreadsRaw.reduce((sum, thread) => sum + thread.eventCount, 0),
      projectKeys,
      activeThreads: activeThreads.map((thread) => ({
        threadKey: thread.threadKey,
        label: thread.label,
        projectKey: thread.projectKey,
        eventCount: thread.eventCount,
        repoPaths: thread.repoPaths ?? [],
        sourceFamilies: thread.sourceFamilies,
        importanceScore: thread.importanceScore
      })),
      stalledThreads: stalledThreads.map((thread) => ({
        threadKey: thread.threadKey,
        label: thread.label,
        projectKey: thread.projectKey,
        repoPaths: thread.repoPaths ?? [],
        sourceFamilies: thread.sourceFamilies,
        importanceScore: thread.importanceScore
      })),
      repeatedPatterns: repeatedPatterns.slice(0, 8).map((pattern) => ({
        label: pattern.label,
        count: pattern.count
      })),
      promotionSuggestions: promotionSuggestions.slice(0, 6).map((suggestion) => ({
        label: suggestion.label,
        entityType: suggestion.entityType,
        action: suggestion.action,
        rationale: suggestion.rationale,
        score: suggestion.score
      })),
      suggestedNextSteps: suggestedNextSteps.slice(0, 6),
      weeklyOutlook
    }
  };
}
