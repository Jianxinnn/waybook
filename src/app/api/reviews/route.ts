import { createWaybookConfig } from '@/lib/config';
import { createDatabaseClient } from '@/server/db/client';
import { runSecretaryLoop } from '@/server/jobs/secretaryLoopJob';
import { listReviewDrafts } from '@/server/reviews/reviewStore';
import type { ReviewScope, ReviewType } from '@/types/review';
import { buildAvailableScopes, matchesScope } from '@/server/reviews/scopeOptions';
import { listResearchEvents } from '@/server/search/timelineService';

export const runtime = 'nodejs';

function parseScope(url: URL): ReviewScope {
  const scopeKind = (url.searchParams.get('scopeKind') ?? 'portfolio') as ReviewScope['scopeKind'];
  const scopeValue = url.searchParams.get('scopeValue') ?? 'portfolio';
  const scopeLabel = url.searchParams.get('scopeLabel') ?? scopeValue;

  return {
    scopeKind,
    scopeValue,
    scopeLabel
  };
}

function parseReviewTypes(url: URL): ReviewType[] | undefined {
  const reviewType = url.searchParams.get('reviewType');
  return reviewType ? [reviewType as ReviewType] : undefined;
}

export async function GET(request: Request) {
  const config = createWaybookConfig();
  const url = new URL(request.url);
  const scope = parseScope(url);
  const reviewTypes = parseReviewTypes(url);
  await runSecretaryLoop(config, { useLlm: false, scope, reviewTypes });
  const client = createDatabaseClient(config.databasePath);
  const items = (await listReviewDrafts(client)).filter((draft) => {
    const matchesType = reviewTypes ? reviewTypes.includes(draft.reviewType) : true;
    const matchesScope =
      draft.scope.scopeKind === scope.scopeKind && draft.scope.scopeValue === scope.scopeValue;
    return matchesType && matchesScope;
  });
  const availableScopes = await buildAvailableScopes(config, await listResearchEvents(client));

  return Response.json({ items, currentScope: scope, availableScopes });
}

export async function POST(request: Request) {
  const config = createWaybookConfig();
  const url = new URL(request.url);
  const scope = parseScope(url);
  const reviewTypes = parseReviewTypes(url);
  const result = await runSecretaryLoop(config, {
    useLlm: config.llmGenerationEnabled,
    scope,
    reviewTypes
  });

  return Response.json({
    generated: result.generated.map((draft) => ({
      slug: draft.slug,
      reviewType: draft.reviewType,
      title: draft.title
    }))
  });
}
