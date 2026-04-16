import { asc, sql } from 'drizzle-orm'

import type { ResearchEvent } from '../../types/research'
import type { RawSourceEventInput } from '../../types/source'
import { db, schema } from '../db/client'

export interface StoredRawSourceEvent {
  id: string
  source: RawSourceEventInput['source']
  sourceEventId: string
  projectKey: string
  repoPath: string
  capturedAt: Date
  payloadJson: string
}

export interface StoredResearchEvent {
  id: string
  rawEventId: string
  eventType: string
  title: string
  summary: string
  projectKey: string
  repoPath: string
  threadKey: string
  occurredAt: Date
  actorKind: ResearchEvent['actorKind']
  evidenceRefsJson: string
  filesJson: string
  tagsJson: string
  importanceScore: number
}

export function serializeRawSourceEvent(
  event: RawSourceEventInput,
): StoredRawSourceEvent {
  return {
    id: event.id,
    source: event.source,
    sourceEventId: event.sourceEventId,
    projectKey: event.projectKey,
    repoPath: event.repoPath,
    capturedAt: new Date(event.capturedAt),
    payloadJson: JSON.stringify(event.payload),
  }
}

export function deserializeStoredRawSourceEvent(
  stored: Omit<StoredRawSourceEvent, 'source'> & { source: string },
): RawSourceEventInput {
  return {
    id: stored.id,
    source: stored.source as RawSourceEventInput['source'],
    sourceEventId: stored.sourceEventId,
    projectKey: stored.projectKey,
    repoPath: stored.repoPath,
    capturedAt: stored.capturedAt.getTime(),
    payload: JSON.parse(stored.payloadJson) as Record<string, unknown>,
  }
}

export function persistRawSourceEvents(
  events: RawSourceEventInput[],
): RawSourceEventInput[] {
  if (events.length === 0) {
    return []
  }

  db
    .insert(schema.rawSourceEvents)
    .values(events.map((event) => serializeRawSourceEvent(event)))
    .onConflictDoUpdate({
      target: schema.rawSourceEvents.id,
      set: {
        source: sql.raw(`excluded.${schema.rawSourceEvents.source.name}`),
        sourceEventId: sql.raw(`excluded.${schema.rawSourceEvents.sourceEventId.name}`),
        projectKey: sql.raw(`excluded.${schema.rawSourceEvents.projectKey.name}`),
        repoPath: sql.raw(`excluded.${schema.rawSourceEvents.repoPath.name}`),
        capturedAt: sql.raw(`excluded.${schema.rawSourceEvents.capturedAt.name}`),
        payloadJson: sql.raw(`excluded.${schema.rawSourceEvents.payloadJson.name}`),
      },
    })
    .run()

  return loadRawSourceEvents()
}

export function loadRawSourceEvents(): RawSourceEventInput[] {
  return db
    .select()
    .from(schema.rawSourceEvents)
    .orderBy(
      asc(schema.rawSourceEvents.capturedAt),
      asc(schema.rawSourceEvents.id),
    )
    .all()
    .map((stored) => deserializeStoredRawSourceEvent(stored))
}

export function serializeResearchEvent(
  event: ResearchEvent,
): StoredResearchEvent {
  return {
    id: event.id,
    rawEventId: event.rawEventId,
    eventType: event.eventType,
    title: event.title,
    summary: event.summary,
    projectKey: event.projectKey,
    repoPath: event.repoPath,
    threadKey: event.threadKey,
    occurredAt: new Date(event.occurredAt),
    actorKind: event.actorKind,
    evidenceRefsJson: JSON.stringify(event.evidenceRefs),
    filesJson: JSON.stringify(event.files),
    tagsJson: JSON.stringify(event.tags),
    importanceScore: event.importanceScore,
  }
}

export function deserializeStoredResearchEvent(
  stored: Omit<StoredResearchEvent, 'actorKind'> & { actorKind: string },
): ResearchEvent {
  return {
    id: stored.id,
    rawEventId: stored.rawEventId,
    eventType: stored.eventType,
    title: stored.title,
    summary: stored.summary,
    projectKey: stored.projectKey,
    repoPath: stored.repoPath,
    threadKey: stored.threadKey,
    occurredAt: stored.occurredAt.getTime(),
    actorKind: stored.actorKind as ResearchEvent['actorKind'],
    evidenceRefs: JSON.parse(stored.evidenceRefsJson) as string[],
    files: JSON.parse(stored.filesJson) as string[],
    tags: JSON.parse(stored.tagsJson) as string[],
    importanceScore: stored.importanceScore,
  }
}

export function persistResearchEvents(
  events: ResearchEvent[],
): ResearchEvent[] {
  if (events.length === 0) {
    return []
  }

  db
    .insert(schema.researchEvents)
    .values(events.map((event) => serializeResearchEvent(event)))
    .onConflictDoUpdate({
      target: schema.researchEvents.id,
      set: {
        rawEventId: sql.raw(`excluded.${schema.researchEvents.rawEventId.name}`),
        eventType: sql.raw(`excluded.${schema.researchEvents.eventType.name}`),
        title: sql.raw(`excluded.${schema.researchEvents.title.name}`),
        summary: sql.raw(`excluded.${schema.researchEvents.summary.name}`),
        projectKey: sql.raw(`excluded.${schema.researchEvents.projectKey.name}`),
        repoPath: sql.raw(`excluded.${schema.researchEvents.repoPath.name}`),
        threadKey: sql.raw(`excluded.${schema.researchEvents.threadKey.name}`),
        occurredAt: sql.raw(`excluded.${schema.researchEvents.occurredAt.name}`),
        actorKind: sql.raw(`excluded.${schema.researchEvents.actorKind.name}`),
        evidenceRefsJson: sql.raw(`excluded.${schema.researchEvents.evidenceRefsJson.name}`),
        filesJson: sql.raw(`excluded.${schema.researchEvents.filesJson.name}`),
        tagsJson: sql.raw(`excluded.${schema.researchEvents.tagsJson.name}`),
        importanceScore: sql.raw(`excluded.${schema.researchEvents.importanceScore.name}`),
      },
    })
    .run()

  return loadResearchEvents()
}

export function loadResearchEvents(): ResearchEvent[] {
  return db
    .select()
    .from(schema.researchEvents)
    .orderBy(asc(schema.researchEvents.occurredAt), asc(schema.researchEvents.id))
    .all()
    .map((stored) => deserializeStoredResearchEvent(stored))
}
