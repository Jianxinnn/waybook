import { describe, expect, it } from 'vitest'

import type { ResearchEvent } from '../../src/types/research'
import { getTimelineEvents } from '../../src/server/search/timelineService'
import { withTestDatabase } from '../support/testDb'

function createResearchEvent(
  overrides: Partial<ResearchEvent> = {},
): ResearchEvent {
  return {
    id: 'evt-1',
    rawEventId: 'raw-1',
    eventType: 'git.commit',
    title: 'feat: add baseline',
    summary: 'feat: add baseline',
    projectKey: 'alpha',
    repoPath: '/tmp/alpha',
    threadKey: 'alpha:baseline',
    occurredAt: 1710000000000,
    actorKind: 'user',
    evidenceRefs: ['commit-1'],
    files: [],
    tags: ['git'],
    importanceScore: 1,
    ...overrides,
  }
}

describe('timeline service', () => {
  it('sorts research events reverse-chronologically', () => {
    const events = getTimelineEvents([
      createResearchEvent({ id: 'evt-older', occurredAt: 1710000000000 }),
      createResearchEvent({ id: 'evt-newest', occurredAt: 1710000002000 }),
      createResearchEvent({ id: 'evt-middle', occurredAt: 1710000001000 }),
    ])

    expect(events.map((event) => event.id)).toEqual([
      'evt-newest',
      'evt-middle',
      'evt-older',
    ])
  })
})

describe('timeline route', () => {
  it('returns seeded timeline items from the persisted pipeline', async () => {
    await withTestDatabase(async () => {
      const { GET: getTimeline } = await import('../../src/app/api/timeline/route')

      const response = await getTimeline()

      expect(response.status).toBe(200)
      await expect(response.json()).resolves.toMatchObject({
        items: expect.arrayContaining([
          expect.objectContaining({
            id: 'evt:raw-exp-obsidian',
            projectKey: 'waybook-m1',
            title: 'Validate Obsidian export keeps manual notes',
          }),
          expect.objectContaining({
            id: 'evt:raw-git-bootstrap',
            projectKey: 'waybook-m1',
            title: 'feat: wire seeded M1 happy path',
          }),
        ]),
      })
    })
  })
})

describe('entities route', () => {
  it('returns project, topic, and experiment entities from the persisted pipeline', async () => {
    await withTestDatabase(async () => {
      const { GET: getEntities } = await import('../../src/app/api/entities/route')

      const response = await getEntities()

      expect(response.status).toBe(200)
      await expect(response.json()).resolves.toMatchObject({
        items: expect.arrayContaining([
          expect.objectContaining({
            id: 'project:waybook-m1',
            entityType: 'project',
            slug: 'waybook-m1',
          }),
          expect.objectContaining({
            id: 'topic:obsidian',
            entityType: 'topic',
            slug: 'obsidian',
          }),
          expect.objectContaining({
            id: 'experiment:validate-obsidian-export-keeps-manual-notes',
            entityType: 'experiment',
            slug: 'validate-obsidian-export-keeps-manual-notes',
          }),
        ]),
      })
    })
  })
})

describe('search route', () => {
  it('returns matching seeded entities and query metadata from persisted records', async () => {
    await withTestDatabase(async () => {
      const { GET: getSearch } = await import('../../src/app/api/search/route')

      const response = await getSearch(
        new Request('http://localhost/api/search?q=obsidian'),
      )

      expect(response.status).toBe(200)
      await expect(response.json()).resolves.toMatchObject({
        query: 'obsidian',
        items: expect.arrayContaining([
          expect.objectContaining({
            id: 'topic:obsidian',
            entityType: 'topic',
            slug: 'obsidian',
          }),
          expect.objectContaining({
            id: 'experiment:validate-obsidian-export-keeps-manual-notes',
            entityType: 'experiment',
            slug: 'validate-obsidian-export-keeps-manual-notes',
          }),
        ]),
      })
    })
  })
})
