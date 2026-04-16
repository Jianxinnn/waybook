import { createWaybookConfig } from '@/lib/config';
import { buildWorkspaceSnapshot } from '@/server/bootstrap/pipeline';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const snapshot = await buildWorkspaceSnapshot(createWaybookConfig(), {
    filters: {
      project: url.searchParams.get('project') ?? undefined
    }
  });

  return Response.json({
    items: snapshot.entities
  });
}
