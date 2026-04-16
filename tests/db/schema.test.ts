import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import {
  rawSourceEvents,
  researchEvents,
  wikiEntities,
} from '../../src/server/db/schema'

function expectColumns(table: object, columnNames: string[]) {
  const tableRecord = table as Record<string, unknown>

  expect(Object.keys(tableRecord).sort()).toEqual([...columnNames].sort())
}

function expectOverridableDbPath(relativePath: string) {
  const source = readFileSync(new URL(relativePath, import.meta.url), 'utf8')

  expect(source).toContain("process.env.WAYBOOK_DB_PATH ?? './data/waybook.db'")
}

describe('database schema', () => {
  it('exports the planned persistence tables', () => {
    expect(rawSourceEvents).toBeDefined()
    expect(researchEvents).toBeDefined()
    expect(wikiEntities).toBeDefined()
  })

  it('defines the full planned raw source event field set', () => {
    expectColumns(rawSourceEvents, [
      'id',
      'source',
      'sourceEventId',
      'projectKey',
      'repoPath',
      'capturedAt',
      'payloadJson',
    ])
  })

  it('defines the full planned research event field set', () => {
    expectColumns(researchEvents, [
      'id',
      'rawEventId',
      'eventType',
      'title',
      'summary',
      'projectKey',
      'repoPath',
      'threadKey',
      'occurredAt',
      'actorKind',
      'evidenceRefsJson',
      'filesJson',
      'tagsJson',
      'importanceScore',
    ])
  })

  it('defines the full planned wiki entity field set', () => {
    expectColumns(wikiEntities, [
      'id',
      'entityType',
      'slug',
      'title',
      'canonicalSummary',
      'status',
      'sourceThreadIdsJson',
      'supportingEventIdsJson',
      'outboundEntityIdsJson',
      'managedMarkdown',
      'obsidianPath',
    ])
  })

  it('uses the overridable database path consistently in db setup files', () => {
    expectOverridableDbPath('../../drizzle.config.ts')
    expectOverridableDbPath('../../src/server/db/client.ts')
    expectOverridableDbPath('../../src/server/db/migrate.ts')
  })
})
