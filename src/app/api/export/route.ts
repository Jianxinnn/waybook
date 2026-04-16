import { createWaybookConfig } from '@/lib/config';
import { runIngestJob } from '@/server/jobs/ingestJob';
import { runExportJob } from '@/server/jobs/exportJob';

export const runtime = 'nodejs';

export async function POST() {
  const config = createWaybookConfig();
  await runIngestJob(config);
  const result = await runExportJob(config);

  return Response.json(result);
}
