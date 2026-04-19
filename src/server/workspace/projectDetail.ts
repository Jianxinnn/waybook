import type { ResearchEvent } from '@/types/research';
import type { WikiEntityDraft } from '@/types/wiki';
import { buildThreadSummaries, type ProjectThreadIntelligence } from '@/server/workspace/threadSummaries';

const RECENT_EVENTS_LIMIT = 10;

export interface ProjectDetail {
  projectKey: string;
  recentEvents: ResearchEvent[];
  entities: WikiEntityDraft[];
  threadIntelligence: ProjectThreadIntelligence;
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

export function buildProjectDetail(
  projectKey: string,
  events: ResearchEvent[],
  entities: WikiEntityDraft[],
  now = Date.now()
): ProjectDetail {
  const recentEvents = events
    .filter((event) => event.projectKey === projectKey)
    .sort(
      (left, right) =>
        right.occurredAt - left.occurredAt ||
        right.importanceScore - left.importanceScore ||
        compareStrings(left.title, right.title) ||
        compareStrings(left.id, right.id)
    )
    .slice(0, RECENT_EVENTS_LIMIT);
  const projectEntities = entities
    .filter((entity) => entity.projectKey === projectKey)
    .sort(
      (left, right) =>
        compareStrings(left.entityType, right.entityType) ||
        compareStrings(left.title, right.title) ||
        compareStrings(left.slug, right.slug)
    );

  return {
    projectKey,
    recentEvents,
    entities: projectEntities,
    threadIntelligence: buildThreadSummaries(projectKey, events, now)
  };
}
