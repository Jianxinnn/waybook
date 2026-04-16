import type { WikiEntityDraft } from '../wiki/entityCompiler'

export function getProjectEntityBySlug(
  entities: WikiEntityDraft[],
  slug: string,
): WikiEntityDraft | undefined {
  return entities.find((entity) => entity.entityType === 'project' && entity.slug === slug)
}
