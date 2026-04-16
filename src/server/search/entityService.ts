import type { DatabaseClient } from '@/server/db/client';
import { loadWikiEntities, loadWikiEntityBySlug } from '@/server/wiki/entityStore';

export async function listWikiEntities(client: DatabaseClient, filters: { type?: string } = {}) {
  const entities = await loadWikiEntities(client);

  if (!filters.type) {
    return entities;
  }

  return entities.filter((entity) => entity.entityType === filters.type);
}

export async function getWikiEntity(client: DatabaseClient, slug: string) {
  return loadWikiEntityBySlug(client, slug);
}
