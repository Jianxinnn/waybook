export type SourceName = 'claude-mem' | 'codex' | 'git' | 'experiment'

export interface RawSourceEventInput {
  id: string
  source: SourceName
  sourceEventId: string
  projectKey: string
  repoPath: string
  capturedAt: number
  payload: Record<string, unknown>
}

export interface SourceCollector {
  source: SourceName
  collect(): Promise<RawSourceEventInput[]>
}
