# Waybook

Waybook is a local-first research memory app for AI-native work. It captures research activity, persists it in SQLite, and turns it into a timeline, entity pages, and Obsidian-ready markdown.

## Status

This repository currently ships the M1 backbone:

- deterministic seeded collectors for Claude, Codex, git, and experiment events
- persisted raw event / research event / wiki entity pipeline via SQLite + Drizzle
- server-rendered dashboard, timeline, project pages, and JSON APIs
- project, topic, and experiment entity compilation
- Obsidian export with managed block updates and user-note preservation outside managed regions

## Tech Stack

- Next.js 15
- React 19
- TypeScript
- SQLite + Drizzle ORM
- Vitest + Playwright

## Quick Start

### Requirements

- Node.js 22+
- pnpm 10+

### Install

```bash
pnpm install
```

### Run

```bash
pnpm db:migrate
pnpm dev
```

Open:

- `/` — dashboard
- `/timeline` — research timeline
- `/projects/waybook-m1` — seeded project page
- `/api/timeline` — timeline JSON
- `/api/entities` — entity JSON
- `/api/search?q=obsidian` — search JSON

## Scripts

```bash
pnpm dev
pnpm test -- --run
pnpm build
pnpm test:e2e
pnpm db:generate
pnpm db:migrate
```

## Project Structure

```text
src/app/        Next.js routes and API handlers
src/components/ UI components
src/server/     ingestion, persistence, pipeline, search, wiki, jobs
tests/          unit and integration tests
drizzle/        generated schema snapshots and SQL migrations
docs/           product spec and implementation plan
```

## Docs

- Product design: `docs/superpowers/specs/2026-04-15-waybook-design.md`
- M1 plan: `docs/superpowers/plans/2026-04-15-waybook-m1-research-memory-backbone.md`
