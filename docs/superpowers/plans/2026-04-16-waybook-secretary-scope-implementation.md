# Waybook Secretary Scope Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the direct review-context secretary flow with thread-state and scope-digest layers, then generate scoped daily brief, daily review, and weekly review outputs from bounded packets.

**Architecture:** Keep the existing evidence store as the source of truth, add deterministic thread-state and scope-digest layers above it, and generate secretary packets from those bounded aggregates. Reviews and assistant surfaces should support `repo`, `project`, and `portfolio` scopes while preserving deterministic fallback when the LLM or an external source fails.

**Tech Stack:** Next.js 15, React 19, TypeScript, SQLite, Drizzle ORM, Vitest, fetch

---

## Target File Structure

- `src/types/review.ts`: expand secretary types with review kinds, scopes, thread states, scope digests, and packets
- `src/server/db/schema.ts`: add `thread_states` and `scope_digests` tables
- `src/server/reviews/threadStateStore.ts`: persist and load deterministic thread states
- `src/server/reviews/scopeDigestStore.ts`: persist and load scoped digest outputs
- `src/server/reviews/threadStateBuilder.ts`: aggregate research events into thread states
- `src/server/reviews/scopeDigestBuilder.ts`: aggregate thread states into scoped digests
- `src/server/reviews/assistantRenderer.ts`: deterministic markdown for daily brief, daily review, and weekly review
- `src/server/reviews/llmSummarizer.ts`: build bounded secretary packets for LLM generation
- `src/server/reviews/secretaryLoop.ts`: orchestrate secretary generation over scoped digests
- `src/app/page.tsx`: show portfolio daily brief, repo focus, and weekly outlook
- `src/app/reviews/page.tsx`: show scope-aware secretary drafts
- `src/app/api/reviews/route.ts`: accept `kind`, `scopeKind`, and `scopeValue`
- `tests/reviews/`: add thread-state, scope-digest, and scoped-review tests

## Tasks

- [ ] Add failing tests for thread-state building, scope-digest building, bounded LLM packets, scoped reviews API, and dashboard daily-brief surfaces.
- [ ] Expand secretary types to include review kinds and scopes without breaking existing persistence.
- [ ] Add `thread_states` and `scope_digests` SQLite tables plus store helpers.
- [ ] Implement deterministic thread-state aggregation from `research_events`.
- [ ] Implement deterministic scope-digest aggregation for `repo`, `project`, and `portfolio`.
- [ ] Replace direct review-context compaction with bounded secretary packets generated from scope digests.
- [ ] Generate `daily-brief`, `daily-review`, and `weekly-review` drafts from scoped digests.
- [ ] Update dashboard and reviews UI to surface daily brief and scoped reviews.
- [ ] Update API routes and CLI paths to accept secretary kind and scope.
- [ ] Run `npm test`, `npm run build`, `npm run ingest`, `npm run secretary`, and `npm run export:obsidian`.
