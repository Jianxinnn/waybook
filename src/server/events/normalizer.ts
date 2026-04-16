import type { ResearchEvent } from '../../types/research'
import type { RawSourceEventInput } from '../../types/source'

import { assignThreadKey } from './threadAssigner'

export function normalizeRawSourceEvent(
  input: RawSourceEventInput,
): ResearchEvent {
  const title = getEventTitle(input)

  return {
    id: `evt:${input.id}`,
    rawEventId: input.id,
    eventType: getEventType(input),
    title,
    summary: getSummary(input, title),
    projectKey: input.projectKey,
    repoPath: input.repoPath,
    threadKey: assignThreadKey({
      projectKey: input.projectKey,
      title,
    }),
    occurredAt: input.capturedAt,
    actorKind: input.source === 'git' ? 'user' : 'agent',
    evidenceRefs: [input.sourceEventId],
    files: getStringArray(input.payload.files),
    tags: getTags(input),
    importanceScore: getImportanceScore(input.payload.importanceScore),
  }
}

function getEventTitle(input: RawSourceEventInput): string {
  const message = input.payload.message ?? input.payload.title ?? input.sourceEventId

  return String(message)
}

function getEventType(input: RawSourceEventInput): string {
  const payloadEventType = input.payload.eventType

  if (typeof payloadEventType === 'string' && payloadEventType.length > 0) {
    return payloadEventType
  }

  return input.source === 'git' ? 'git.commit' : `${input.source}.event`
}

function getSummary(input: RawSourceEventInput, title: string): string {
  const summary = input.payload.summary

  return typeof summary === 'string' && summary.length > 0 ? summary : title
}

function getTags(input: RawSourceEventInput): string[] {
  return getUniqueValues([input.source, ...getStringArray(input.payload.tags)])
}

function getImportanceScore(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 1
}

function getStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((item): item is string => typeof item === 'string')
}

function getUniqueValues(values: string[]): string[] {
  return Array.from(new Set(values))
}
