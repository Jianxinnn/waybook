import type { WaybookConfig } from '@/lib/config';
import type { ReviewScope, ReviewType } from '@/types/review';
import { runIngestJob } from './ingestJob';
import { generateReviewDrafts } from '@/server/reviews/secretaryLoop';

export async function runSecretaryLoop(
  config: WaybookConfig,
  {
    now = Date.now(),
    reviewTypes,
    scope,
    useLlm = config.llmGenerationEnabled
  }: {
    now?: number;
    reviewTypes?: ReviewType[];
    scope?: ReviewScope;
    useLlm?: boolean;
  } = {}
) {
  await runIngestJob(config);
  const generated = await generateReviewDrafts(config, { now, reviewTypes, scope, useLlm });

  return { generated };
}
