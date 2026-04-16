import type { WaybookConfig } from '@/lib/config';
import type { ReviewContext, ReviewLlmSections } from '@/types/review';
import { normalizeReviewType } from './scopeDigestBuilder';

function parseJsonObject(text: string) {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed) as ReviewLlmSections;
  } catch {
    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1)) as ReviewLlmSections;
    }
    throw new Error('Failed to parse LLM JSON response');
  }
}

export function canUseLlmSummarizer(config: WaybookConfig) {
  return Boolean(
    config.llmGenerationEnabled &&
      config.llmProvider &&
      config.llmModel &&
      config.llmApiKey &&
      config.llmBaseUrl
  );
}

export function compactReviewContextForLlm(context: ReviewContext) {
  if (context.packet) {
    return {
      ...context.packet,
      title: context.title,
      slug: context.slug,
      generatedAt: context.generatedAt
    };
  }

  const normalizedType = normalizeReviewType(context.reviewType);
  return {
    reviewType: normalizedType,
    slug: context.slug,
    title: context.title,
    periodStart: context.periodStart,
    periodEnd: context.periodEnd,
    generatedAt: context.generatedAt,
    eventCount: context.eventCount,
    projectKeys: context.projectKeys.slice(0, 8),
    whatMoved: context.whatMoved.slice(0, 8),
    activeThreads: context.activeThreads.slice(0, 6).map((thread) => ({
      threadKey: thread.threadKey,
      label: thread.label,
      projectKey: thread.projectKey,
      eventCount: thread.eventCount,
      sourceFamilies: thread.sourceFamilies,
      importanceScore: thread.importanceScore
    })),
    stalledThreads: context.stalledThreads.slice(0, 6).map((thread) => ({
      threadKey: thread.threadKey,
      label: thread.label,
      projectKey: thread.projectKey,
      eventCount: thread.eventCount,
      sourceFamilies: thread.sourceFamilies,
      importanceScore: thread.importanceScore
    })),
    repeatedPatterns: context.repeatedPatterns.slice(0, 8).map((pattern) => ({
      label: pattern.label,
      count: pattern.count
    })),
    promotionSuggestions: context.promotionSuggestions.slice(0, 6).map((suggestion) => ({
      label: suggestion.label,
      entityType: suggestion.entityType,
      action: suggestion.action,
      rationale: suggestion.rationale,
      score: suggestion.score
    })),
    suggestedNextSteps: context.suggestedNextSteps.slice(0, 6),
    weeklyOutlook: context.weeklyOutlook
  };
}

export async function generateReviewSectionsWithLlm(
  config: WaybookConfig,
  context: ReviewContext,
  fetchImpl: typeof fetch = fetch
): Promise<ReviewLlmSections | null> {
  if (!canUseLlmSummarizer(config)) {
    return null;
  }

  const compactContext = compactReviewContextForLlm(context);
  const response = await fetchImpl(`${config.llmBaseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${config.llmApiKey}`
    },
    body: JSON.stringify({
      model: config.llmModel,
      temperature: 0.3,
      messages: [
        {
          role: 'system',
          content:
            'You are Waybook, a precise research secretary. Summarize only from the provided evidence packet. Return valid JSON with keys: headline, overview, moved, stalled, repeated, promotions, nextSteps, weeklyOutlook.'
        },
        {
          role: 'user',
          content: JSON.stringify(compactContext)
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`LLM request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | Array<{ text?: string }> } }>;
  };
  const content = payload.choices?.[0]?.message?.content;
  const text =
    typeof content === 'string'
      ? content
      : Array.isArray(content)
        ? content.map((item) => item.text ?? '').join('\n')
        : '';

  return parseJsonObject(text);
}
