import { describe, expect, it } from 'vitest';
import { sourceRegistry } from '@/server/ingest/sourceRegistry';

describe('source registry', () => {
  it('registers the live, derived, and seeded connectors used by M1', () => {
    expect(sourceRegistry.map((collector) => collector.connectorId)).toEqual([
      'claude-cli-jsonl',
      'claude-mem-sqlite',
      'codex-rollout-jsonl',
      'git-log',
      'experiment-fs',
      'seed-fixture'
    ]);
  });
});
