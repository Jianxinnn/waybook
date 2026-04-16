import { createDatabaseClient } from '@/server/db/client';
import { loadCollectorCheckpoints, persistRawSourceEvents, persistResearchEvents, saveCollectorCheckpoints, loadResearchEvents, loadRawSourceEventCount } from '@/server/events/eventStore';
import { normalizeRawSourceEvent } from '@/server/events/normalizer';
import { sourceRegistry } from '@/server/ingest/sourceRegistry';
import { compileEntities } from '@/server/wiki/entityCompiler';
import { persistWikiEntities } from '@/server/wiki/entityStore';
import type { WaybookConfig } from '@/lib/config';
import type { CollectorCheckpointState, RawSourceEventInput } from '@/types/source';

export interface IngestJobResult {
  rawEventsCollected: number;
  rawEventsInserted: number;
  researchEventsUpserted: number;
  wikiEntitiesUpserted: number;
}

export async function runIngestJob(config: WaybookConfig): Promise<IngestJobResult> {
  const client = createDatabaseClient(config.databasePath);
  const checkpoints = await loadCollectorCheckpoints(client);
  const collectedEvents: RawSourceEventInput[] = [];
  const collectedCheckpoints: CollectorCheckpointState[] = [];

  for (const collector of sourceRegistry) {
    const result = await collector.collect({ config, checkpoints });
    collectedEvents.push(...result.events);
    collectedCheckpoints.push(...result.checkpoints);
  }

  await persistRawSourceEvents(client, collectedEvents);
  const normalizedEvents = collectedEvents.map((event) => normalizeRawSourceEvent(event));
  await persistResearchEvents(client, normalizedEvents);

  const allResearchEvents = await loadResearchEvents(client);
  const entities = compileEntities(allResearchEvents);
  await persistWikiEntities(client, entities);
  await saveCollectorCheckpoints(client, collectedCheckpoints);

  return {
    rawEventsCollected: collectedEvents.length,
    rawEventsInserted: await loadRawSourceEventCount(client),
    researchEventsUpserted: allResearchEvents.length,
    wikiEntitiesUpserted: entities.length
  };
}
