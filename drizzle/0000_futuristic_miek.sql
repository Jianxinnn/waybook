CREATE TABLE `raw_source_events` (
	`id` text PRIMARY KEY NOT NULL,
	`source` text NOT NULL,
	`source_event_id` text NOT NULL,
	`project_key` text NOT NULL,
	`repo_path` text NOT NULL,
	`captured_at` integer NOT NULL,
	`payload_json` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `research_events` (
	`id` text PRIMARY KEY NOT NULL,
	`raw_event_id` text NOT NULL,
	`event_type` text NOT NULL,
	`title` text NOT NULL,
	`summary` text NOT NULL,
	`project_key` text NOT NULL,
	`repo_path` text NOT NULL,
	`thread_key` text NOT NULL,
	`occurred_at` integer NOT NULL,
	`actor_kind` text NOT NULL,
	`evidence_refs_json` text NOT NULL,
	`files_json` text NOT NULL,
	`tags_json` text NOT NULL,
	`importance_score` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `wiki_entities` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_type` text NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`canonical_summary` text NOT NULL,
	`status` text NOT NULL,
	`source_thread_ids_json` text NOT NULL,
	`supporting_event_ids_json` text NOT NULL,
	`outbound_entity_ids_json` text NOT NULL,
	`managed_markdown` text NOT NULL,
	`obsidian_path` text
);
