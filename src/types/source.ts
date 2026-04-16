import type { WaybookConfig } from '@/lib/config';

export type SourceFamily = 'claude' | 'codex' | 'git' | 'experiment';

export type ConnectorId =
  | 'claude-cli-jsonl'
  | 'claude-mem-sqlite'
  | 'codex-rollout-jsonl'
  | 'git-log'
  | 'experiment-fs'
  | 'seed-fixture';

export type ProvenanceTier = 'primary' | 'derived' | 'synthetic';

export interface RawSourceEventInput {
  id: string;
  sourceFamily: SourceFamily;
  connectorId: ConnectorId;
  provenanceTier: ProvenanceTier;
  sourceEventId: string;
  projectKey: string;
  repoPath: string;
  capturedAt: number;
  occurredAt: number;
  cursorToken?: string;
  sessionId?: string;
  threadId?: string;
  payload: Record<string, unknown>;
}

export interface CollectorCheckpointState {
  connectorId: ConnectorId;
  scopeKey: string;
  cursorToken: string;
  updatedAt: number;
}

export interface CollectContext {
  config: WaybookConfig;
  checkpoints: Map<string, CollectorCheckpointState>;
}

export interface CollectResult {
  events: RawSourceEventInput[];
  checkpoints: CollectorCheckpointState[];
}

export interface SourceCollector {
  sourceFamily: SourceFamily;
  connectorId: ConnectorId;
  collect(context: CollectContext): Promise<CollectResult>;
}

export function makeCheckpointKey(connectorId: ConnectorId, scopeKey: string) {
  return `${connectorId}:${scopeKey}`;
}
