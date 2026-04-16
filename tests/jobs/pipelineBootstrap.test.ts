import { describe, expect, it } from 'vitest'

import { withTestDatabase } from '../support/testDb'

describe('bootstrap pipeline', () => {
  it('persists raw events, research events, and wiki entities to sqlite and reloads from persisted records idempotently', async () => {
    await withTestDatabase(async ({ query }) => {
      const { getBootstrapSnapshot, resetBootstrapSnapshotForTests } = await import('../../src/server/bootstrap/pipeline')

      const firstSnapshot = await getBootstrapSnapshot()

      expect(firstSnapshot.rawEvents).toHaveLength(4)
      expect(firstSnapshot.researchEvents).toHaveLength(4)
      expect(firstSnapshot.entities).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'project:waybook-m1',
            entityType: 'project',
          }),
          expect.objectContaining({
            id: 'topic:obsidian',
            entityType: 'topic',
          }),
          expect.objectContaining({
            id: 'experiment:validate-obsidian-export-keeps-manual-notes',
            entityType: 'experiment',
          }),
        ]),
      )

      expect(query<{ id: string }>('select id from raw_source_events order by id')).toEqual([
        { id: 'raw-codex-dashboard' },
        { id: 'raw-exp-obsidian' },
        { id: 'raw-git-bootstrap' },
        { id: 'raw-mem-bootstrap' },
      ])
      expect(query<{ id: string }>('select id from research_events order by id')).toEqual([
        { id: 'evt:raw-codex-dashboard' },
        { id: 'evt:raw-exp-obsidian' },
        { id: 'evt:raw-git-bootstrap' },
        { id: 'evt:raw-mem-bootstrap' },
      ])
      expect(query<{ id: string; entity_type: string }>('select id, entity_type from wiki_entities order by id')).toEqual(
        expect.arrayContaining([
          {
            id: 'experiment:validate-obsidian-export-keeps-manual-notes',
            entity_type: 'experiment',
          },
          {
            id: 'project:waybook-m1',
            entity_type: 'project',
          },
          {
            id: 'topic:obsidian',
            entity_type: 'topic',
          },
        ]),
      )

      resetBootstrapSnapshotForTests()

      const secondSnapshot = await getBootstrapSnapshot()

      expect(secondSnapshot).toEqual(firstSnapshot)
      expect(query<{ count: number }>('select count(*) as count from raw_source_events')).toEqual([{ count: 4 }])
      expect(query<{ count: number }>('select count(*) as count from research_events')).toEqual([{ count: 4 }])
      expect(query<{ count: number }>('select count(*) as count from wiki_entities')).toEqual([{ count: 9 }])
    })
  })

  it('rebuilds stored entities from persisted research events', async () => {
    await withTestDatabase(async ({ query }) => {
      const { getBootstrapSnapshot } = await import('../../src/server/bootstrap/pipeline')
      const { rebuildEntities } = await import('../../src/server/jobs/rebuildEntities')

      await getBootstrapSnapshot()
      const entities = await rebuildEntities()

      expect(entities).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'project:waybook-m1',
            entityType: 'project',
            title: 'Waybook M1',
          }),
          expect.objectContaining({
            id: 'experiment:validate-obsidian-export-keeps-manual-notes',
            entityType: 'experiment',
            title: 'Validate Obsidian Export Keeps Manual Notes',
          }),
          expect.objectContaining({
            id: 'topic:obsidian',
            entityType: 'topic',
            title: 'Obsidian',
          }),
        ]),
      )
      expect(query<{ count: number }>('select count(*) as count from wiki_entities')).toEqual([{ count: 9 }])
    })
  })
})
