import type { RawSourceEventInput } from '@/types/source';

export const seededRawEvents: RawSourceEventInput[] = [
  {
    id: 'seed-waybook-claude-1',
    sourceFamily: 'claude',
    connectorId: 'seed-fixture',
    provenanceTier: 'synthetic',
    sourceEventId: 'seed-claude-1',
    projectKey: 'waybook',
    repoPath: '/workspace/waybook',
    capturedAt: 1_713_246_800_000,
    occurredAt: 1_713_246_700_000,
    sessionId: 'seed-session-1',
    payload: {
      kind: 'assistant-message',
      title: 'Defined the mixed connector model',
      summary: 'Separated source family from connector and provenance.',
      tags: ['memory-backbone', 'timeline']
    }
  },
  {
    id: 'seed-waybook-codex-1',
    sourceFamily: 'codex',
    connectorId: 'seed-fixture',
    provenanceTier: 'synthetic',
    sourceEventId: 'seed-codex-1',
    projectKey: 'waybook',
    repoPath: '/workspace/waybook',
    capturedAt: 1_713_247_000_000,
    occurredAt: 1_713_246_900_000,
    sessionId: 'seed-session-2',
    payload: {
      kind: 'tool-use',
      title: 'Executed the first timeline test run',
      summary: 'Validated the new pipeline against the timeline route.',
      tags: ['memory-backbone', 'timeline']
    }
  },
  {
    id: 'seed-waybook-experiment-1',
    sourceFamily: 'experiment',
    connectorId: 'seed-fixture',
    provenanceTier: 'synthetic',
    sourceEventId: 'seed-experiment-1',
    projectKey: 'waybook',
    repoPath: '/workspace/waybook',
    capturedAt: 1_713_247_200_000,
    occurredAt: 1_713_247_100_000,
    threadId: 'run-seed-a',
    payload: {
      kind: 'metrics',
      title: 'Seed experiment metrics updated',
      summary: 'Synthetic run used to validate the entity compiler.',
      runName: 'seed-a',
      filePath: 'experiments/seed-a/metrics.json',
      tags: ['memory-backbone', 'metrics']
    }
  }
];
