import type { SourceCollector } from '../../types/source'

import { seededRawSourceEvents } from './seedData'

export const claudeMemCollector: SourceCollector = {
  source: 'claude-mem',
  async collect() {
    return [seededRawSourceEvents['claude-mem']]
  },
}
