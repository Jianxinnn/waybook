import type { CollectResult, SourceCollector } from '@/types/source';
import { seededRawEvents } from './seedFixtures';

export const seedCollector: SourceCollector = {
  sourceFamily: 'claude',
  connectorId: 'seed-fixture',
  async collect({ config }): Promise<CollectResult> {
    if (!config.seededSourcesEnabled) {
      return { events: [], checkpoints: [] };
    }

    return {
      events: seededRawEvents,
      checkpoints: [
        {
          connectorId: 'seed-fixture',
          scopeKey: 'seeded',
          cursorToken: String(seededRawEvents.length),
          updatedAt: Date.now()
        }
      ]
    };
  }
};
