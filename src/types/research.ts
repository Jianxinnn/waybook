export type ResearchActorKind = 'user' | 'agent' | 'system'

export interface ResearchEvent {
  id: string
  rawEventId: string
  eventType: string
  title: string
  summary: string
  projectKey: string
  repoPath: string
  threadKey: string
  occurredAt: number
  actorKind: ResearchActorKind
  evidenceRefs: string[]
  files: string[]
  tags: string[]
  importanceScore: number
}
