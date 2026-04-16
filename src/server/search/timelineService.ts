import type { DatabaseClient } from '@/server/db/client';
import { loadResearchEvents } from '@/server/events/eventStore';

export interface TimelineFilters {
  q?: string;
  project?: string;
  source?: string;
}

export async function listResearchEvents(client: DatabaseClient, filters: TimelineFilters = {}) {
  const events = await loadResearchEvents(client);

  return events.filter((event) => {
    if (filters.project && event.projectKey !== filters.project) {
      return false;
    }

    if (filters.source && event.sourceFamily !== filters.source) {
      return false;
    }

    if (filters.q) {
      const haystack = [event.title, event.summary, event.tags.join(' '), event.files.join(' ')].join(' ');
      if (!haystack.toLowerCase().includes(filters.q.toLowerCase())) {
        return false;
      }
    }

    return true;
  });
}

export async function summarizeTimeline(client: DatabaseClient) {
  const events = await loadResearchEvents(client);
  const bySource = events.reduce<Record<string, number>>((accumulator, event) => {
    accumulator[event.sourceFamily] = (accumulator[event.sourceFamily] ?? 0) + 1;
    return accumulator;
  }, {});

  return {
    eventCount: events.length,
    projectCount: new Set(events.map((event) => event.projectKey)).size,
    bySource
  };
}
