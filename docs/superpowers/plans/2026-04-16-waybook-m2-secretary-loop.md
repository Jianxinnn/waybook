# Waybook M2 Secretary Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add daily and weekly review drafts, promotion suggestions, and a secretary loop that can use an optional LLM while keeping evidence and persistence local-first.

**Architecture:** Build a deterministic digest engine on top of the existing research event and wiki entity stores, persist generated review drafts in SQLite, and optionally pass bounded digest context into an OpenAI-compatible summarizer for prose drafting. Keep the source-of-truth in local event/entity tables; the LLM only writes drafts. Expose the secretary loop through jobs, API routes, review pages, dashboard surfaces, and markdown export.

**Tech Stack:** Next.js 15, React 19, TypeScript, SQLite, Drizzle ORM, Vitest, fetch, OpenAI-compatible chat completions

---

## Target File Structure

- `src/types/review.ts`: review draft, digest context, and promotion suggestion types
- `src/server/db/schema.ts`: add review draft persistence tables
- `src/server/reviews/`: digest engine, summarizer, store, and secretary orchestration
- `src/server/jobs/`: CLI and job entrypoints for review generation
- `src/server/bootstrap/pipeline.ts`: include secretary snapshot data
- `src/app/reviews/`: list and detail pages for reviews
- `src/app/api/reviews/`: JSON routes for listing and generating reviews
- `src/components/dashboard/`: secretary-facing dashboard blocks
- `tests/reviews/`: digest engine and secretary loop tests

## Tasks

- [ ] Add failing tests for digest context building, review generation, review pages, and reviews API.
- [ ] Extend config parsing to support repository roots, experiment roots, and optional LLM secretary settings.
- [ ] Add `review_drafts` persistence plus store helpers.
- [ ] Implement digest context building for `daily` and `weekly` periods.
- [ ] Implement deterministic review markdown rendering.
- [ ] Implement optional OpenAI-compatible LLM drafting and safe fallback behavior.
- [ ] Implement secretary loop job that generates current daily and weekly drafts.
- [ ] Extend export job to write review markdown into Obsidian.
- [ ] Add review pages, dashboard secretary sections, and reviews API routes.
- [ ] Run `npm test`, `npm run build`, `npm run ingest`, `npm run export:obsidian`, and `npm run secretary`.
