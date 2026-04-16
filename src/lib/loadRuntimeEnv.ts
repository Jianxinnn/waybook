import nextEnv from '@next/env';

const { loadEnvConfig } = nextEnv;

let loaded = false;

export function loadRuntimeEnv() {
  if (loaded) {
    return;
  }

  loadEnvConfig(process.cwd());
  loaded = true;
}
