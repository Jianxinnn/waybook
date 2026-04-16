# Waybook

> Local-first research secretary for AI-native work.  
> `Next.js 15` · `React 19` · `TypeScript` · `SQLite` · `Obsidian export`

Waybook turns fragmented activity across Claude, Codex, git, and experiment outputs into a usable research timeline, a living wiki, and scope-aware secretary drafts.

## Why

AI-native work is productive but easy to lose:

- sessions are spread across tools and repositories
- experiments outpace human summaries
- conclusions stay buried in transcripts, diffs, and result folders
- weekly orientation becomes harder as parallel work increases

Waybook exists to recover continuity:

- what happened
- where it happened
- what matters now
- what should be promoted into durable knowledge

## What It Does

- Ingests live, derived, and seeded local sources
- Persists raw evidence and normalized research events in SQLite
- Builds project, experiment, and topic entities
- Generates `daily-brief`, `daily-review`, and `weekly-review` drafts
- Supports `portfolio`, `project`, and `repo` secretary scopes
- Exports entities and reviews to Obsidian markdown

## Architecture

```text
Claude / Codex / git / experiments / claude-mem
                    |
                    v
           raw_source_events
                    |
                    v
             research_events
             /             \
            v               v
      wiki_entities     thread_states
                             |
                             v
                        scope_digests
                   (repo / project / portfolio)
                             |
                             v
        daily-brief / daily-review / weekly-review
                             |
                             v
                      Obsidian export
```

## Quick Start

```bash
npm install
cp .env.example .env
```

Then edit:

- `.env`
- `data/project-registry.json`

Run the pipeline:

```bash
npm run ingest
npm run secretary
npm run export:obsidian
```

Start the app:

```bash
npm run dev
```

## Scripts

- `npm test`: run unit and integration tests
- `npm run build`: production build
- `npm run ingest`: collect and persist source events
- `npm run secretary`: generate secretary drafts
- `npm run export:obsidian`: export entities and reviews

## Current State

- The persisted research-memory backbone is working
- Scope-aware secretary drafts are working
- Legacy `daily` / `weekly` drafts have been removed in favor of:
  - `daily-brief`
  - `daily-review`
  - `weekly-review`
- `claude-mem` is supported with a recovery fallback when the upstream SQLite file is corrupted

## Project Docs

- [Product design](docs/superpowers/specs/2026-04-15-waybook-design.md)
- [M1 backbone plan](docs/superpowers/plans/2026-04-15-waybook-m1-research-memory-backbone.md)
- [Secretary scope design](docs/superpowers/specs/2026-04-16-waybook-secretary-scope-design.md)
- [Secretary scope implementation plan](docs/superpowers/plans/2026-04-16-waybook-secretary-scope-implementation.md)

## Notes

- Runtime outputs under `data/` are not source-controlled artifacts
- The repository keeps a checked-in `data/project-registry.json` as the default local project map
