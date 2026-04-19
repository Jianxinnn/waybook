import { describe, expect, it } from 'vitest';
import type { ResearchEvent } from '@/types/research';
import type { WikiEntityDraft } from '@/types/wiki';
import { buildProjectTree } from '@/server/workspace/projectTree';

const NOW = new Date('2026-04-18T12:00:00Z').getTime();
const DAY = 86_400_000;

function makeEvent(overrides: Partial<ResearchEvent> = {}): ResearchEvent {
  return {
    id: 'e-1',
    rawEventId: 'r-1',
    sourceFamily: 'git',
    connectorId: 'git-log',
    provenanceTier: 'primary',
    eventType: 'git.commit',
    title: 'Commit',
    summary: '',
    projectKey: 'waybook',
    repoPath: '/repo',
    threadKey: 'project:waybook:a',
    occurredAt: NOW,
    actorKind: 'user',
    evidenceRefs: [],
    files: [],
    tags: [],
    importanceScore: 0.5,
    ...overrides
  };
}

function makeEntity(overrides: Partial<WikiEntityDraft> = {}): WikiEntityDraft {
  return {
    id: 'w-1',
    entityType: 'topic',
    slug: 'search-ranking',
    title: 'Search ranking',
    projectKey: 'waybook',
    canonicalSummary: '',
    status: 'active',
    sourceThreadIds: [],
    supportingEventIds: [],
    outboundEntityIds: [],
    managedMarkdown: '',
    obsidianPath: 'topics/search-ranking.md',
    ...overrides
  };
}

describe('buildProjectTree', () => {
  it('orders threads by firstEventAt and picks first/peak/last anchors', () => {
    const events: ResearchEvent[] = [
      makeEvent({
        id: 'a-first',
        threadKey: 'project:waybook:alpha',
        occurredAt: NOW - 10 * DAY,
        importanceScore: 0.4,
        title: 'Alpha kickoff'
      }),
      makeEvent({
        id: 'a-peak',
        threadKey: 'project:waybook:alpha',
        occurredAt: NOW - 6 * DAY,
        importanceScore: 0.95,
        title: 'Alpha landmark'
      }),
      makeEvent({
        id: 'a-last',
        threadKey: 'project:waybook:alpha',
        occurredAt: NOW - 2 * DAY,
        importanceScore: 0.5,
        title: 'Alpha follow-up'
      }),
      makeEvent({
        id: 'b-first',
        threadKey: 'project:waybook:beta',
        occurredAt: NOW - 4 * DAY,
        importanceScore: 0.5
      })
    ];
    const tree = buildProjectTree('waybook', events, [], NOW);

    expect(tree.threads.map((t) => t.threadKey)).toEqual([
      'project:waybook:alpha',
      'project:waybook:beta'
    ]);

    const alpha = tree.threads[0]!;
    expect(alpha.keyEvents.map((e) => e.role)).toEqual(['first', 'peak', 'last']);
    expect(alpha.keyEvents.map((e) => e.id)).toEqual(['a-first', 'a-peak', 'a-last']);
  });

  it('marks completed when a recent event contains a shipping token', () => {
    const events: ResearchEvent[] = [
      makeEvent({
        id: 'c-1',
        occurredAt: NOW - 1 * DAY,
        title: 'feature merged into main',
        summary: ''
      })
    ];
    const tree = buildProjectTree('waybook', events, [], NOW);
    expect(tree.threads[0]!.status).toBe('completed');
    expect(tree.counts.completed).toBe(1);
  });

  it('classifies idle threads correctly', () => {
    const events: ResearchEvent[] = [
      makeEvent({ id: 'idle-a', threadKey: 'x', occurredAt: NOW - 5 * DAY }), // waiting
      makeEvent({ id: 'idle-b', threadKey: 'y', occurredAt: NOW - 30 * DAY }) // dormant
    ];
    const tree = buildProjectTree('waybook', events, [], NOW);
    expect(tree.counts.waiting).toBe(1);
    expect(tree.counts.dormant).toBe(1);
  });

  it('links entities through supporting events', () => {
    const e1 = makeEvent({ id: 'supp-1', threadKey: 't' });
    const entity = makeEntity({ supportingEventIds: ['supp-1'] });
    const tree = buildProjectTree('waybook', [e1], [entity], NOW);
    expect(tree.threads[0]!.linkedEntities).toEqual([
      { slug: 'search-ranking', title: 'Search ranking', entityType: 'topic' }
    ]);
  });
});
