import type { WaybookConfig } from '@/lib/config';
import type { ReviewDraft, ReviewScope, ReviewType } from '@/types/review';
import { createDatabaseClient } from '@/server/db/client';
import { loadResearchEvents } from '@/server/events/eventStore';
import { loadWikiEntities } from '@/server/wiki/entityStore';
import { buildReviewContext } from './digestEngine';
import { generateReviewSectionsWithLlm } from './llmSummarizer';
import { composeReviewDraft } from './reviewComposer';
import { cleanupLegacyReviewDrafts, getReviewDraftBySlug, listReviewDrafts, persistReviewDrafts } from './reviewStore';

export async function generateReviewDrafts(
  config: WaybookConfig,
  {
    now = Date.now(),
    reviewTypes = ['daily-brief', 'daily-review', 'weekly-review'] as ReviewType[],
    scope = {
      scopeKind: 'portfolio',
      scopeValue: 'portfolio',
      scopeLabel: 'Portfolio'
    } satisfies ReviewScope,
    useLlm = false
  }: {
    now?: number;
    reviewTypes?: ReviewType[];
    scope?: ReviewScope;
    useLlm?: boolean;
  } = {}
): Promise<ReviewDraft[]> {
  const client = createDatabaseClient(config.databasePath);
  await cleanupLegacyReviewDrafts(client);
  const events = await loadResearchEvents(client);
  const entities = await loadWikiEntities(client);
  const drafts: ReviewDraft[] = [];

  for (const reviewType of reviewTypes) {
    const context = buildReviewContext({ reviewType, now, events, entities, scope });
    let llmSections = null;

    if (useLlm) {
      try {
        llmSections = await generateReviewSectionsWithLlm(config, context);
      } catch (error) {
        console.warn(
          `[waybook] secretary LLM fallback for ${context.slug}: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }

    drafts.push(
      composeReviewDraft({
        context,
        llmSections,
        llmProvider: llmSections ? config.llmProvider : null,
        llmModel: llmSections ? config.llmModel : null,
        now
      })
    );
  }

  await persistReviewDrafts(client, drafts);
  return drafts;
}

export async function ensureCurrentReviewDrafts(
  config: WaybookConfig,
  {
    now = Date.now(),
    scope = {
      scopeKind: 'portfolio',
      scopeValue: 'portfolio',
      scopeLabel: 'Portfolio'
    } satisfies ReviewScope,
    useLlm = false
  }: {
    now?: number;
    scope?: ReviewScope;
    useLlm?: boolean;
  } = {}
) {
  const client = createDatabaseClient(config.databasePath);
  await cleanupLegacyReviewDrafts(client);
  const generated = await generateReviewDrafts(config, { now, scope, useLlm });
  const drafts = await listReviewDrafts(client);

  return {
    generated,
    drafts
  };
}

export async function getReviewDraft(config: WaybookConfig, slug: string) {
  const client = createDatabaseClient(config.databasePath);
  return getReviewDraftBySlug(client, slug);
}
