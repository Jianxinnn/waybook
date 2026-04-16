import type { ReviewContext, ReviewDraft, ReviewLlmSections } from '@/types/review';
import { renderDeterministicReviewMarkdown } from './digestEngine';
import { normalizeReviewType } from './scopeDigestBuilder';

function normalizeBulletItem(item: unknown) {
  if (typeof item === 'string') {
    return item;
  }

  if (item && typeof item === 'object') {
    const record = item as Record<string, unknown>;
    return String(record.label ?? record.title ?? record.threadKey ?? record.summary ?? JSON.stringify(item));
  }

  return String(item);
}

function joinLines(items: unknown[], fallback: string) {
  const normalized = items.map((item) => normalizeBulletItem(item)).filter(Boolean);
  return normalized.length ? normalized.join(' ') : fallback;
}

function joinBullets(items: unknown[], fallback: string) {
  const normalized = items.map((item) => normalizeBulletItem(item)).filter(Boolean);
  return normalized.length ? normalized.map((item) => `- ${item}`).join(' ') : fallback;
}

function renderLlmMarkdown(context: ReviewContext, sections: ReviewLlmSections) {
  const normalizedType = normalizeReviewType(context.reviewType);
  const moved = joinBullets(sections.moved, '- No material movement highlighted.');
  const stalled = joinBullets(sections.stalled, '- No stalled threads highlighted.');
  const repeated = joinBullets(sections.repeated, '- No repeated patterns highlighted.');
  const promotions = joinBullets(sections.promotions, '- No promotion candidates highlighted.');
  const nextSteps = joinBullets(sections.nextSteps, '- No next steps highlighted.');

  if (normalizedType === 'daily-brief') {
    return `---
title: ${context.title}
slug: ${context.slug}
review_type: ${context.reviewType}
period_start: ${new Date(context.periodStart).toISOString()}
period_end: ${new Date(context.periodEnd).toISOString()}
---

## Focus

${sections.overview}

## Active Now

${moved}

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
period_start: ${new Date(context.periodStart).toISOString()}
period_end: ${new Date(context.periodEnd).toISOString()}
---

## Overview

${sections.overview}

## What Moved

${moved}

## What Stalled

${stalled}

## Repeated Patterns

${repeated}

## Drafts To Promote

${promotions}

## Next Steps

${nextSteps}

## Weekly Outlook

${sections.weeklyOutlook}
`;
}

export function composeReviewDraft({
  context,
  llmSections,
  llmProvider,
  llmModel,
  now
}: {
  context: ReviewContext;
  llmSections: ReviewLlmSections | null;
  llmProvider: string | null;
  llmModel: string | null;
  now: number;
}): ReviewDraft {
  const normalizedType = normalizeReviewType(context.reviewType);
  const canonicalSummary =
    llmSections?.overview ??
    normalizedType === 'daily-brief'
      ? `${context.scope.scopeLabel}: ${context.weeklyOutlook}`
      : `${context.eventCount} events across ${context.projectKeys.length} projects. ${context.weeklyOutlook}`;

  return {
    id: `review:${context.slug}`,
    slug: context.slug,
    reviewType: context.reviewType,
    title: llmSections?.headline || context.title,
    scope: context.scope,
    periodStart: context.periodStart,
    periodEnd: context.periodEnd,
    generatedAt: context.generatedAt,
    updatedAt: now,
    status: 'draft',
    canonicalSummary,
    context,
    supportingEventIds: context.supportingEventIds,
    relatedEntitySlugs: context.relatedEntitySlugs,
    promotionSuggestions: context.promotionSuggestions,
    suggestedNextSteps: llmSections?.nextSteps?.length ? llmSections.nextSteps : context.suggestedNextSteps,
    managedMarkdown: llmSections ? renderLlmMarkdown(context, llmSections) : renderDeterministicReviewMarkdown(context),
    obsidianPath: `reviews/${context.slug}.md`,
    llmProvider,
    llmModel
  };
}
