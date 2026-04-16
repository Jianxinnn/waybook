import { desc, eq } from 'drizzle-orm';
import type { DatabaseClient } from '@/server/db/client';
import { wikiEntities } from '@/server/db/schema';
import type { WikiEntityDraft } from '@/types/wiki';

function parseJsonArray(value: string) {
  return JSON.parse(value) as string[];
}

export async function persistWikiEntities(client: DatabaseClient, entities: WikiEntityDraft[]) {
  for (const entity of entities) {
    await client.db
      .insert(wikiEntities)
      .values({
        id: entity.id,
        entityType: entity.entityType,
        slug: entity.slug,
        title: entity.title,
        projectKey: entity.projectKey,
        canonicalSummary: entity.canonicalSummary,
        status: entity.status,
        sourceThreadIdsJson: JSON.stringify(entity.sourceThreadIds),
        supportingEventIdsJson: JSON.stringify(entity.supportingEventIds),
        outboundEntityIdsJson: JSON.stringify(entity.outboundEntityIds),
        managedMarkdown: entity.managedMarkdown,
        obsidianPath: entity.obsidianPath
      })
      .onConflictDoUpdate({
        target: wikiEntities.slug,
        set: {
          title: entity.title,
          canonicalSummary: entity.canonicalSummary,
          sourceThreadIdsJson: JSON.stringify(entity.sourceThreadIds),
          supportingEventIdsJson: JSON.stringify(entity.supportingEventIds),
          managedMarkdown: entity.managedMarkdown,
          obsidianPath: entity.obsidianPath
        }
      });
  }
}

export async function loadWikiEntities(client: DatabaseClient) {
  const rows = await client.db.select().from(wikiEntities).orderBy(desc(wikiEntities.title));

  return rows.map((row) => ({
    id: row.id,
    entityType: row.entityType as WikiEntityDraft['entityType'],
    slug: row.slug,
    title: row.title,
    projectKey: row.projectKey,
    canonicalSummary: row.canonicalSummary,
    status: row.status as WikiEntityDraft['status'],
    sourceThreadIds: parseJsonArray(row.sourceThreadIdsJson),
    supportingEventIds: parseJsonArray(row.supportingEventIdsJson),
    outboundEntityIds: parseJsonArray(row.outboundEntityIdsJson),
    managedMarkdown: row.managedMarkdown,
    obsidianPath: row.obsidianPath
  }));
}

export async function loadWikiEntityBySlug(client: DatabaseClient, slug: string) {
  const rows = await client.db
    .select()
    .from(wikiEntities)
    .where(eq(wikiEntities.slug, slug))
    .limit(1);

  if (!rows[0]) {
    return null;
  }

  const [entity] = await loadWikiEntities(client).then((entities) =>
    entities.filter((item) => item.slug === slug)
  );
  return entity ?? null;
}
