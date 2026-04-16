import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import type { WikiEntityDraft } from '../wiki/entityCompiler'
import { renderEntityMarkdown } from '../wiki/markdownRenderer'

const frontmatterPattern = /^---\n[\s\S]*?\n---/
const managedBlockPattern = /<!-- waybook:managed:start -->[\s\S]*?<!-- waybook:managed:end -->/

export function getObsidianEntityPath(outputRoot: string, entity: WikiEntityDraft) {
  return path.join(outputRoot, 'Waybook', getEntityFolder(entity), `${entity.slug}.md`)
}

export async function exportEntity(outputRoot: string, entity: WikiEntityDraft) {
  const filePath = getObsidianEntityPath(outputRoot, entity)
  const managedMarkdown = renderEntityMarkdown(entity)

  await mkdir(path.dirname(filePath), { recursive: true })

  const existingMarkdown = await readExistingMarkdown(filePath)
  const nextMarkdown = existingMarkdown === null
    ? managedMarkdown
    : mergeManagedMarkdown(existingMarkdown, managedMarkdown)

  await writeFile(filePath, nextMarkdown, 'utf8')

  return filePath
}

export async function exportToObsidian(
  outputRoot: string,
  entities: WikiEntityDraft[] = [],
) {
  return Promise.all(entities.map((entity) => exportEntity(outputRoot, entity)))
}

function getEntityFolder(entity: WikiEntityDraft): string {
  switch (entity.entityType) {
    case 'topic':
      return 'Topics'
    case 'experiment':
      return 'Experiments'
    case 'project':
    default:
      return 'Projects'
  }
}

async function readExistingMarkdown(filePath: string): Promise<string | null> {
  try {
    return await readFile(filePath, 'utf8')
  } catch (error) {
    if (isMissingFileError(error)) {
      return null
    }

    throw error
  }
}

function mergeManagedMarkdown(existingMarkdown: string, managedMarkdown: string): string {
  const nextFrontmatter = getFrontmatter(managedMarkdown)
  const nextManagedBlock = getManagedBlock(managedMarkdown)
  const contentWithoutFrontmatter = stripFrontmatter(existingMarkdown)

  const mergedBody = managedBlockPattern.test(contentWithoutFrontmatter)
    ? contentWithoutFrontmatter.replace(managedBlockPattern, nextManagedBlock)
    : appendManagedBlock(contentWithoutFrontmatter, nextManagedBlock)

  return `${nextFrontmatter}\n\n${mergedBody.trimStart()}`.trimEnd()
}

function getFrontmatter(markdown: string): string {
  const match = markdown.match(frontmatterPattern)

  return match?.[0] ?? ''
}

function stripFrontmatter(markdown: string): string {
  return markdown.replace(frontmatterPattern, '').trimStart()
}

function appendManagedBlock(existingMarkdown: string, managedBlock: string): string {
  const trimmed = existingMarkdown.trimEnd()

  return trimmed.length === 0 ? managedBlock : `${trimmed}\n\n${managedBlock}`
}

function getManagedBlock(markdown: string): string {
  const match = markdown.match(managedBlockPattern)

  return match?.[0] ?? markdown
}

function isMissingFileError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT'
}
