import { createWaybookConfig } from '@/lib/config';
import { buildWorkspaceSnapshot } from '@/server/bootstrap/pipeline';
import { parseRequestedScope } from '@/server/reviews/scopeOptions';
import { buildThreadSummaries } from '@/server/workspace/threadSummaries';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const scope = parseRequestedScope(
    url.searchParams.get('scopeKind') ?? undefined,
    url.searchParams.get('scopeValue') ?? undefined,
    url.searchParams.get('scopeLabel') ?? undefined
  );
  const snapshot = await buildWorkspaceSnapshot(createWaybookConfig(), { scope });

  return Response.json({
    items: snapshot.projectSummaries.map((summary) => {
      const intelligence = buildThreadSummaries(summary.projectKey, snapshot.items);

      return {
        ...summary,
        activeThreadCount: intelligence.activeThreads.length,
        stalledThreadCount: intelligence.stalledThreads.length,
        repeatedPatternCount: intelligence.repeatedPatterns.length
      };
    }),
    currentScope: snapshot.currentScope,
    availableScopes: snapshot.availableScopes
  });
}
