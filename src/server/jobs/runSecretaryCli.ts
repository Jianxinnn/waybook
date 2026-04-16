import { loadRuntimeEnv } from '@/lib/loadRuntimeEnv';
import { createWaybookConfig } from '@/lib/config';
import { runSecretaryLoop } from './secretaryLoopJob';

async function main() {
  loadRuntimeEnv();
  const result = await runSecretaryLoop(createWaybookConfig());
  console.log(
    JSON.stringify(
      {
        generated: result.generated.map((draft) => ({
          slug: draft.slug,
          reviewType: draft.reviewType,
          title: draft.title
        }))
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
