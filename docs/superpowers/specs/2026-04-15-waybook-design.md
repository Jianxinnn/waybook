# Waybook Product Design

## Summary

Waybook is a personal research secretary for AI-native researchers and independent builders. It turns fragmented work across Claude Code, Codex, repositories, commits, experiments, and result folders into a coherent timeline and a living academic wiki.

The product is not a note-taking app and not a generic memory plugin. It sits above the capture layer and answers a different question:

> What have I actually been doing, where did it happen, what did it mean, and how does it change my next move?

## Problem

Modern auto-research workflows create a visibility problem.

Researchers now:

- run many ideas in parallel across multiple repos
- delegate reasoning, coding, iteration, and execution to AI agents
- generate many partial results with little human narration
- hold important decisions inside Claude Code and Codex sessions
- forget which repo, session, or branch contained the useful path

The result is not a lack of output. It is a lack of continuity, context recovery, and long-horizon synthesis.

The user can no longer answer simple but critical questions quickly:

- What did I do yesterday?
- Which project consumed my last three days?
- Where did we already test this idea?
- Which failures keep repeating?
- What belongs in long-term knowledge versus short-term noise?

## Target User

### Primary User

An individual researcher or independent builder who:

- works across multiple repositories
- uses Claude Code and Codex heavily
- runs many AI-assisted experiments
- wants a durable personal research memory
- values synthesis more than raw logs

### Not the First User

Waybook v1 is not optimized for:

- large teams
- enterprise compliance workflows
- pure note-taking users
- non-technical knowledge workers

## Product Thesis

AI-native work should not disappear into chats, diffs, and result folders.

If research activity can be captured, normalized, threaded, and compiled into a durable knowledge surface, then a personal researcher gains:

- continuity across days and sessions
- fast recovery of context
- lower duplicate effort
- better retrospection
- stronger long-term research taste

Waybook should therefore behave like a research secretary:

- quietly collecting evidence
- organizing it into timelines and entities
- drafting summaries and promotions
- keeping the user oriented instead of overwhelmed

## Product Positioning

### What Waybook Is

- A local-first research memory and synthesis platform
- A web-based control surface for personal academic and experimental work
- A compiler from research events to wiki pages

### What Waybook Is Not

- A replacement for Claude Code or Codex
- A replacement for Obsidian
- A generic second-brain product
- A chat UI for raw transcripts

## Design Principles

### 1. Evidence Before Abstraction

Every synthesized page, claim, or review should link back to concrete evidence: sessions, observations, commits, artifacts, or files.

### 2. Timeline Before Insight

Users first need to recover what happened. Higher-order interpretation sits on top of a reliable event timeline.

### 3. Wiki as Compiled Output

The wiki is not the primary storage layer. It is a durable, human-readable view generated from normalized research activity.

### 4. Human Override Always Wins

Users must be able to edit summaries, rename entities, merge threads, and mark generated content as wrong.

### 5. Local-First by Default

The product should work on a local machine with SQLite, filesystem access, and optional Obsidian sync.

### 6. Minimum Friction, Maximum Return

Users should get value without maintaining an elaborate taxonomy. The system should progressively organize on their behalf.

## V1 Scope

Waybook v1 is the first complete product envelope and spans two delivery milestones:

- `M1`: research memory backbone
- `M2`: secretary loop

The full v1 user-facing loop is:

1. Ingest AI-native research activity
2. Normalize it into research events
3. Render a searchable timeline
4. Compile baseline wiki entities
5. Draft daily and weekly reviews
6. Optionally sync markdown to Obsidian

The implementation plan written on `2026-04-15` intentionally covers `M1` only so execution stays bounded.

### Included In The V1 Envelope

- Claude Code and `claude-mem` integration
- Codex transcript ingestion
- Git commit ingestion
- Experiment result directory indexing
- Key file-change summaries
- Timeline view
- Project pages
- Experiment pages
- Topic pages
- Decision and method pages
- Daily review draft
- Weekly review draft
- Obsidian markdown export

### Excluded From V1

- Team accounts and shared workspaces
- Permissions and collaboration
- Browser clipping and paper ingestion
- Autonomous research planning
- Graph editing UI
- Mobile app
- Billing

## Product Architecture

Waybook is split into six product modules.

### 1. Inbox

Collects raw activity from external sources.

Inputs:

- `claude-mem` observations and summaries
- Codex transcript events
- git commits and diffs
- experiment output directories
- curated file-change events

Responsibility:

- preserve raw evidence
- assign source metadata
- guarantee ingestion idempotency

### 2. Timeline

Transforms normalized events into a coherent chronological research view.

Responsibilities:

- merge heterogeneous activity into one timeline
- group related events into threads
- support filtering by project, repo, topic, source, date, and status
- power fast “what happened” recovery

### 3. Wiki Compiler

Builds durable knowledge entities from the event graph.

Entity types:

- Project
- Experiment
- Topic
- Decision
- Method
- Artifact
- Daily Review
- Weekly Review

Responsibilities:

- promote recurring events into long-lived pages
- summarize evidence trails
- maintain backlinks between entities

### 4. Workspace

The primary web application used day to day.

Responsibilities:

- dashboard
- search
- timeline navigation
- entity pages
- draft promotion flows
- review editing

### 5. Digest Engine

Produces daily and weekly drafts from observed work.

Responsibilities:

- identify meaningful progress
- surface repeated failure patterns
- detect stalled research threads
- draft suggested next steps

### 6. Sync

Exports compiled wiki pages to markdown for Obsidian.

Responsibilities:

- deterministic file naming
- stable frontmatter
- safe incremental writes
- preserve user-managed manual notes outside managed blocks

## Core User Flows

### Flow 1: Recover Yesterday

The user opens Waybook and sees:

- what happened today
- what changed since last review
- which threads are active
- where the work happened

The user should not need to remember repo names or session IDs.

### Flow 2: Locate a Lost Insight

The user remembers a conclusion but not where it happened.

They search for a concept, phrase, file, method, or experiment. Waybook returns:

- the relevant topic page
- linked decisions
- supporting sessions and commits
- the timeline around the event

### Flow 3: Convert Activity into Knowledge

Repeated events around a method or topic are clustered. Waybook proposes:

- a draft topic page
- key claims
- linked evidence
- unresolved questions

The user promotes the draft into a durable wiki page.

### Flow 4: Weekly Orientation

The digest engine drafts a weekly review covering:

- what moved forward
- what stalled
- what repeated
- what deserves promotion to long-term knowledge
- what likely matters next week

## Information Architecture

The main product surface is a web dashboard, not a document editor.

### Primary Navigation

- Today
- Timeline
- Projects
- Experiments
- Topics
- Reviews
- Search
- Settings

### Home Dashboard

The dashboard should include these blocks:

- Today
- Active Threads
- Recent Evidence
- Projects In Motion
- Experiments Updated Recently
- Topics Emerging This Week
- Drafts To Promote
- Weekly Outlook

This combination creates both recovery and direction. The user can see what happened and what now deserves attention.

## Data Model

Waybook uses a four-layer data model.

### 1. Raw Source Event

Immutable records from each integration.

Examples:

- a `claude-mem` observation
- a Codex JSONL transcript line
- a git commit
- a result file emitted by an experiment

Fields:

- `id`
- `source`
- `source_event_id`
- `captured_at`
- `payload_json`
- `repo_path`
- `project_key`

### 2. Research Event

A normalized representation suitable for search, clustering, and timeline rendering.

Fields:

- `id`
- `event_type`
- `title`
- `summary`
- `project_key`
- `repo_path`
- `thread_key`
- `occurred_at`
- `actor_kind`
- `evidence_refs`
- `files`
- `tags`
- `importance_score`

### 3. Research Thread

A durable grouping of related events.

Examples:

- a bugfix investigation arc
- a modeling direction
- a benchmark evaluation series
- a paper replication attempt

Fields:

- `id`
- `label`
- `project_key`
- `status`
- `last_event_at`
- `summary`
- `entity_refs`

### 4. Wiki Entity

A compiled knowledge surface tied to evidence and threads.

Fields:

- `id`
- `entity_type`
- `slug`
- `title`
- `canonical_summary`
- `status`
- `source_thread_ids`
- `supporting_event_ids`
- `outbound_entity_ids`
- `managed_markdown`
- `obsidian_path`

## Source Integrations

### Claude Code / Claude Mem

This is the highest-value input source for v1.

Waybook should pull:

- observations
- session summaries
- prompt metadata
- semantic context references when useful

Role:

- captures the reasoning and tool-use layer of research

### Codex

Waybook should ingest Codex transcript activity through a transcript watcher or exported session feed.

Role:

- covers parallel AI-native research not captured by Claude Code

### Git

Waybook should ingest:

- commits
- branches
- changed files
- commit messages

Role:

- anchors activity to codebase reality

### Experiment Artifacts

Waybook should index:

- result directories
- metrics files
- plots
- checkpoints
- summary markdown files

Role:

- anchors research to empirical outputs

## Search Model

Search in v1 should support:

- free-text search
- project filter
- repo filter
- topic filter
- date filter
- source filter
- entity-type filter

Search results should return both:

- direct matches
- linked entities and nearby evidence

The user should be able to move from search to timeline to entity page without friction.

## Obsidian Strategy

Obsidian is a secondary surface in v1, not the source of truth.

Waybook should export markdown to a managed subtree such as:

- `Waybook/Projects/`
- `Waybook/Experiments/`
- `Waybook/Topics/`
- `Waybook/Reviews/Daily/`
- `Waybook/Reviews/Weekly/`

Managed files should:

- use stable slugs
- include frontmatter for entity metadata
- keep generated content inside clear managed blocks
- allow user notes outside those blocks

This keeps Waybook’s data model stable while still giving users the comfort and flexibility of Obsidian.

## Why Users Will Keep Coming Back

Waybook’s stickiness should come from operational usefulness, not novelty.

### Sticky Loop 1: Daily Recovery

The user opens the dashboard because it immediately answers:

- what happened
- where it happened
- what is active now

### Sticky Loop 2: Less Duplicate Effort

The product should repeatedly save the user from re-running old lines of inquiry blindly.

### Sticky Loop 3: Draft Promotion

The system continuously proposes pages that deserve promotion from transient activity to durable knowledge.

### Sticky Loop 4: Weekly Orientation

The weekly review becomes the moment where the user regains research-level control.

## Success Metrics

### Primary Product Metrics

- time-to-find a prior research event
- number of promoted wiki entities per active week
- number of weekly reviews accepted or lightly edited
- repeat active usage across 7 and 30 days

### Behavioral Success Signals

- user returns to Waybook before resuming a project
- user uses Waybook to re-enter old repos
- user edits compiled wiki pages instead of starting blank notes

## Rollout Plan

### Milestone 1: Research Memory Backbone

Deliver:

- ingestion from core sources
- normalized event store
- timeline UI
- project and topic entities
- baseline search

Outcome:

- user can answer “what have I been doing” and “where did it happen”

### Milestone 2: Secretary Loop

Deliver:

- daily and weekly drafts
- thread clustering
- promotion suggestions
- Obsidian sync

Outcome:

- user gets an actual research secretary, not just a memory viewer

### Milestone 3: Research Steering

Deliver:

- stalled thread detection
- duplicate effort warnings
- direction hints
- weekly outlook

Outcome:

- user can manage not just history, but direction

## Key Risks and Mitigations

### Risk: The product becomes a nicer log viewer

Mitigation:

- make wiki compilation and promotion a first-class loop

### Risk: Over-summarization hides important evidence

Mitigation:

- link every entity and digest back to raw evidence

### Risk: Entity extraction becomes noisy

Mitigation:

- keep promotion suggestions draft-first and user-confirmed

### Risk: Too many integrations delay the first useful release

Mitigation:

- keep v1 focused on `claude-mem`, Codex, git, and experiment metadata only

### Risk: Obsidian sync becomes the main architecture

Mitigation:

- keep internal storage authoritative and markdown export deterministic

## Final Product Decision

Waybook will launch as a local-first personal research secretary with:

- a web dashboard as the primary interface
- `claude-mem` as the highest-value ingestion partner
- timeline recovery as the operational backbone
- a compiled personal academic wiki as the durable output
- optional Obsidian sync as a comfort and extensibility layer

This is the narrowest version of the product that still feels meaningful, defensible, and habit-forming.
