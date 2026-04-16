import type { ResearchEvent } from '../../types/research'
import type { RawSourceEventInput } from '../../types/source'

import {
  loadRawSourceEvents,
  loadResearchEvents,
  persistRawSourceEvents,
  persistResearchEvents,
} from '../events/eventStore'
import { normalizeRawSourceEvent } from '../events/normalizer'
import { ingestAllSources } from '../jobs/ingestAllSources'
import { getEntityItems } from '../search/entityService'
import { getTimelineEvents } from '../search/timelineService'
import { loadWikiEntities, persistWikiEntities } from '../wiki/entityRepository'

export interface BootstrapSnapshot {
  rawEvents: RawSourceEventInput[]
  researchEvents: ResearchEvent[]
  timelineEvents: ResearchEvent[]
  entities: ReturnType<typeof getEntityItems>
}

let bootstrapSnapshotPromise: Promise<BootstrapSnapshot> | null = null

async function buildBootstrapSnapshot(): Promise<BootstrapSnapshot> {
  persistRawSourceEvents(await ingestAllSources())
  const persistedRawEvents = loadRawSourceEvents()

  persistResearchEvents(persistedRawEvents.map((event) => normalizeRawSourceEvent(event)))
  const persistedResearchEvents = loadResearchEvents()

  persistWikiEntities(getEntityItems(persistedResearchEvents))

  return {
    rawEvents: persistedRawEvents,
    researchEvents: persistedResearchEvents,
    timelineEvents: getTimelineEvents(persistedResearchEvents),
    entities: loadWikiEntities(),
  }
}

export function getBootstrapSnapshot(): Promise<BootstrapSnapshot> {
  bootstrapSnapshotPromise ??= buildBootstrapSnapshot()
  return bootstrapSnapshotPromise
}

export function resetBootstrapSnapshotForTests() {
  bootstrapSnapshotPromise = null
}
