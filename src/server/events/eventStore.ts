import { desc, eq } from 'drizzle-orm';
import type { DatabaseClient } from '@/server/db/client';
import { collectorCheckpoints, rawSourceEvents, researchEvents } from '@/server/db/schema';
import type {
  CollectorCheckpointState,
  RawSourceEventInput
} from '@/types/source';
import type { ResearchEvent } from '@/types/research';
import { makeCheckpointKey } from '@/types/source';

function parseJsonArray(value: string) {
  return JSON.parse(value) as string[];
}

export async function loadCollectorCheckpoints(client: DatabaseClient) {
  const rows = await client.db.select().from(collectorCheckpoints);

  return new Map(
    rows.map((row) => [
      makeCheckpointKey(row.connectorId as any, row.scopeKey),
      {
        connectorId: row.connectorId as any,
        scopeKey: row.scopeKey,
        cursorToken: row.cursorToken,
        updatedAt: row.updatedAt
      } satisfies CollectorCheckpointState
    ])
  );
}

export async function saveCollectorCheckpoints(
  client: DatabaseClient,
  checkpoints: CollectorCheckpointState[]
) {
  for (const checkpoint of checkpoints) {
    const id = makeCheckpointKey(checkpoint.connectorId, checkpoint.scopeKey);

    await client.db
      .insert(collectorCheckpoints)
      .values({
        id,
        connectorId: checkpoint.connectorId,
        scopeKey: checkpoint.scopeKey,
        cursorToken: checkpoint.cursorToken,
        updatedAt: checkpoint.updatedAt
      })
      .onConflictDoUpdate({
        target: collectorCheckpoints.id,
        set: {
          cursorToken: checkpoint.cursorToken,
          updatedAt: checkpoint.updatedAt
        }
      });
  }
}

export async function persistRawSourceEvents(
  client: DatabaseClient,
  events: RawSourceEventInput[]
) {
  for (const event of events) {
    await client.db
      .insert(rawSourceEvents)
      .values({
        id: event.id,
        sourceFamily: event.sourceFamily,
        connectorId: event.connectorId,
        provenanceTier: event.provenanceTier,
        sourceEventId: event.sourceEventId,
        projectKey: event.projectKey,
        repoPath: event.repoPath,
        capturedAt: event.capturedAt,
        occurredAt: event.occurredAt,
        cursorToken: event.cursorToken,
        sessionId: event.sessionId,
        threadId: event.threadId,
        payloadJson: JSON.stringify(event.payload)
      })
      .onConflictDoUpdate({
        target: [rawSourceEvents.connectorId, rawSourceEvents.sourceEventId],
        set: {
          projectKey: event.projectKey,
          repoPath: event.repoPath,
          occurredAt: event.occurredAt,
          payloadJson: JSON.stringify(event.payload)
        }
      });
  }
}

export async function persistResearchEvents(
  client: DatabaseClient,
  events: ResearchEvent[]
) {
  for (const event of events) {
    await client.db
      .insert(researchEvents)
      .values({
        id: event.id,
        rawEventId: event.rawEventId,
        sourceFamily: event.sourceFamily,
        connectorId: event.connectorId,
        provenanceTier: event.provenanceTier,
        eventType: event.eventType,
        title: event.title,
        summary: event.summary,
        projectKey: event.projectKey,
        repoPath: event.repoPath,
        threadKey: event.threadKey,
        occurredAt: event.occurredAt,
        actorKind: event.actorKind,
        evidenceRefsJson: JSON.stringify(event.evidenceRefs),
        filesJson: JSON.stringify(event.files),
        tagsJson: JSON.stringify(event.tags),
        importanceScore: event.importanceScore
      })
      .onConflictDoUpdate({
        target: researchEvents.id,
        set: {
          title: event.title,
          summary: event.summary,
          filesJson: JSON.stringify(event.files),
          tagsJson: JSON.stringify(event.tags),
          importanceScore: event.importanceScore
        }
      });
  }
}

export async function loadResearchEvents(client: DatabaseClient): Promise<ResearchEvent[]> {
  const rows = await client.db.select().from(researchEvents).orderBy(desc(researchEvents.occurredAt));

  return rows.map((row) => ({
    id: row.id,
    rawEventId: row.rawEventId,
    sourceFamily: row.sourceFamily as ResearchEvent['sourceFamily'],
    connectorId: row.connectorId as ResearchEvent['connectorId'],
    provenanceTier: row.provenanceTier as ResearchEvent['provenanceTier'],
    eventType: row.eventType,
    title: row.title,
    summary: row.summary,
    projectKey: row.projectKey,
    repoPath: row.repoPath,
    threadKey: row.threadKey,
    occurredAt: row.occurredAt,
    actorKind: row.actorKind as ResearchEvent['actorKind'],
    evidenceRefs: parseJsonArray(row.evidenceRefsJson),
    files: parseJsonArray(row.filesJson),
    tags: parseJsonArray(row.tagsJson),
    importanceScore: row.importanceScore
  }));
}

export async function loadRawSourceEventCount(client: DatabaseClient) {
  const rows = await client.db.select().from(rawSourceEvents);
  return rows.length;
}

export async function hasResearchEvents(client: DatabaseClient) {
  const row = await client.db.select().from(researchEvents).limit(1);
  return row.length > 0;
}

export async function getResearchEventById(client: DatabaseClient, eventId: string) {
  const row = await client.db
    .select()
    .from(researchEvents)
    .where(eq(researchEvents.id, eventId))
    .limit(1);

  if (!row[0]) {
    return null;
  }

  return loadResearchEvents({
    ...client,
    db: {
      ...client.db
    }
  } as DatabaseClient).then((events) => events.find((event) => event.id === eventId) ?? null);
}
