import { describe, expect, it } from 'vitest';
import type { ResearchEvent } from '@/types/research';
import type { WikiEntityDraft } from '@/types/wiki';
import { buildDailyPulse } from '@/server/workspace/dailyPulse';

function makeEvent(overrides: Partial<ResearchEvent> = {}): ResearchEvent {
  return {
    id: 'event-1',
    rawEventId: 'raw-1',
    sourceFamily: 'git',
    connectorId: 'git-log',
    provenanceTier: 'primary',
    eventType: 'git.commit',
    title: 'Event title',
    summary: 'Event summary',
    projectKey: 'waybook',
    repoPath: '/repo/waybook',
    threadKey: 'project:waybook:default',
    occurredAt: 0,
    actorKind: 'user',
    evidenceRefs: ['git:1'],
    files: [],
    tags: [],
    importanceScore: 0.8,
    ...overrides
  };
}

function makeEntity(overrides: Partial<WikiEntityDraft> = {}): WikiEntityDraft {
  return {
    id: 'wiki-1',
    entityType: 'project',
    slug: 'waybook',
    title: 'Waybook project surface',
    projectKey: 'waybook',
    canonicalSummary: '',
    status: 'active',
    sourceThreadIds: [],
    supportingEventIds: [],
    outboundEntityIds: [],
    managedMarkdown: '',
    obsidianPath: 'projects/waybook.md',
    ...overrides
  };
}

describe('buildDailyPulse', () => {
  const now = new Date('2026-04-18T15:00:00Z').getTime();
  const start = (() => {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  })();

  it('keeps today-only high-importance events and orders newest first', () => {
    const events: ResearchEvent[] = [
      makeEvent({
        id: 'e-today-high',
        occurredAt: start + 3 * 3600_000,
        title: 'Ship pulse surface',
        importanceScore: 0.8
      }),
      makeEvent({
        id: 'e-today-low',
        occurredAt: start + 2 * 3600_000,
        title: 'Noise',
        importanceScore: 0.4
      }),
      makeEvent({
        id: 'e-yesterday',
        occurredAt: start - 2 * 3600_000,
        title: 'Yesterday thing',
        importanceScore: 0.9
      })
    ];
    const pulse = buildDailyPulse(events, [], now);
    const eventItems = pulse.items.filter((i) => i.kind === 'event');
    expect(eventItems.map((i) => i.refs.eventId)).toEqual(['e-today-high']);
    expect(pulse.counts.events).toBe(2);
  });

  it('includes threads whose last event is today (even if tiny importance)', () => {
    const events: ResearchEvent[] = [
      makeEvent({
        id: 'e-a',
        threadKey: 'project:waybook:pulse',
        occurredAt: start + 60_000,
        importanceScore: 0.3
      }),
      makeEvent({
        id: 'e-b',
        threadKey: 'project:waybook:pulse',
        occurredAt: start + 3600_000,
        importanceScore: 0.3
      })
    ];
    const pulse = buildDailyPulse(events, [], now);
    expect(pulse.items.some((i) => i.kind === 'thread' && i.refs.threadKey === 'project:waybook:pulse')).toBe(true);
    expect(pulse.counts.threadsTouched).toBe(1);
  });

  it('surfaces entities whose supporting events landed today', () => {
    const todayEvent = makeEvent({
      id: 'e-today',
      occurredAt: start + 5 * 3600_000,
      importanceScore: 0.7
    });
    const stale = makeEvent({
      id: 'e-stale',
      occurredAt: start - 7 * 86_400_000,
      importanceScore: 0.7
    });
    const entity = makeEntity({
      slug: 'search',
      supportingEventIds: ['e-today', 'e-stale']
    });
    const pulse = buildDailyPulse([todayEvent, stale], [entity], now);
    expect(pulse.items.filter((i) => i.kind === 'entity')).toHaveLength(1);
    expect(pulse.counts.entitiesTouched).toBe(1);
  });

  it('returns empty item list when nothing happened today', () => {
    const pulse = buildDailyPulse([
      makeEvent({ occurredAt: start - 86_400_000 })
    ], [], now);
    expect(pulse.items).toEqual([]);
    expect(pulse.counts).toEqual({ events: 0, threadsTouched: 0, entitiesTouched: 0 });
  });
});
