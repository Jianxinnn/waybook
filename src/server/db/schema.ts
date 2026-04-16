import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const rawSourceEvents = sqliteTable('raw_source_events', {
  id: text('id').primaryKey(),
  source: text('source').notNull(),
  sourceEventId: text('source_event_id').notNull(),
  projectKey: text('project_key').notNull(),
  repoPath: text('repo_path').notNull(),
  capturedAt: integer('captured_at', { mode: 'timestamp_ms' }).notNull(),
  payloadJson: text('payload_json').notNull(),
})

export const researchEvents = sqliteTable('research_events', {
  id: text('id').primaryKey(),
  rawEventId: text('raw_event_id').notNull(),
  eventType: text('event_type').notNull(),
  title: text('title').notNull(),
  summary: text('summary').notNull(),
  projectKey: text('project_key').notNull(),
  repoPath: text('repo_path').notNull(),
  threadKey: text('thread_key').notNull(),
  occurredAt: integer('occurred_at', { mode: 'timestamp_ms' }).notNull(),
  actorKind: text('actor_kind').notNull(),
  evidenceRefsJson: text('evidence_refs_json').notNull(),
  filesJson: text('files_json').notNull(),
  tagsJson: text('tags_json').notNull(),
  importanceScore: integer('importance_score').notNull().default(0),
})

export const wikiEntities = sqliteTable('wiki_entities', {
  id: text('id').primaryKey(),
  entityType: text('entity_type').notNull(),
  slug: text('slug').notNull(),
  title: text('title').notNull(),
  canonicalSummary: text('canonical_summary').notNull(),
  status: text('status').notNull(),
  sourceThreadIdsJson: text('source_thread_ids_json').notNull(),
  supportingEventIdsJson: text('supporting_event_ids_json').notNull(),
  outboundEntityIdsJson: text('outbound_entity_ids_json').notNull(),
  managedMarkdown: text('managed_markdown').notNull(),
  obsidianPath: text('obsidian_path'),
})

export const schema = {
  rawSourceEvents,
  researchEvents,
  wikiEntities,
}
