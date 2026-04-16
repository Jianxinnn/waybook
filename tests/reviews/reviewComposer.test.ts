import { describe, expect, it } from 'vitest';
import type { ReviewContext } from '@/types/review';
import { composeReviewDraft } from '@/server/reviews/reviewComposer';

describe('composeReviewDraft', () => {
  it('renders LLM bullet arrays safely when the provider returns objects instead of strings', () => {
    const context: ReviewContext = {
      reviewType: 'daily-review',
      slug: 'daily-review-2026-04-16',
      title: 'Daily Review 2026-04-16',
      scope: {
        scopeKind: 'portfolio',
        scopeValue: 'portfolio',
        scopeLabel: 'Portfolio'
      },
      periodStart: 1,
      periodEnd: 2,
      generatedAt: 3,
      eventCount: 2,
      projectKeys: ['waybook'],
      whatMoved: ['feat: add daily brief'],
      activeThreads: [],
      stalledThreads: [],
      repeatedPatterns: [],
      promotionSuggestions: [],
      suggestedNextSteps: ['Push the daily brief'],
      weeklyOutlook: 'Push the daily brief',
      supportingEventIds: [],
      relatedEntitySlugs: [],
      packet: {
        reviewType: 'daily-review',
        scope: {
          scopeKind: 'portfolio',
          scopeValue: 'portfolio',
          scopeLabel: 'Portfolio'
        },
        eventCount: 2,
        projectKeys: ['waybook'],
        activeThreads: [],
        stalledThreads: [],
        repeatedPatterns: [],
        promotionSuggestions: [],
        suggestedNextSteps: ['Push the daily brief'],
        weeklyOutlook: 'Push the daily brief'
      }
    };

    const draft = composeReviewDraft({
      context,
      llmSections: {
        headline: 'Daily Review 2026-04-16',
        overview: 'Overview',
        moved: [{ label: 'Waybook task moved' }] as unknown as string[],
        stalled: [{ label: 'Old task stalled' }] as unknown as string[],
        repeated: [],
        promotions: [{ label: 'Promote daily brief' }] as unknown as string[],
        nextSteps: [{ label: 'Push next' }] as unknown as string[],
        weeklyOutlook: 'Push next'
      },
      llmProvider: 'openai-compatible',
      llmModel: 'test-model',
      now: 4
    });

    expect(draft.managedMarkdown).toContain('Waybook task moved');
    expect(draft.managedMarkdown).toContain('Old task stalled');
    expect(draft.managedMarkdown).not.toContain('[object Object]');
  });
});
