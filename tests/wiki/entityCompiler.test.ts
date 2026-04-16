import { describe, expect, it } from 'vitest'

import type { ResearchEvent } from '../../src/types/research'
import { compileEntities } from '../../src/server/wiki/entityCompiler'
import { renderEntityMarkdown } from '../../src/server/wiki/markdownRenderer'

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
    occurredAt: 1,
    actorKind: 'user',
    evidenceRefs: ['commit-1'],
    files: [],
    tags: ['git'],
    importanceScore: 1,
    ...overrides,
  }
}

describe('compileEntities', () => {
  it('creates a project entity from research events and links topic plus experiment entities', () => {
    const entities = compileEntities([
      createResearchEvent({
        tags: ['git', 'workflow'],
      }),
      createResearchEvent({
        id: 'evt-2',
        rawEventId: 'raw-2',
        eventType: 'experiment.run',
        threadKey: 'alpha:follow-up',
        title: 'Validate export merge',
        summary: 'Validate export merge',
        tags: ['experiment', 'workflow'],
      }),
    ])

    expect(entities).toContainEqual(
      expect.objectContaining({
        id: 'project:alpha',
        entityType: 'project',
        slug: 'alpha',
        title: 'Alpha',
        canonicalSummary: '2 recorded research events across 2 sources.',
        sourceThreadIds: ['alpha:baseline', 'alpha:follow-up'],
        supportingEventIds: ['evt-1', 'evt-2'],
        outboundEntityIds: ['topic:workflow', 'experiment:validate-export-merge'],
        status: 'draft',
      }),
    )
  })

  it('creates topic entities linked back to the project and filtered tags', () => {
    const entities = compileEntities([
      createResearchEvent({
        tags: ['git', 'workflow'],
        title: 'Ship bootstrap pipeline',
        summary: 'Connect the dashboard to real data.',
      }),
      createResearchEvent({
        id: 'evt-2',
        rawEventId: 'raw-2',
        tags: ['workflow', 'codex'],
        title: 'Review the seeded path',
        summary: 'Verify the end-to-end path.',
        threadKey: 'alpha:review',
      }),
    ])

    expect(entities).toContainEqual(
      expect.objectContaining({
        id: 'topic:workflow',
        entityType: 'topic',
        slug: 'workflow',
        title: 'Workflow',
        canonicalSummary: '2 research events reference workflow.',
        sourceThreadIds: ['alpha:baseline', 'alpha:review'],
        supportingEventIds: ['evt-1', 'evt-2'],
        outboundEntityIds: ['project:alpha'],
        status: 'draft',
      }),
    )

    expect(entities.find((entity) => entity.id === 'topic:codex')).toBeUndefined()
  })

  it('creates experiment entities from experiment research events', () => {
    const entities = compileEntities([
      createResearchEvent({
        tags: ['workflow'],
      }),
      createResearchEvent({
        id: 'evt-2',
        rawEventId: 'raw-2',
        eventType: 'experiment.run',
        title: 'Validate export merge',
        summary: 'Keep frontmatter and manual notes aligned.',
        tags: ['experiment', 'obsidian'],
        threadKey: 'alpha:experiment',
      }),
    ])

    expect(entities).toContainEqual(
      expect.objectContaining({
        id: 'experiment:validate-export-merge',
        entityType: 'experiment',
        slug: 'validate-export-merge',
        title: 'Validate Export Merge',
        canonicalSummary: 'Keep frontmatter and manual notes aligned.',
        sourceThreadIds: ['alpha:experiment'],
        supportingEventIds: ['evt-2'],
        outboundEntityIds: ['project:alpha', 'topic:obsidian'],
        status: 'draft',
      }),
    )
  })
})

describe('renderEntityMarkdown', () => {
  it('wraps managed wiki content in managed block markers', () => {
    const markdown = renderEntityMarkdown({
      id: 'project:alpha',
      entityType: 'project',
      slug: 'alpha',
      title: 'alpha',
      canonicalSummary: 'Recent activity for alpha',
      sourceThreadIds: ['alpha:baseline'],
      supportingEventIds: ['evt-1'],
      outboundEntityIds: [],
      status: 'draft',
    })

    expect(markdown).toContain('<!-- waybook:managed:start -->')
    expect(markdown).toContain('<!-- waybook:managed:end -->')
    expect(markdown).toContain('# alpha')
    expect(markdown).toContain('- evt-1')
  })
})
