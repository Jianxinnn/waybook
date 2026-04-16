import type { ResearchEvent } from '@/types/research';
import type { ReviewContext, ReviewScope, ReviewType } from '@/types/review';
import type { WikiEntityDraft } from '@/types/wiki';
import { buildScopeDigest, normalizeReviewType } from './scopeDigestBuilder';
import { buildThreadStates } from './threadStateBuilder';

export function buildReviewContext({
  reviewType,
  now,
  events,
  entities,
  scope = {
    scopeKind: 'portfolio',
    scopeValue: 'portfolio',
    scopeLabel: 'Portfolio'
  } satisfies ReviewScope
}: {
  reviewType: ReviewType;
  now: number;
  events: ResearchEvent[];
  entities: WikiEntityDraft[];
  scope?: ReviewScope;
}): ReviewContext {
  const threadStates = buildThreadStates(events, now);
  return buildScopeDigest({
    reviewType: normalizeReviewType(reviewType),
    scope,
    now,
    threadStates,
    entities
  });
}

export function renderDeterministicReviewMarkdown(context: ReviewContext) {
  const normalizedType = normalizeReviewType(context.reviewType);
  const moved = context.whatMoved.length
    ? context.whatMoved.map((item) => `- ${item}`).join('\n')
    : '- No material movement was captured in this window.';
  const active = context.activeThreads.length
    ? context.activeThreads
        .map((thread) => `- ${thread.label} (${thread.eventCount} events, ${thread.sourceFamilies.join(', ')})`)
        .join('\n')
    : '- No active threads in this window.';
  const stalled = context.stalledThreads.length
    ? context.stalledThreads.map((thread) => `- ${thread.label}`).join('\n')
    : '- No stalled threads detected.';
  const repeated = context.repeatedPatterns.length
    ? context.repeatedPatterns.map((pattern) => `- ${pattern.label} (${pattern.count})`).join('\n')
    : '- No repeated patterns detected.';
  const promotions = context.promotionSuggestions.length
    ? context.promotionSuggestions
        .map((suggestion) => `- ${suggestion.label}: ${suggestion.rationale}`)
        .join('\n')
    : '- No promotion candidates yet.';
  const nextSteps = context.suggestedNextSteps.map((step) => `- ${step}`).join('\n');

  if (normalizedType === 'daily-brief') {
    return `---
title: ${context.title}
slug: ${context.slug}
review_type: ${context.reviewType}
scope_kind: ${context.scope.scopeKind}
scope_value: ${context.scope.scopeValue}
period_start: ${new Date(context.periodStart).toISOString()}
period_end: ${new Date(context.periodEnd).toISOString()}
---

## Focus

${context.weeklyOutlook}

## Active Now

${active}

## Watch List

${stalled}

## Next Steps

${nextSteps}
`;
  }

  return `---
title: ${context.title}
slug: ${context.slug}
review_type: ${context.reviewType}
scope_kind: ${context.scope.scopeKind}
scope_value: ${context.scope.scopeValue}
period_start: ${new Date(context.periodStart).toISOString()}
period_end: ${new Date(context.periodEnd).toISOString()}
---

## Overview

${context.eventCount} events were captured across ${context.projectKeys.length} projects in the ${
    context.scope.scopeLabel
  } scope.

## What Moved

${moved}

## Active Threads

${active}

## What Stalled

${stalled}

## Repeated Patterns

${repeated}

## Drafts To Promote

${promotions}

## Next Steps

${nextSteps}

## Weekly Outlook

${context.weeklyOutlook}
`;
}
