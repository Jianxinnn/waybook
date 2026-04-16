import { describe, expect, it } from 'vitest'

import { sourceRegistry } from '../../src/server/ingest/sourceRegistry'
import { ingestAllSources } from '../../src/server/jobs/ingestAllSources'

describe('source registry', () => {
  it('registers the four v1 source collectors in plan order', () => {
    expect(sourceRegistry.map((collector) => collector.source)).toEqual([
      'claude-mem',
      'codex',
      'git',
      'experiment',
    ])
  })

  it('collects a deterministic seeded happy path across all four sources', async () => {
    const events = await ingestAllSources()

    expect(events).toHaveLength(4)
    expect(events.map((event) => event.source)).toEqual([
      'claude-mem',
      'codex',
      'git',
      'experiment',
    ])
    expect(events.map((event) => event.projectKey)).toEqual([
      'waybook-m1',
      'waybook-m1',
      'waybook-m1',
      'waybook-m1',
    ])
    expect(events.map((event) => event.sourceEventId)).toEqual([
      'memory-waybook-bootstrap',
      'session-waybook-dashboard',
      'commit-seeded-happy-path',
      'run-obsidian-export-smoke',
    ])
    expect(events.every((event) => Object.keys(event.payload).length > 0)).toBe(true)
  })
})
