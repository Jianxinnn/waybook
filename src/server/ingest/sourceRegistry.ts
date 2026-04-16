import { claudeCollector } from './claudeCollector';
import { claudeMemCollector } from './claudeMemCollector';
import { codexCollector } from './codexCollector';
import { gitCollector } from './gitCollector';
import { experimentCollector } from './experimentCollector';
import { seedCollector } from './seedCollector';

export const sourceRegistry = [
  claudeCollector,
  claudeMemCollector,
  codexCollector,
  gitCollector,
  experimentCollector,
  seedCollector
];
