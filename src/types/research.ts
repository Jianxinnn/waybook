import type { ConnectorId, ProvenanceTier, SourceFamily } from './source';

export type ActorKind = 'user' | 'agent' | 'system';

export interface ResearchEvent {
  id: string;
  rawEventId: string;
  sourceFamily: SourceFamily;
  connectorId: ConnectorId;
  provenanceTier: ProvenanceTier;
  eventType: string;
  title: string;
  summary: string;
  projectKey: string;
  repoPath: string;
  threadKey: string;
  occurredAt: number;
  actorKind: ActorKind;
  evidenceRefs: string[];
  files: string[];
  tags: string[];
  importanceScore: number;
}
