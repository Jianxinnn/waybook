import { createWaybookConfig } from '@/lib/config';
import { buildWorkspaceSnapshot } from '@/server/bootstrap/pipeline';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const snapshot = await buildWorkspaceSnapshot(createWaybookConfig(), {
    filters: {
      q: url.searchParams.get('q') ?? undefined,
      project: url.searchParams.get('project') ?? undefined,
      source: url.searchParams.get('source') ?? undefined
    }
  });

  return Response.json({
    items: snapshot.items,
    stats: snapshot.stats
  });
}
