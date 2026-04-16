import type { SourceCollector } from '../../types/source'

import { seededRawSourceEvents } from './seedData'

export const experimentCollector: SourceCollector = {
  source: 'experiment',
  async collect() {
    return [seededRawSourceEvents.experiment]
  },
}
