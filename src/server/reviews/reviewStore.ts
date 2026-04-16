import { desc, eq } from 'drizzle-orm';
import type { DatabaseClient } from '@/server/db/client';
import { reviewDrafts } from '@/server/db/schema';
import type { ReviewContext, ReviewDraft } from '@/types/review';

function parseJson<T>(value: string) {
  return JSON.parse(value) as T;
}

export async function persistReviewDrafts(client: DatabaseClient, drafts: ReviewDraft[]) {
  for (const draft of drafts) {
    await client.db
      .insert(reviewDrafts)
      .values({
        id: draft.id,
        slug: draft.slug,
        reviewType: draft.reviewType,
        title: draft.title,
        periodStart: draft.periodStart,
        periodEnd: draft.periodEnd,
        generatedAt: draft.generatedAt,
        updatedAt: draft.updatedAt,
        status: draft.status,
        canonicalSummary: draft.canonicalSummary,
        contextJson: JSON.stringify(draft.context),
        supportingEventIdsJson: JSON.stringify(draft.supportingEventIds),
        relatedEntitySlugsJson: JSON.stringify(draft.relatedEntitySlugs),
        promotionSuggestionsJson: JSON.stringify(draft.promotionSuggestions),
        suggestedNextStepsJson: JSON.stringify(draft.suggestedNextSteps),
        managedMarkdown: draft.managedMarkdown,
        obsidianPath: draft.obsidianPath,
        llmProvider: draft.llmProvider,
        llmModel: draft.llmModel
      })
      .onConflictDoUpdate({
        target: reviewDrafts.slug,
        set: {
          title: draft.title,
          generatedAt: draft.generatedAt,
          updatedAt: draft.updatedAt,
          canonicalSummary: draft.canonicalSummary,
          contextJson: JSON.stringify(draft.context),
          supportingEventIdsJson: JSON.stringify(draft.supportingEventIds),
          relatedEntitySlugsJson: JSON.stringify(draft.relatedEntitySlugs),
          promotionSuggestionsJson: JSON.stringify(draft.promotionSuggestions),
          suggestedNextStepsJson: JSON.stringify(draft.suggestedNextSteps),
          managedMarkdown: draft.managedMarkdown,
          obsidianPath: draft.obsidianPath,
          llmProvider: draft.llmProvider,
          llmModel: draft.llmModel
        }
      });
  }
}

export async function cleanupLegacyReviewDrafts(client: DatabaseClient) {
  await client.sqlite
    .prepare(`delete from review_drafts where review_type in ('daily', 'weekly')`)
    .run();
}

export async function listReviewDrafts(client: DatabaseClient): Promise<ReviewDraft[]> {
  const rows = await client.db.select().from(reviewDrafts).orderBy(desc(reviewDrafts.periodEnd));

  return rows.map((row) => {
    const context = parseJson<ReviewContext>(row.contextJson);
    const scope = context.scope ?? {
      scopeKind: 'portfolio',
      scopeValue: 'portfolio',
      scopeLabel: 'Portfolio'
    };

    return {
      id: row.id,
      slug: row.slug,
      reviewType: row.reviewType as ReviewDraft['reviewType'],
      title: row.title,
      scope,
      periodStart: row.periodStart,
      periodEnd: row.periodEnd,
      generatedAt: row.generatedAt,
      updatedAt: row.updatedAt,
      status: row.status as ReviewDraft['status'],
      canonicalSummary: row.canonicalSummary,
      context: {
        ...context,
        scope
      },
      supportingEventIds: parseJson<string[]>(row.supportingEventIdsJson),
      relatedEntitySlugs: parseJson<string[]>(row.relatedEntitySlugsJson),
      promotionSuggestions: parseJson<ReviewDraft['promotionSuggestions']>(row.promotionSuggestionsJson),
      suggestedNextSteps: parseJson<string[]>(row.suggestedNextStepsJson),
      managedMarkdown: row.managedMarkdown,
      obsidianPath: row.obsidianPath,
      llmProvider: row.llmProvider,
      llmModel: row.llmModel
    };
  });
}

export async function getReviewDraftBySlug(client: DatabaseClient, slug: string) {
  const rows = await client.db.select().from(reviewDrafts).where(eq(reviewDrafts.slug, slug)).limit(1);
  if (!rows[0]) {
    return null;
  }

  return (await listReviewDrafts(client)).find((draft) => draft.slug === slug) ?? null;
}
