import { describe, expect, it } from 'vitest';
import type { ReviewThreadState } from '@/types/review';
import type { WikiEntityDraft } from '@/types/wiki';
import { buildScopeDigest } from '@/server/reviews/scopeDigestBuilder';

describe('buildScopeDigest', () => {
  const threadStates: ReviewThreadState[] = [
    {
      id: 'thread-1',
      threadKey: 'project:waybook:assistant',
      label: 'Daily brief assistant',
      projectKey: 'waybook',
      repoPaths: ['/repo/waybook', '/repo/waybook-ui'],
      firstEventAt: Date.parse('2026-04-15T08:00:00Z'),
      lastEventAt: Date.parse('2026-04-16T09:00:00Z'),
      eventCount: 2,
      sourceFamilies: ['git', 'codex'],
      supportingEventIds: ['event-1', 'event-2'],
      exemplarTitles: ['feat: add repo assistant card', 'Rendered the daily brief UI'],
      topTags: ['assistant', 'dashboard', 'ui'],
      importanceScore: 0.77,
      status: 'active'
    },
    {
      id: 'thread-2',
      threadKey: 'project:prospero:training',
      label: 'Prospero training loop',
      projectKey: 'prospero',
      repoPaths: ['/repo/prospero'],
      firstEventAt: Date.parse('2026-04-15T08:00:00Z'),
      lastEventAt: Date.parse('2026-04-16T07:00:00Z'),
      eventCount: 2,
      sourceFamilies: ['git'],
      supportingEventIds: ['event-3', 'event-4'],
      exemplarTitles: ['feat: add results label', 'Documented the new loop'],
      topTags: ['training', 'loop'],
      importanceScore: 0.71,
      status: 'active'
    },
    {
      id: 'thread-3',
      threadKey: 'project:waybook:old-reviews',
      label: 'Old review cleanup',
      projectKey: 'waybook',
      repoPaths: ['/repo/waybook'],
      firstEventAt: Date.parse('2026-04-10T08:00:00Z'),
      lastEventAt: Date.parse('2026-04-12T07:00:00Z'),
      eventCount: 1,
      sourceFamilies: ['git'],
      supportingEventIds: ['event-5'],
      exemplarTitles: ['wip: cleanup'],
      topTags: ['cleanup'],
      importanceScore: 0.32,
      status: 'stalled'
    }
  ];

  const entities: WikiEntityDraft[] = [
    {
      id: 'entity-waybook',
      entityType: 'project',
      slug: 'waybook',
      title: 'Waybook',
      projectKey: 'waybook',
      canonicalSummary: 'Waybook summary',
      status: 'active',
      sourceThreadIds: ['project:waybook:assistant'],
      supportingEventIds: ['event-1', 'event-2'],
      outboundEntityIds: [],
      managedMarkdown: '',
      obsidianPath: 'projects/waybook.md'
    }
  ];

  it('builds bounded portfolio and repo digests from thread states', () => {
    const portfolioDigest = buildScopeDigest({
      reviewType: 'daily-brief',
      scope: {
        scopeKind: 'portfolio',
        scopeValue: 'portfolio',
        scopeLabel: 'Portfolio'
      },
      now: Date.parse('2026-04-16T23:00:00Z'),
      threadStates,
      entities
    });

    const repoDigest = buildScopeDigest({
      reviewType: 'daily-review',
      scope: {
        scopeKind: 'repo',
        scopeValue: '/repo/waybook',
        scopeLabel: 'Waybook Repo'
      },
      now: Date.parse('2026-04-16T23:00:00Z'),
      threadStates,
      entities
    });

    expect(portfolioDigest.scope.scopeKind).toBe('portfolio');
    expect(portfolioDigest.activeThreads.length).toBe(2);
    expect(repoDigest.scope.scopeKind).toBe('repo');
    expect(repoDigest.activeThreads.every((thread) => thread.repoPaths.includes('/repo/waybook'))).toBe(true);
    expect(repoDigest.stalledThreads[0]?.threadKey).toBe('project:waybook:old-reviews');
    expect(portfolioDigest.packet.activeThreads.length).toBeLessThanOrEqual(6);
  });
});
