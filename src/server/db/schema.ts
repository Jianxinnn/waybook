import { integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const rawSourceEvents = sqliteTable(
  'raw_source_events',
  {
    id: text('id').primaryKey(),
    sourceFamily: text('source_family').notNull(),
    connectorId: text('connector_id').notNull(),
    provenanceTier: text('provenance_tier').notNull(),
    sourceEventId: text('source_event_id').notNull(),
    projectKey: text('project_key').notNull(),
    repoPath: text('repo_path').notNull(),
    capturedAt: integer('captured_at').notNull(),
    occurredAt: integer('occurred_at').notNull(),
    cursorToken: text('cursor_token'),
    sessionId: text('session_id'),
    threadId: text('thread_id'),
    payloadJson: text('payload_json').notNull()
  },
  (table) => ({
    rawSourceEventIdentity: uniqueIndex('raw_source_events_identity').on(
      table.connectorId,
      table.sourceEventId
    )
  })
);

export const researchEvents = sqliteTable(
  'research_events',
  {
    id: text('id').primaryKey(),
    rawEventId: text('raw_event_id').notNull().unique(),
    sourceFamily: text('source_family').notNull(),
    connectorId: text('connector_id').notNull(),
    provenanceTier: text('provenance_tier').notNull(),
    eventType: text('event_type').notNull(),
    title: text('title').notNull(),
    summary: text('summary').notNull(),
    projectKey: text('project_key').notNull(),
    repoPath: text('repo_path').notNull(),
    threadKey: text('thread_key').notNull(),
    occurredAt: integer('occurred_at').notNull(),
    actorKind: text('actor_kind').notNull(),
    evidenceRefsJson: text('evidence_refs_json').notNull(),
    filesJson: text('files_json').notNull(),
    tagsJson: text('tags_json').notNull(),
    importanceScore: real('importance_score').notNull()
  }
);

export const wikiEntities = sqliteTable(
  'wiki_entities',
  {
    id: text('id').primaryKey(),
    entityType: text('entity_type').notNull(),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    projectKey: text('project_key').notNull(),
    canonicalSummary: text('canonical_summary').notNull(),
    status: text('status').notNull(),
    sourceThreadIdsJson: text('source_thread_ids_json').notNull(),
    supportingEventIdsJson: text('supporting_event_ids_json').notNull(),
    outboundEntityIdsJson: text('outbound_entity_ids_json').notNull(),
    managedMarkdown: text('managed_markdown').notNull(),
    obsidianPath: text('obsidian_path').notNull()
  }
);

export const collectorCheckpoints = sqliteTable(
  'collector_checkpoints',
  {
    id: text('id').primaryKey(),
    connectorId: text('connector_id').notNull(),
    scopeKey: text('scope_key').notNull(),
    cursorToken: text('cursor_token').notNull(),
    updatedAt: integer('updated_at').notNull()
  },
  (table) => ({
    collectorCheckpointIdentity: uniqueIndex('collector_checkpoints_identity').on(
      table.connectorId,
      table.scopeKey
    )
  })
);

export const reviewDrafts = sqliteTable(
  'review_drafts',
  {
    id: text('id').primaryKey(),
    slug: text('slug').notNull().unique(),
    reviewType: text('review_type').notNull(),
    title: text('title').notNull(),
    periodStart: integer('period_start').notNull(),
    periodEnd: integer('period_end').notNull(),
    generatedAt: integer('generated_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
    status: text('status').notNull(),
    canonicalSummary: text('canonical_summary').notNull(),
    contextJson: text('context_json').notNull(),
    supportingEventIdsJson: text('supporting_event_ids_json').notNull(),
    relatedEntitySlugsJson: text('related_entity_slugs_json').notNull(),
    promotionSuggestionsJson: text('promotion_suggestions_json').notNull(),
    suggestedNextStepsJson: text('suggested_next_steps_json').notNull(),
    managedMarkdown: text('managed_markdown').notNull(),
    obsidianPath: text('obsidian_path').notNull(),
    llmProvider: text('llm_provider'),
    llmModel: text('llm_model')
  }
);

export const schema = {
  rawSourceEvents,
  researchEvents,
  wikiEntities,
  collectorCheckpoints,
  reviewDrafts
};
