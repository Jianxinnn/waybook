import { describe, expect, it } from 'vitest';
import type { ReviewContext } from '@/types/review';
import { compactReviewContextForLlm } from '@/server/reviews/llmSummarizer';

describe('compactReviewContextForLlm', () => {
  it('removes oversized evidence arrays and keeps only bounded secretary context', () => {
    const context: ReviewContext = {
      reviewType: 'weekly',
      slug: 'weekly-2026-04-13',
      title: 'Weekly Review 2026-04-13',
      periodStart: 1,
      periodEnd: 2,
      generatedAt: 3,
      eventCount: 5000,
      projectKeys: ['waybook', 'prospero'],
      whatMoved: Array.from({ length: 40 }, (_, index) => `move-${index}`),
      activeThreads: Array.from({ length: 20 }, (_, index) => ({
        threadKey: `thread-${index}`,
        label: `Thread ${index}`,
        projectKey: 'waybook',
        eventCount: index + 1,
        lastEventAt: index,
        sourceFamilies: ['git', 'codex'],
        supportingEventIds: [`event-${index}`],
        importanceScore: 0.8
      })),
      stalledThreads: Array.from({ length: 20 }, (_, index) => ({
        threadKey: `stalled-${index}`,
        label: `Stalled ${index}`,
        projectKey: 'waybook',
        eventCount: index + 1,
        lastEventAt: index,
        sourceFamilies: ['git'],
        supportingEventIds: [`event-${index}`],
        importanceScore: 0.4
      })),
      repeatedPatterns: Array.from({ length: 20 }, (_, index) => ({
        label: `pattern-${index}`,
        count: index + 1,
        supportingEventIds: [`event-${index}`]
      })),
      promotionSuggestions: Array.from({ length: 20 }, (_, index) => ({
        id: `promotion-${index}`,
        label: `Promotion ${index}`,
        entityType: 'topic',
        action: 'promote',
        rationale: 'Promote it',
        supportingEventIds: [`event-${index}`],
        relatedEntitySlugs: [`topic-${index}`],
        score: 0.9
      })),
      suggestedNextSteps: Array.from({ length: 20 }, (_, index) => `next-step-${index}`),
      weeklyOutlook: 'Focus on promotion.',
      supportingEventIds: Array.from({ length: 4000 }, (_, index) => `event-${index}`),
      relatedEntitySlugs: Array.from({ length: 4000 }, (_, index) => `entity-${index}`)
    };

    const compact = compactReviewContextForLlm(context);

    expect(compact.supportingEventIds).toBeUndefined();
    expect(compact.relatedEntitySlugs).toBeUndefined();
    expect(compact.whatMoved.length).toBeLessThanOrEqual(8);
    expect(compact.activeThreads.length).toBeLessThanOrEqual(6);
    expect(compact.promotionSuggestions.length).toBeLessThanOrEqual(6);
    expect(JSON.stringify(compact).length).toBeLessThan(JSON.stringify(context).length);
  });
});
