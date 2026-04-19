import { describe, expect, it } from 'vitest';
import type { ResearchEvent } from '@/types/research';
import type { WikiEntityDraft } from '@/types/wiki';
import { buildProjectDetail } from '@/server/workspace/projectDetail';

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

function makeEntity(overrides: Partial<WikiEntityDraft> = {}): WikiEntityDraft {
  return {
    id: 'entity-1',
    entityType: 'project',
    slug: 'waybook',
    title: 'Waybook',
    projectKey: 'waybook',
    canonicalSummary: 'Project summary',
    status: 'active',
    sourceThreadIds: ['project:waybook:default'],
    supportingEventIds: ['event-1'],
    outboundEntityIds: [],
    managedMarkdown: '',
    obsidianPath: 'projects/waybook.md',
    ...overrides
  };
}

describe('buildProjectDetail', () => {
  it('returns filtered recent events, entities, and thread intelligence for a project', () => {
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
        tags: ['onboarding', 'ux']
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
    const entities: WikiEntityDraft[] = [
      makeEntity(),
      makeEntity({
        id: 'entity-2',
        entityType: 'topic',
        slug: 'topic-search',
        title: 'Search',
        sourceThreadIds: ['project:waybook:search'],
        supportingEventIds: ['event-active-1', 'event-active-2'],
        obsidianPath: 'topics/search.md'
      }),
      makeEntity({
        id: 'entity-3',
        slug: 'notes',
        title: 'Notes',
        projectKey: 'notes',
        sourceThreadIds: ['project:notes:search'],
        supportingEventIds: ['event-other-project-1'],
        obsidianPath: 'projects/notes.md'
      })
    ];

    const detail = buildProjectDetail('waybook', events, entities, Date.parse('2026-04-17T12:00:00Z'));

    expect(detail.recentEvents.map((event) => event.id)).toEqual([
      'event-active-2',
      'event-active-1',
      'event-stalled-1'
    ]);
    expect(detail.entities.map((entity) => entity.slug)).toEqual(['waybook', 'topic-search']);
    expect(detail.threadIntelligence.activeThreads.map((thread) => thread.threadKey)).toEqual([
      'project:waybook:search'
    ]);
    expect(detail.threadIntelligence.stalledThreads.map((thread) => thread.threadKey)).toEqual([
      'project:waybook:onboarding'
    ]);
  });

  it('caps recent events after sorting to the newest entries', () => {
    const baseTime = Date.parse('2026-04-17T00:00:00Z');
    const events: ResearchEvent[] = Array.from({ length: 12 }, (_, index) =>
      makeEvent({
        id: `event-${index}`,
        rawEventId: `raw-${index}`,
        title: `Event ${index}`,
        threadKey: `project:waybook:thread-${index}`,
        occurredAt: baseTime + index * 1_000
      })
    ).reverse();

    const detail = buildProjectDetail('waybook', events, [], Date.parse('2026-04-17T12:00:00Z'));

    expect(detail.recentEvents).toHaveLength(10);
    expect(detail.recentEvents.map((event) => event.id)).toEqual([
      'event-11',
      'event-10',
      'event-9',
      'event-8',
      'event-7',
      'event-6',
      'event-5',
      'event-4',
      'event-3',
      'event-2'
    ]);
  });

  it('keeps entity-only projects readable', () => {
    const detail = buildProjectDetail(
      'entity-only',
      [],
      [
        makeEntity({
          id: 'entity-only-1',
          slug: 'entity-only',
          title: 'Entity Only',
          projectKey: 'entity-only',
          sourceThreadIds: [],
          supportingEventIds: [],
          obsidianPath: 'projects/entity-only.md'
        })
      ],
      Date.parse('2026-04-17T12:00:00Z')
    );

    expect(detail).toEqual({
      projectKey: 'entity-only',
      recentEvents: [],
      entities: [
        expect.objectContaining({
          slug: 'entity-only',
          projectKey: 'entity-only'
        })
      ],
      threadIntelligence: {
        activeThreads: [],
        stalledThreads: [],
        repeatedPatterns: []
      }
    });
  });
});
