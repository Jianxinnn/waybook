import { buildThreadStates } from '@/server/reviews/threadStateBuilder';
import type {
  ReviewPatternSummary,
  ReviewThreadState,
  ReviewThreadSummary
} from '@/types/review';
import type { ResearchEvent } from '@/types/research';

export interface ProjectThreadIntelligence {
  activeThreads: ReviewThreadSummary[];
  stalledThreads: ReviewThreadSummary[];
  repeatedPatterns: ReviewPatternSummary[];
}

function compareStrings(left: string, right: string) {
  if (left < right) {
    return -1;
  }

  if (left > right) {
    return 1;
  }

  return 0;
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

function buildRepeatedPatterns(threads: ReviewThreadState[]): ReviewPatternSummary[] {
  const counts = new Map<string, { count: number; supportingEventIds: string[] }>();

  for (const thread of threads) {
    for (const tag of thread.topTags) {
      const current = counts.get(tag) ?? { count: 0, supportingEventIds: [] };
      current.count += 1;
      current.supportingEventIds.push(...thread.supportingEventIds.slice(0, 2));
      counts.set(tag, current);
    }
  }

  return [...counts.entries()]
    .map(([label, value]) => ({
      label,
      count: value.count,
      supportingEventIds: [...new Set(value.supportingEventIds)].slice(0, 8)
    }))
    .filter((pattern) => pattern.count >= 2)
    .sort((left, right) => right.count - left.count || compareStrings(left.label, right.label));
}

export function buildThreadSummaries(
  projectKey: string,
  events: ResearchEvent[],
  now = Date.now()
): ProjectThreadIntelligence {
  const threadStates = buildThreadStates(
    events.filter((event) => event.projectKey === projectKey),
    now
  );
  const activeThreads = threadStates.filter((thread) => thread.status === 'active').map(toSummary);
  const stalledThreads = threadStates.filter((thread) => thread.status === 'stalled').map(toSummary);

  return {
    activeThreads,
    stalledThreads,
    repeatedPatterns: buildRepeatedPatterns(
      threadStates.filter((thread) => thread.status === 'active' || thread.status === 'stalled')
    )
  };
}
