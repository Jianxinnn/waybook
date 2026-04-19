import type { ResearchEvent } from '@/types/research';
import type { WikiEntityDraft } from '@/types/wiki';
import { buildThreadStates } from '@/server/reviews/threadStateBuilder';

const DAY_MS = 24 * 60 * 60 * 1000;
const SHIP_TOKENS = [
  'done', 'ship', 'shipped', 'merged', 'resolved', 'fixed',
  'closed', 'landed', 'released', '完成', '合并', '已完成'
];

export type ProgressStatus = 'in-progress' | 'waiting' | 'dormant' | 'completed';

export interface ProgressEvent {
  id: string;
  title: string;
  at: number;
  importance: number;
  sourceFamily: string;
  /** anchor role this event plays in the thread's lifeline */
  role: 'first' | 'peak' | 'last';
}

export interface ProgressThread {
  threadKey: string;
  label: string;
  projectKey: string;
  status: ProgressStatus;
  firstEventAt: number;
  lastEventAt: number;
  eventCount: number;
  importanceScore: number;
  /** up to three anchor events: first, peak, last (deduped when they coincide) */
  keyEvents: ProgressEvent[];
  /** entities that cite events from this thread */
  linkedEntities: Array<{ slug: string; title: string; entityType: WikiEntityDraft['entityType'] }>;
}

export interface ProjectProgressTree {
  projectKey: string;
  threads: ProgressThread[];
  counts: {
    total: number;
    inProgress: number;
    waiting: number;
    dormant: number;
    completed: number;
  };
  /** oldest firstEventAt across all threads (for axis rendering) */
  axisStart: number;
  /** most recent lastEventAt */
  axisEnd: number;
}

/**
 * Build a vertical "project lifeline" tree: project → threads (sorted by
 * firstEventAt ascending, so the oldest work sits at the top of the timeline)
 * → up to three anchor events per thread → linked entities.
 *
 * Progress status is derived from activity recency PLUS explicit shipping
 * tokens in recent event titles/summaries.
 */
export function buildProjectTree(
  projectKey: string,
  events: ResearchEvent[],
  entities: WikiEntityDraft[],
  now = Date.now()
): ProjectProgressTree {
  const projectEvents = events.filter((e) => e.projectKey === projectKey);
  const threadStates = buildThreadStates(projectEvents, now);
  const threadEventsByKey = groupBy(projectEvents, (e) => e.threadKey);
  const entitiesByEventId = indexEntitiesByEvent(entities, projectKey);

  const threads: ProgressThread[] = threadStates.map((ts) => {
    const own = threadEventsByKey.get(ts.threadKey) ?? [];
    const status = deriveProgressStatus(own, now);
    const keyEvents = pickAnchorEvents(own);

    const linkedSlugs = new Set<string>();
    for (const e of own) {
      for (const entity of entitiesByEventId.get(e.id) ?? []) {
        linkedSlugs.add(entity.slug);
      }
    }
    const linkedEntities = [...linkedSlugs]
      .map((slug) => entities.find((entity) => entity.slug === slug))
      .filter((x): x is WikiEntityDraft => Boolean(x))
      .map((entity) => ({
        slug: entity.slug,
        title: entity.title,
        entityType: entity.entityType
      }));

    return {
      threadKey: ts.threadKey,
      label: ts.label,
      projectKey: ts.projectKey,
      status,
      firstEventAt: ts.firstEventAt,
      lastEventAt: ts.lastEventAt,
      eventCount: ts.eventCount,
      importanceScore: ts.importanceScore,
      keyEvents,
      linkedEntities
    };
  });

  threads.sort((a, b) => a.firstEventAt - b.firstEventAt);

  const counts = {
    total: threads.length,
    inProgress: threads.filter((t) => t.status === 'in-progress').length,
    waiting: threads.filter((t) => t.status === 'waiting').length,
    dormant: threads.filter((t) => t.status === 'dormant').length,
    completed: threads.filter((t) => t.status === 'completed').length
  };

  const axisStart = threads.reduce(
    (lo, t) => (t.firstEventAt < lo ? t.firstEventAt : lo),
    threads[0]?.firstEventAt ?? now
  );
  const axisEnd = threads.reduce(
    (hi, t) => (t.lastEventAt > hi ? t.lastEventAt : hi),
    threads[0]?.lastEventAt ?? now
  );

  return {
    projectKey,
    threads,
    counts,
    axisStart,
    axisEnd
  };
}

function deriveProgressStatus(events: ResearchEvent[], now: number): ProgressStatus {
  if (events.length === 0) return 'dormant';
  const latest = events.reduce((lo, e) => (e.occurredAt > lo ? e.occurredAt : lo), 0);
  const age = now - latest;

  // look at the most recent handful of events for shipping tokens
  const recent = [...events]
    .sort((a, b) => b.occurredAt - a.occurredAt)
    .slice(0, 5);
  const shipped = recent.some((e) => {
    const hay = `${e.title} ${e.summary}`.toLowerCase();
    return SHIP_TOKENS.some((token) => hay.includes(token));
  });

  if (shipped && age <= 14 * DAY_MS) return 'completed';
  if (age <= 3 * DAY_MS) return 'in-progress';
  if (age <= 14 * DAY_MS) return 'waiting';
  return 'dormant';
}

function pickAnchorEvents(events: ResearchEvent[]): ProgressEvent[] {
  if (events.length === 0) return [];
  const sorted = [...events].sort((a, b) => a.occurredAt - b.occurredAt);
  const first = sorted[0]!;
  const last = sorted[sorted.length - 1]!;
  const peak = [...events].sort(
    (a, b) => b.importanceScore - a.importanceScore || b.occurredAt - a.occurredAt
  )[0]!;

  const anchors: ProgressEvent[] = [];
  const push = (event: ResearchEvent, role: ProgressEvent['role']) => {
    if (anchors.find((a) => a.id === event.id)) return;
    anchors.push({
      id: event.id,
      title: event.title,
      at: event.occurredAt,
      importance: event.importanceScore,
      sourceFamily: event.sourceFamily,
      role
    });
  };
  push(first, 'first');
  // only include peak if it's meaningfully more important than first/last
  if (peak.importanceScore > Math.max(first.importanceScore, last.importanceScore) + 0.05) {
    push(peak, 'peak');
  }
  if (events.length > 1) push(last, 'last');
  return anchors.sort((a, b) => a.at - b.at);
}

function groupBy<T, K>(items: T[], key: (item: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>();
  for (const item of items) {
    const k = key(item);
    const arr = map.get(k) ?? [];
    arr.push(item);
    map.set(k, arr);
  }
  return map;
}

function indexEntitiesByEvent(entities: WikiEntityDraft[], projectKey: string) {
  const map = new Map<string, WikiEntityDraft[]>();
  for (const entity of entities) {
    if (entity.projectKey !== projectKey) continue;
    for (const id of entity.supportingEventIds) {
      const arr = map.get(id) ?? [];
      arr.push(entity);
      map.set(id, arr);
    }
  }
  return map;
}
