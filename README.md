# Waybook

Waybook is a personal research secretary that turns AI-native work into a living academic wiki.

## What It Is

Waybook is a local-first web platform for individual researchers and independent builders who run many AI-assisted projects in parallel. It captures research activity from Claude Code, Codex, git history, and experiment outputs, then compiles that activity into:

- a searchable research timeline
- project and experiment pages
- topic and method pages
- daily and weekly review drafts
- an optional Obsidian sync target

## Why It Exists

AI-native research workflows are productive but easy to lose track of:

- many ideas run in parallel
- sessions are split across repos and tools
- experiments happen faster than people can summarize them
- useful conclusions stay buried in chat logs, diffs, and result folders

Waybook exists to give the researcher a stable memory, a usable timeline, and a living personal wiki.

## Project Docs

- Product design: `docs/superpowers/specs/2026-04-15-waybook-design.md`
- Implementation plan: `docs/superpowers/plans/2026-04-15-waybook-m1-research-memory-backbone.md`

## Initial Scope

The first implementation milestone focuses on:

- ingesting `claude-mem`, Codex, git, and experiment metadata
- normalizing activity into a research event graph
- rendering a timeline-first dashboard
- compiling baseline wiki entities
- exporting markdown to Obsidian as an optional sync target

## Current M1 State

This repository now includes a working local-first M1 bootstrap path rather than planning artifacts only.

A fresh app instance ships with deterministic seed data that flows through the real server pipeline:

- source collectors emit four non-empty raw events
- raw events normalize into research timeline events
- entity compilation produces at least project and topic entities
- API routes and server-rendered pages read from that shared pipeline
- Obsidian export writes entities into type-specific folders and preserves user-authored notes outside managed blocks on re-export

## Running It

- `npm run test`
- `npm run build`
- `npm run db:migrate`

Then start the app with `npm run dev` and open the home page, timeline, entities API, or a project route such as `/projects/waybook-m1`.
