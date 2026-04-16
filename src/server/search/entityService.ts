import type { ResearchEvent } from '../../types/research'
import {
  compileEntities,
  type WikiEntityDraft,
} from '../wiki/entityCompiler'

export function getEntityItems(
  events: ResearchEvent[] = [],
): WikiEntityDraft[] {
  return compileEntities(events)
}
