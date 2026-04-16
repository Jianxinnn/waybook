import type { ResearchEvent } from '../../types/research'

import { getBootstrapSnapshot } from '../bootstrap/pipeline'
import { loadResearchEvents } from '../events/eventStore'
import { compileEntities } from '../wiki/entityCompiler'
import { persistWikiEntities } from '../wiki/entityRepository'

export async function rebuildEntities(events?: ResearchEvent[]) {
  const researchEvents = events ?? (await getBootstrapSnapshot()).researchEvents
  const persistedResearchEvents = events ?? loadResearchEvents()

  return persistWikiEntities(
    compileEntities(persistedResearchEvents.length > 0 ? persistedResearchEvents : researchEvents),
  )
}
