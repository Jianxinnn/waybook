import { describe, expect, it } from 'vitest'

import type { RawSourceEventInput } from '../../src/types/source'
import { normalizeRawSourceEvent } from '../../src/server/events/normalizer'
import { assignThreadKey } from '../../src/server/events/threadAssigner'
import {
  deserializeStoredResearchEvent,
  serializeResearchEvent,
} from '../../src/server/events/eventStore'

function createRawGitEvent(
  overrides: Partial<RawSourceEventInput> = {},
): RawSourceEventInput {
  return {
    id: 'raw-1',
    source: 'git',
    sourceEventId: 'commit-1',
    projectKey: 'demo',
    repoPath: '/tmp/demo',
    capturedAt: 1710000000000,
    payload: {
      message: 'feat: add baseline',
    },
    ...overrides,
  }
}

describe('normalizeRawSourceEvent', () => {
  it('maps a git raw event into a normalized research event', () => {
    const event = normalizeRawSourceEvent(createRawGitEvent())

    expect(event).toMatchObject({
      id: 'evt:raw-1',
      rawEventId: 'raw-1',
      projectKey: 'demo',
      repoPath: '/tmp/demo',
      eventType: 'git.commit',
      title: 'feat: add baseline',
      summary: 'feat: add baseline',
      threadKey: 'demo:feat: add baseline',
      occurredAt: 1710000000000,
      actorKind: 'user',
      evidenceRefs: ['commit-1'],
      files: [],
      tags: ['git'],
      importanceScore: 1,
    })
  })

  it('derives richer event details from seeded source payloads', () => {
    const event = normalizeRawSourceEvent({
      id: 'raw-codex-1',
      source: 'codex',
      sourceEventId: 'session-waybook-dashboard',
      projectKey: 'waybook-m1',
      repoPath: '/public/home/jxtang/project/cs/waybook/.worktrees/waybook-m1',
      capturedAt: 1713326400000,
      payload: {
        eventType: 'codex.task',
        title: 'Wire dashboard to seeded pipeline',
        summary: 'Connected the home and timeline surfaces to the bootstrap pipeline.',
        tags: ['dashboard', 'timeline'],
        files: ['src/app/page.tsx', 'src/app/timeline/page.tsx'],
        importanceScore: 3,
      },
    })

    expect(event).toMatchObject({
      eventType: 'codex.task',
      title: 'Wire dashboard to seeded pipeline',
      summary: 'Connected the home and timeline surfaces to the bootstrap pipeline.',
      actorKind: 'agent',
      files: ['src/app/page.tsx', 'src/app/timeline/page.tsx'],
      tags: ['codex', 'dashboard', 'timeline'],
      importanceScore: 3,
    })
  })

  it('falls back to a generic source event type and source event id title', () => {
    const event = normalizeRawSourceEvent({
      ...createRawGitEvent({
        id: 'raw-2',
        source: 'codex',
        sourceEventId: 'session-9',
        payload: {},
      }),
    })

    expect(event.eventType).toBe('codex.event')
    expect(event.title).toBe('session-9')
    expect(event.summary).toBe('session-9')
    expect(event.actorKind).toBe('agent')
    expect(event.threadKey).toBe('demo:session-9')
    expect(event.tags).toEqual(['codex'])
  })
})

describe('assignThreadKey', () => {
  it('derives a stable project-scoped thread key from the title', () => {
    expect(
      assignThreadKey({
        projectKey: 'demo',
        title: '  Feat: Add Baseline  ',
      }),
    ).toBe('demo:feat: add baseline')
  })
})

describe('event store serialization', () => {
  it('serializes and deserializes a normalized research event for persistence', () => {
    const event = normalizeRawSourceEvent(createRawGitEvent())

    expect(deserializeStoredResearchEvent(serializeResearchEvent(event))).toEqual(
      event,
    )
  })
})
