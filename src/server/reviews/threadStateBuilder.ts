import type { ResearchEvent } from '@/types/research';
import type { ReviewThreadState } from '@/types/review';

const GENERIC_TAGS = new Set(['claude', 'codex', 'git', 'experiment', 'primary', 'derived', 'synthetic']);
const DAY_MS = 24 * 60 * 60 * 1000;

function uniqueStrings(values: string[]) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function summarizeTags(events: ResearchEvent[]) {
  const counts = new Map<string, number>();

  for (const event of events) {
    for (const tag of event.tags) {
      if (GENERIC_TAGS.has(tag) || tag.startsWith('run:')) {
        continue;
      }

      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 6)
    .map(([tag]) => tag);
}

function summarizeStatus(lastEventAt: number, now: number): ReviewThreadState['status'] {
  const age = now - lastEventAt;

  if (age <= 2 * DAY_MS) {
    return 'active';
  }

  if (age <= 14 * DAY_MS) {
    return 'stalled';
  }

  return 'dormant';
}

export function buildThreadStates(events: ResearchEvent[], now = Date.now()): ReviewThreadState[] {
  const grouped = new Map<string, ResearchEvent[]>();

  for (const event of events) {
    const group = grouped.get(event.threadKey) ?? [];
    group.push(event);
    grouped.set(event.threadKey, group);
  }

  return [...grouped.entries()]
    .map(([threadKey, threadEvents]) => {
      const sorted = [...threadEvents].sort((left, right) => right.occurredAt - left.occurredAt);
      const latest = sorted[0]!;
      const earliest = sorted[sorted.length - 1]!;
      const importanceScore =
        threadEvents.reduce((sum, event) => sum + event.importanceScore, 0) / threadEvents.length;

      return {
        id: `thread:${threadKey}`,
        threadKey,
        label: latest.title,
        projectKey: latest.projectKey,
        repoPaths: uniqueStrings(threadEvents.map((event) => event.repoPath)),
        firstEventAt: earliest.occurredAt,
        lastEventAt: latest.occurredAt,
        eventCount: threadEvents.length,
        sourceFamilies: uniqueStrings(threadEvents.map((event) => event.sourceFamily)),
        supportingEventIds: uniqueStrings(threadEvents.map((event) => event.id)),
        exemplarTitles: uniqueStrings(sorted.slice(0, 3).map((event) => event.title)),
        topTags: summarizeTags(threadEvents),
        importanceScore,
        status: summarizeStatus(latest.occurredAt, now)
      } satisfies ReviewThreadState;
    })
    .sort((left, right) => right.lastEventAt - left.lastEventAt || right.importanceScore - left.importanceScore);
}
