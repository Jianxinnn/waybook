import type { ResearchEvent } from '@/types/research';
import type { ReviewThreadState } from '@/types/review';
import type { WikiEntityDraft } from '@/types/wiki';
import { buildThreadStates } from '@/server/reviews/threadStateBuilder';

const DAY_MS = 24 * 60 * 60 * 1000;

export type PulseItemKind = 'event' | 'thread' | 'entity';

export interface PulseItem {
  kind: PulseItemKind;
  /** millisecond timestamp to place this item on the day's reading order */
  at: number;
  /** primary line of text, one line only */
  title: string;
  /** short context, e.g. project key / source family / status label */
  context: string;
  /** 0..1 weight used to draw emphasis — not a raw count */
  weight: number;
  /** routing hint for the UI — event → timeline, thread → project, entity → knowledge */
  href: string | null;
  /** ids useful for drill-down */
  refs: {
    eventId?: string;
    threadKey?: string;
    projectKey?: string;
    entitySlug?: string;
  };
}

export interface DailyPulse {
  /** inclusive start of the local day (ms) */
  dayStart: number;
  /** exclusive end of the local day (ms) */
  dayEnd: number;
  items: PulseItem[];
  counts: {
    events: number;
    threadsTouched: number;
    entitiesTouched: number;
  };
}

function startOfDay(now: number): number {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * Build the day-scoped pulse list.
 *
 * Selection:
 *   - events with `importanceScore >= 0.6` that occurred today
 *   - thread states whose `lastEventAt` is today (i.e. state just moved)
 *   - entities whose supporting events include any event from today
 *
 * Order: most recent first. Weight combines `importanceScore` (events) and
 * `importanceScore / eventCount heuristic` (threads, entities).
 */
export function buildDailyPulse(
  events: ResearchEvent[],
  entities: WikiEntityDraft[],
  now = Date.now(),
  { importanceFloor = 0.6 }: { importanceFloor?: number } = {}
): DailyPulse {
  const dayStart = startOfDay(now);
  const dayEnd = dayStart + DAY_MS;
  const todayEvents = events.filter((e) => e.occurredAt >= dayStart && e.occurredAt < dayEnd);

  const threadStates = buildThreadStates(events, now);
  const movedThreads = threadStates.filter(
    (t) => t.lastEventAt >= dayStart && t.lastEventAt < dayEnd
  );

  const todayEventIds = new Set(todayEvents.map((e) => e.id));
  const touchedEntities = entities.filter((e) =>
    e.supportingEventIds.some((id) => todayEventIds.has(id))
  );

  const items: PulseItem[] = [];

  for (const e of todayEvents) {
    if (e.importanceScore < importanceFloor) continue;
    items.push({
      kind: 'event',
      at: e.occurredAt,
      title: e.title,
      context: `${e.projectKey} · ${e.sourceFamily}`,
      weight: clamp01(e.importanceScore),
      href: '/timeline',
      refs: { eventId: e.id, projectKey: e.projectKey, threadKey: e.threadKey }
    });
  }

  for (const t of movedThreads) {
    items.push({
      kind: 'thread',
      at: t.lastEventAt,
      title: t.label,
      context: `${t.projectKey} · ${t.status}`,
      weight: clamp01(t.importanceScore),
      href: `/projects/${t.projectKey}`,
      refs: { projectKey: t.projectKey, threadKey: t.threadKey }
    });
  }

  for (const ent of touchedEntities) {
    // pick a reasonable "at" — last supporting event today
    const supportingToday = todayEvents.filter((e) => ent.supportingEventIds.includes(e.id));
    if (supportingToday.length === 0) continue;
    const latest = supportingToday.reduce(
      (lo, e) => (e.occurredAt > lo ? e.occurredAt : lo),
      0
    );
    items.push({
      kind: 'entity',
      at: latest,
      title: ent.title,
      context: `${ent.projectKey} · ${ent.entityType}`,
      weight: Math.min(1, 0.4 + supportingToday.length * 0.1),
      href: `/entities/${ent.slug}`,
      refs: { projectKey: ent.projectKey, entitySlug: ent.slug }
    });
  }

  items.sort((a, b) => b.at - a.at || b.weight - a.weight);

  return {
    dayStart,
    dayEnd,
    items,
    counts: {
      events: todayEvents.length,
      threadsTouched: movedThreads.length,
      entitiesTouched: touchedEntities.length
    }
  };
}

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

export function deriveThreadStatus(
  firstEventAt: number,
  lastEventAt: number,
  now = Date.now()
): 'in-progress' | 'waiting' | 'dormant' | 'completed' {
  const age = now - lastEventAt;
  if (age <= 3 * DAY_MS) return 'in-progress';
  if (age <= 14 * DAY_MS) return 'waiting';
  return 'dormant';
}

export { buildThreadStates };
export type { ReviewThreadState };
