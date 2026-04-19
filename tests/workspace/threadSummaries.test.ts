import { describe, expect, it } from 'vitest';
import type { ResearchEvent } from '@/types/research';
import { buildThreadSummaries } from '@/server/workspace/threadSummaries';

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
    occurredAt: Date.parse('2026-04-17T09:00:00Z'),
    actorKind: 'user',
    evidenceRefs: ['git:1'],
    files: [],
    tags: ['workspace'],
    importanceScore: 0.8,
    ...overrides
  };
}

describe('buildThreadSummaries', () => {
  it('derives project-level thread intelligence from research events only', () => {
    const events: ResearchEvent[] = [
      makeEvent({
        id: 'event-active-1',
        rawEventId: 'raw-active-1',
        threadKey: 'project:waybook:search',
        title: 'Draft search ranking approach',
        occurredAt: Date.parse('2026-04-16T08:00:00Z'),
        tags: ['search', 'latency']
      }),
      makeEvent({
        id: 'event-active-2',
        rawEventId: 'raw-active-2',
        sourceFamily: 'codex',
        connectorId: 'codex-rollout-jsonl',
        actorKind: 'agent',
        threadKey: 'project:waybook:search',
        title: 'Refine search ranking heuristics',
        occurredAt: Date.parse('2026-04-17T09:00:00Z'),
        tags: ['search', 'ranking']
      }),
      makeEvent({
        id: 'event-stalled-1',
        rawEventId: 'raw-stalled-1',
        threadKey: 'project:waybook:onboarding',
        title: 'Revisit onboarding checklist',
        occurredAt: Date.parse('2026-04-12T09:00:00Z'),
        tags: ['search', 'ux']
      }),
      makeEvent({
        id: 'event-dormant-1',
        rawEventId: 'raw-dormant-1',
        threadKey: 'project:waybook:archive',
        title: 'Archive stale migration notes',
        occurredAt: Date.parse('2026-03-20T09:00:00Z'),
        tags: ['search', 'cleanup']
      }),
      makeEvent({
        id: 'event-other-project-1',
        rawEventId: 'raw-other-project-1',
        projectKey: 'notes',
        repoPath: '/repo/notes',
        threadKey: 'project:notes:search',
        title: 'Notes search thread',
        occurredAt: Date.parse('2026-04-17T10:00:00Z'),
        tags: ['search', 'notes']
      })
    ];

    const intelligence = buildThreadSummaries('waybook', events, Date.parse('2026-04-17T12:00:00Z'));

    expect(intelligence.activeThreads.map((thread) => thread.threadKey)).toEqual(['project:waybook:search']);
    expect(intelligence.stalledThreads.map((thread) => thread.threadKey)).toEqual([
      'project:waybook:onboarding'
    ]);
    expect(intelligence.activeThreads[0]).toMatchObject({
      projectKey: 'waybook',
      eventCount: 2,
      status: 'active'
    });
    expect(intelligence.stalledThreads[0]).toMatchObject({
      projectKey: 'waybook',
      eventCount: 1,
      status: 'stalled'
    });
    expect(intelligence.repeatedPatterns).toEqual([
      expect.objectContaining({
        label: 'search',
        count: 2,
        supportingEventIds: expect.arrayContaining([
          'event-active-1',
          'event-active-2',
          'event-stalled-1'
        ])
      })
    ]);
  });

  it('returns empty intelligence when the project has no matching events', () => {
    const intelligence = buildThreadSummaries('missing', [makeEvent()], Date.parse('2026-04-17T12:00:00Z'));

    expect(intelligence).toEqual({
      activeThreads: [],
      stalledThreads: [],
      repeatedPatterns: []
    });
  });
});
