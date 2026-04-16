import { loadRuntimeEnv } from '@/lib/loadRuntimeEnv';
import { createWaybookConfig } from '@/lib/config';
import { runExportJob } from './exportJob';

async function main() {
  loadRuntimeEnv();
  const result = await runExportJob(createWaybookConfig());
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
