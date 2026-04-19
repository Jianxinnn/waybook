import type { ResearchEvent } from '@/types/research';
import type { WikiEntityDraft } from '@/types/wiki';

export interface ProjectSummary {
  projectKey: string;
  eventCount: number;
  entityCount: number;
  lastEventAt: number | null;
  highlights: string[];
  recentOccurrences: number[];
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

function compareByProjectKey(left: { projectKey: string }, right: { projectKey: string }) {
  return compareStrings(left.projectKey, right.projectKey);
}

function getLastEventAt(events: ResearchEvent[]) {
  if (events.length === 0) {
    return null;
  }

  return events.reduce((latest, event) =>
    event.occurredAt > latest ? event.occurredAt : latest
  , events[0]!.occurredAt);
}

export function buildProjectSummaries(
  events: ResearchEvent[],
  entities: WikiEntityDraft[]
): ProjectSummary[] {
  const projectKeys = new Set([...events.map((event) => event.projectKey), ...entities.map((entity) => entity.projectKey)]);

  return [...projectKeys]
    .sort(compareStrings)
    .map((projectKey) => {
      const projectEvents = events.filter((event) => event.projectKey === projectKey);
      const projectEntities = entities.filter((entity) => entity.projectKey === projectKey);
      const sortedHighlights = [...projectEvents]
        .sort(
          (left, right) =>
            right.importanceScore - left.importanceScore ||
            right.occurredAt - left.occurredAt ||
            compareStrings(left.title, right.title) ||
            compareStrings(left.id, right.id)
        )
        .slice(0, 3)
        .map((event) => event.title);

      const lastEventAt = getLastEventAt(projectEvents);
      const recentOccurrences = projectEvents.map((event) => event.occurredAt);

      return {
        projectKey,
        eventCount: projectEvents.length,
        entityCount: projectEntities.length,
        lastEventAt,
        highlights: sortedHighlights,
        recentOccurrences
      } satisfies ProjectSummary;
    })
    .sort(
      (left, right) =>
        (right.lastEventAt ?? Number.NEGATIVE_INFINITY) -
          (left.lastEventAt ?? Number.NEGATIVE_INFINITY) ||
        compareByProjectKey(left, right)
    );
}
