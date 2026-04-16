import type { SourceCollector } from '../../types/source'

import { claudeMemCollector } from './claudeMemClient'
import { codexCollector } from './codexTranscriptReader'
import { experimentCollector } from './experimentCollector'
import { gitCollector } from './gitCollector'

export const sourceRegistry: SourceCollector[] = [
  claudeMemCollector,
  codexCollector,
  gitCollector,
  experimentCollector,
]
