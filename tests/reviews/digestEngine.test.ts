import { describe, expect, it } from 'vitest';
import type { ResearchEvent } from '@/types/research';
import type { WikiEntityDraft } from '@/types/wiki';
import { buildReviewContext, renderDeterministicReviewMarkdown } from '@/server/reviews/digestEngine';

describe('buildReviewContext', () => {
  it('builds daily secretary context with active threads, stalled threads, patterns, and promotion suggestions', () => {
    const events: ResearchEvent[] = [
      {
        id: 'event-1',
        rawEventId: 'raw-1',
        sourceFamily: 'git',
        connectorId: 'git-log',
        provenanceTier: 'primary',
        eventType: 'git.commit',
        title: 'feat: add review drafts',
        summary: 'Adds review draft persistence.',
        projectKey: 'waybook',
        repoPath: '/repo/waybook',
        threadKey: 'project:waybook:reviews',
        occurredAt: Date.parse('2026-04-16T08:00:00Z'),
        actorKind: 'user',
        evidenceRefs: ['git-log:1'],
        files: ['src/server/reviews/store.ts'],
        tags: ['git', 'primary', 'reviews', 'secretary'],
        importanceScore: 0.9
      },
      {
        id: 'event-2',
        rawEventId: 'raw-2',
        sourceFamily: 'claude',
        connectorId: 'claude-cli-jsonl',
        provenanceTier: 'primary',
        eventType: 'claude.assistant-message',
        title: 'Defined the weekly outlook prompt',
        summary: 'Drafted the prompt for the weekly secretary summary.',
        projectKey: 'waybook',
        repoPath: '/repo/waybook',
        threadKey: 'project:waybook:reviews',
        occurredAt: Date.parse('2026-04-16T09:00:00Z'),
        actorKind: 'agent',
        evidenceRefs: ['claude:1'],
        files: ['src/server/reviews/llmSummarizer.ts'],
        tags: ['claude', 'primary', 'reviews', 'secretary'],
        importanceScore: 0.82
      },
      {
        id: 'event-3',
        rawEventId: 'raw-3',
        sourceFamily: 'experiment',
        connectorId: 'experiment-fs',
        provenanceTier: 'primary',
        eventType: 'experiment.metrics',
        title: 'daily digest eval improved',
        summary: 'The secretary eval set improved by 6 points.',
        projectKey: 'waybook',
        repoPath: '/repo/waybook',
        threadKey: 'experiment:waybook:digest-eval',
        occurredAt: Date.parse('2026-04-16T10:00:00Z'),
        actorKind: 'system',
        evidenceRefs: ['experiment:1'],
        files: ['experiments/digest-eval/metrics.json'],
        tags: ['experiment', 'primary', 'reviews', 'run:digest-eval'],
        importanceScore: 0.76
      },
      {
        id: 'event-4',
        rawEventId: 'raw-4',
        sourceFamily: 'git',
        connectorId: 'git-log',
        provenanceTier: 'primary',
        eventType: 'git.commit',
        title: 'wip: thread clustering prototype',
        summary: 'Initial clustering pass, not yet wired.',
        projectKey: 'waybook',
        repoPath: '/repo/waybook',
        threadKey: 'project:waybook:clusters',
        occurredAt: Date.parse('2026-04-13T10:00:00Z'),
        actorKind: 'user',
        evidenceRefs: ['git-log:4'],
        files: ['src/server/reviews/threadClustering.ts'],
        tags: ['git', 'primary', 'clustering'],
        importanceScore: 0.58
      }
    ];

    const entities: WikiEntityDraft[] = [
      {
        id: 'entity-project-waybook',
        entityType: 'project',
        slug: 'waybook',
        title: 'Waybook',
        projectKey: 'waybook',
        canonicalSummary: 'Project summary',
        status: 'active',
        sourceThreadIds: ['project:waybook:reviews'],
        supportingEventIds: ['event-1', 'event-2'],
        outboundEntityIds: [],
        managedMarkdown: '',
        obsidianPath: 'projects/waybook.md'
      }
    ];

    const context = buildReviewContext({
      reviewType: 'daily',
      now: Date.parse('2026-04-16T23:00:00Z'),
      events,
      entities
    });

    expect(context.reviewType).toBe('daily-review');
    expect(context.activeThreads.map((thread) => thread.threadKey)).toEqual(
      expect.arrayContaining(['project:waybook:reviews', 'experiment:waybook:digest-eval'])
    );
    expect(context.stalledThreads[0]?.threadKey).toBe('project:waybook:clusters');
    expect(context.repeatedPatterns.map((pattern) => pattern.label)).toContain('reviews');
    expect(context.promotionSuggestions.length).toBeGreaterThan(0);
    expect(context.suggestedNextSteps.length).toBeGreaterThan(0);

    const markdown = renderDeterministicReviewMarkdown(context);
    expect(markdown).toContain('## What Moved');
    expect(markdown).toContain('## Drafts To Promote');
    expect(markdown).toContain('## Next Steps');
  });
});
