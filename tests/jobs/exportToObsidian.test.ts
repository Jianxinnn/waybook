import { mkdir, mkdtemp, readFile, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import type { WikiEntityDraft } from '../../src/server/wiki/entityCompiler'

const tempDirs: string[] = []

function createEntity(overrides: Partial<WikiEntityDraft> = {}): WikiEntityDraft {
  return {
    id: 'project:alpha',
    entityType: 'project',
    slug: 'alpha',
    title: 'Alpha Project',
    canonicalSummary: 'Recent activity for alpha.',
    sourceThreadIds: ['alpha:baseline'],
    supportingEventIds: ['evt-1'],
    outboundEntityIds: [],
    status: 'draft',
    ...overrides,
  }
}

async function createTempDir() {
  const directory = await mkdtemp(path.join(tmpdir(), 'waybook-export-'))
  tempDirs.push(directory)
  return directory
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((directory) => rm(directory, { recursive: true, force: true })))
})

describe('exportToObsidian', () => {
  it('writes managed markdown to the entity-type-specific subtree', async () => {
    const outputRoot = await createTempDir()
    const { exportToObsidian } = await import('../../src/server/jobs/exportToObsidian')

    await exportToObsidian(outputRoot, [
      createEntity(),
      createEntity({
        id: 'topic:obsidian',
        entityType: 'topic',
        slug: 'obsidian',
        title: 'Obsidian',
      }),
    ])

    const projectMarkdown = await readFile(
      path.join(outputRoot, 'Waybook', 'Projects', 'alpha.md'),
      'utf8',
    )
    const topicMarkdown = await readFile(
      path.join(outputRoot, 'Waybook', 'Topics', 'obsidian.md'),
      'utf8',
    )

    expect(projectMarkdown).toContain('<!-- waybook:managed:start -->')
    expect(projectMarkdown).toContain('# Alpha Project')
    expect(topicMarkdown).toContain('# Obsidian')
  })

  it('refreshes frontmatter and managed content while preserving unmanaged user notes on re-export', async () => {
    const outputRoot = await createTempDir()
    const { exportEntity, getObsidianEntityPath } = await import('../../src/server/jobs/exportToObsidian')
    const entity = createEntity({
      title: 'Alpha Project Updated',
      canonicalSummary: 'Fresh managed summary.',
      supportingEventIds: ['evt-2'],
    })
    const filePath = getObsidianEntityPath(outputRoot, entity)

    await mkdir(path.dirname(filePath), { recursive: true })

    await writeFile(
      filePath,
      [
        '---',
        'title: Stale Title',
        'entity_type: topic',
        'slug: stale-slug',
        'status: archived',
        '---',
        '',
        'My manual intro note.',
        '',
        '<!-- waybook:managed:start -->',
        'Old managed content',
        '<!-- waybook:managed:end -->',
        '',
        'My manual footer note.',
      ].join('\n'),
      'utf8',
    )

    await exportEntity(outputRoot, entity)

    const markdown = await readFile(filePath, 'utf8')

    expect(markdown).toContain('title: Alpha Project Updated')
    expect(markdown).toContain('entity_type: project')
    expect(markdown).toContain('slug: alpha')
    expect(markdown).toContain('status: draft')
    expect(markdown).not.toContain('title: Stale Title')
    expect(markdown).not.toContain('entity_type: topic')
    expect(markdown).not.toContain('slug: stale-slug')
    expect(markdown).not.toContain('status: archived')
    expect(markdown).toContain('My manual intro note.')
    expect(markdown).toContain('My manual footer note.')
    expect(markdown).toContain('Fresh managed summary.')
    expect(markdown).not.toContain('Old managed content')
  })

  it('exports every entity through the batch entry point', async () => {
    const outputRoot = await createTempDir()
    const { exportToObsidian } = await import('../../src/server/jobs/exportToObsidian')

    const exportedPaths = await exportToObsidian(outputRoot, [
      createEntity(),
      createEntity({
        id: 'project:beta',
        slug: 'beta',
        title: 'Beta Project',
        supportingEventIds: ['evt-2'],
      }),
    ])

    expect(exportedPaths).toEqual([
      path.join(outputRoot, 'Waybook', 'Projects', 'alpha.md'),
      path.join(outputRoot, 'Waybook', 'Projects', 'beta.md'),
    ])

    await expect(
      readFile(path.join(outputRoot, 'Waybook', 'Projects', 'alpha.md'), 'utf8'),
    ).resolves.toContain('# Alpha Project')
    await expect(
      readFile(path.join(outputRoot, 'Waybook', 'Projects', 'beta.md'), 'utf8'),
    ).resolves.toContain('# Beta Project')
  })
})

describe('config', () => {
  it('uses planned defaults for db, obsidian export, and claude-mem base url', async () => {
    const previousDbPath = process.env.WAYBOOK_DB_PATH
    const previousObsidianPath = process.env.WAYBOOK_OBSIDIAN_PATH
    const previousClaudeMemBaseUrl = process.env.CLAUDE_MEM_BASE_URL

    delete process.env.WAYBOOK_DB_PATH
    delete process.env.WAYBOOK_OBSIDIAN_PATH
    delete process.env.CLAUDE_MEM_BASE_URL

    try {
      const { getConfig } = await import('../../src/lib/config')

      expect(getConfig()).toEqual({
        WAYBOOK_DB_PATH: './data/waybook.db',
        WAYBOOK_OBSIDIAN_PATH: './exports/obsidian',
        CLAUDE_MEM_BASE_URL: 'http://localhost:37777',
      })
    } finally {
      restoreEnv('WAYBOOK_DB_PATH', previousDbPath)
      restoreEnv('WAYBOOK_OBSIDIAN_PATH', previousObsidianPath)
      restoreEnv('CLAUDE_MEM_BASE_URL', previousClaudeMemBaseUrl)
    }
  })
})

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name]
    return
  }

  process.env[name] = value
}
