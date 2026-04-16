import { asc, sql } from 'drizzle-orm'

import { db, schema } from '../db/client'
import { renderEntityMarkdown } from './markdownRenderer'
import type { WikiEntityDraft } from './entityCompiler'

export interface StoredWikiEntity {
  id: string
  entityType: WikiEntityDraft['entityType']
  slug: string
  title: string
  canonicalSummary: string
  status: WikiEntityDraft['status']
  sourceThreadIdsJson: string
  supportingEventIdsJson: string
  outboundEntityIdsJson: string
  managedMarkdown: string
  obsidianPath: string | null
}

export function createStoredWikiEntity(
  entity: WikiEntityDraft,
): StoredWikiEntity {
  return {
    id: entity.id,
    entityType: entity.entityType,
    slug: entity.slug,
    title: entity.title,
    canonicalSummary: entity.canonicalSummary,
    status: entity.status,
    sourceThreadIdsJson: JSON.stringify(entity.sourceThreadIds),
    supportingEventIdsJson: JSON.stringify(entity.supportingEventIds),
    outboundEntityIdsJson: JSON.stringify(entity.outboundEntityIds),
    managedMarkdown: renderEntityMarkdown(entity),
    obsidianPath: null,
  }
}

export function persistWikiEntities(
  entities: WikiEntityDraft[],
): WikiEntityDraft[] {
  if (entities.length === 0) {
    return []
  }

  db
    .insert(schema.wikiEntities)
    .values(entities.map((entity) => createStoredWikiEntity(entity)))
    .onConflictDoUpdate({
      target: schema.wikiEntities.id,
      set: {
        entityType: sql.raw(`excluded.${schema.wikiEntities.entityType.name}`),
        slug: sql.raw(`excluded.${schema.wikiEntities.slug.name}`),
        title: sql.raw(`excluded.${schema.wikiEntities.title.name}`),
        canonicalSummary: sql.raw(`excluded.${schema.wikiEntities.canonicalSummary.name}`),
        status: sql.raw(`excluded.${schema.wikiEntities.status.name}`),
        sourceThreadIdsJson: sql.raw(`excluded.${schema.wikiEntities.sourceThreadIdsJson.name}`),
        supportingEventIdsJson: sql.raw(`excluded.${schema.wikiEntities.supportingEventIdsJson.name}`),
        outboundEntityIdsJson: sql.raw(`excluded.${schema.wikiEntities.outboundEntityIdsJson.name}`),
        managedMarkdown: sql.raw(`excluded.${schema.wikiEntities.managedMarkdown.name}`),
      },
    })
    .run()

  return loadWikiEntities()
}

export function loadWikiEntities(): WikiEntityDraft[] {
  return db
    .select()
    .from(schema.wikiEntities)
    .orderBy(asc(schema.wikiEntities.id))
    .all()
    .map((stored) => hydrateWikiEntityDraft(stored))
}

export function hydrateWikiEntityDraft(
  stored: Omit<StoredWikiEntity, 'entityType' | 'status'> & {
    entityType: string
    status: string
  },
): WikiEntityDraft {
  return {
    id: stored.id,
    entityType: stored.entityType as WikiEntityDraft['entityType'],
    slug: stored.slug,
    title: stored.title,
    canonicalSummary: stored.canonicalSummary,
    sourceThreadIds: JSON.parse(stored.sourceThreadIdsJson) as string[],
    supportingEventIds: JSON.parse(stored.supportingEventIdsJson) as string[],
    outboundEntityIds: JSON.parse(stored.outboundEntityIdsJson) as string[],
    status: stored.status as WikiEntityDraft['status'],
  }
}
