import type { SourceCollector } from '../../types/source'

import { seededRawSourceEvents } from './seedData'

export const gitCollector: SourceCollector = {
  source: 'git',
  async collect() {
    return [seededRawSourceEvents.git]
  },
}
