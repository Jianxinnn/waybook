import { describe, expect, it } from 'vitest';
import type { ResearchEvent } from '@/types/research';
import { buildThreadStates } from '@/server/reviews/threadStateBuilder';

describe('buildThreadStates', () => {
  it('aggregates event-level evidence into bounded thread snapshots', () => {
    const events: ResearchEvent[] = [
      {
        id: 'event-1',
        rawEventId: 'raw-1',
        sourceFamily: 'git',
        connectorId: 'git-log',
        provenanceTier: 'primary',
        eventType: 'git.commit',
        title: 'feat: add repo assistant card',
        summary: 'Adds a repo-level assistant card.',
        projectKey: 'waybook',
        repoPath: '/repo/waybook',
        threadKey: 'project:waybook:assistant',
        occurredAt: Date.parse('2026-04-16T08:00:00Z'),
        actorKind: 'user',
        evidenceRefs: ['git-log:1'],
        files: ['src/app/page.tsx'],
        tags: ['assistant', 'dashboard', 'repo'],
        importanceScore: 0.8
      },
      {
        id: 'event-2',
        rawEventId: 'raw-2',
        sourceFamily: 'codex',
        connectorId: 'codex-rollout-jsonl',
        provenanceTier: 'primary',
        eventType: 'codex.tool-result',
        title: 'Rendered the daily brief UI',
        summary: 'The daily brief UI is wired.',
        projectKey: 'waybook',
        repoPath: '/repo/waybook-ui',
        threadKey: 'project:waybook:assistant',
        occurredAt: Date.parse('2026-04-16T09:00:00Z'),
        actorKind: 'agent',
        evidenceRefs: ['codex:1'],
        files: ['src/components/dashboard/ReviewSummaryCard.tsx'],
        tags: ['assistant', 'dashboard', 'ui'],
        importanceScore: 0.74
      },
      {
        id: 'event-3',
        rawEventId: 'raw-3',
        sourceFamily: 'experiment',
        connectorId: 'experiment-fs',
        provenanceTier: 'primary',
        eventType: 'experiment.metrics',
        title: 'digest-eval metrics updated',
        summary: 'The evaluation scores improved.',
        projectKey: 'waybook',
        repoPath: '/repo/waybook',
        threadKey: 'experiment:waybook:digest-eval',
        occurredAt: Date.parse('2026-04-16T10:00:00Z'),
        actorKind: 'system',
        evidenceRefs: ['experiment:1'],
        files: ['experiments/digest-eval/metrics.json'],
        tags: ['digest', 'metrics', 'run:digest-eval'],
        importanceScore: 0.77
      }
    ];

    const threadStates = buildThreadStates(events, Date.parse('2026-04-16T23:00:00Z'));
    const assistantThread = threadStates.find((thread) => thread.threadKey === 'project:waybook:assistant');

    expect(threadStates.length).toBe(2);
    expect(assistantThread).toMatchObject({
      projectKey: 'waybook',
      eventCount: 2,
      lastEventAt: Date.parse('2026-04-16T09:00:00Z'),
      status: 'active'
    });
    expect(assistantThread?.repoPaths).toEqual(['/repo/waybook', '/repo/waybook-ui']);
    expect(assistantThread?.exemplarTitles.length).toBeLessThanOrEqual(3);
    expect(assistantThread?.topTags).toEqual(expect.arrayContaining(['assistant', 'dashboard']));
  });
});
