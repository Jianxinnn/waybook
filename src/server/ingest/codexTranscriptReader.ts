import type { SourceCollector } from '../../types/source'

import { seededRawSourceEvents } from './seedData'

export const codexCollector: SourceCollector = {
  source: 'codex',
  async collect() {
    return [seededRawSourceEvents.codex]
  },
}
