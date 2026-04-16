import { mkdirSync } from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { schema } from './schema';

export interface DatabaseClient {
  sqlite: Database.Database;
  db: BetterSQLite3Database<typeof schema>;
}

const bootstrapSql = `
  create table if not exists raw_source_events (
    id text primary key,
    source_family text not null,
    connector_id text not null,
    provenance_tier text not null,
    source_event_id text not null,
    project_key text not null,
    repo_path text not null,
    captured_at integer not null,
    occurred_at integer not null,
    cursor_token text,
    session_id text,
    thread_id text,
    payload_json text not null
  );
  create unique index if not exists raw_source_events_identity on raw_source_events (connector_id, source_event_id);

  create table if not exists research_events (
    id text primary key,
    raw_event_id text not null unique,
    source_family text not null,
    connector_id text not null,
    provenance_tier text not null,
    event_type text not null,
    title text not null,
    summary text not null,
    project_key text not null,
    repo_path text not null,
    thread_key text not null,
    occurred_at integer not null,
    actor_kind text not null,
    evidence_refs_json text not null,
    files_json text not null,
    tags_json text not null,
    importance_score real not null
  );

  create table if not exists wiki_entities (
    id text primary key,
    entity_type text not null,
    slug text not null unique,
    title text not null,
    project_key text not null,
    canonical_summary text not null,
    status text not null,
    source_thread_ids_json text not null,
    supporting_event_ids_json text not null,
    outbound_entity_ids_json text not null,
    managed_markdown text not null,
    obsidian_path text not null
  );

  create table if not exists collector_checkpoints (
    id text primary key,
    connector_id text not null,
    scope_key text not null,
    cursor_token text not null,
    updated_at integer not null
  );
  create unique index if not exists collector_checkpoints_identity on collector_checkpoints (connector_id, scope_key);

  create table if not exists review_drafts (
    id text primary key,
    slug text not null unique,
    review_type text not null,
    title text not null,
    period_start integer not null,
    period_end integer not null,
    generated_at integer not null,
    updated_at integer not null,
    status text not null,
    canonical_summary text not null,
    context_json text not null,
    supporting_event_ids_json text not null,
    related_entity_slugs_json text not null,
    promotion_suggestions_json text not null,
    suggested_next_steps_json text not null,
    managed_markdown text not null,
    obsidian_path text not null,
    llm_provider text,
    llm_model text
  );
`;

export function createDatabaseClient(databasePath: string): DatabaseClient {
  mkdirSync(path.dirname(databasePath), { recursive: true });

  const sqlite = new Database(databasePath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.exec(bootstrapSql);

  return {
    sqlite,
    db: drizzle(sqlite, { schema })
  };
}
