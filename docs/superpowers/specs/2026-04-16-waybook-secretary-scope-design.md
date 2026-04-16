# Waybook Secretary Scope Design

## Summary

Waybook needs a secretary architecture that survives real personal research scale. The existing review pipeline can generate useful drafts, but it still treats review generation too much like a direct summarization task over event-level context. That breaks once the event store becomes large or once the user works across multiple repositories in parallel.

This design replaces direct review-context summarization with a layered secretary pipeline:

`research_events`
→ `thread_states`
→ `scope_digests`
→ `bounded secretary packets`
→ `daily brief` / `daily review` / `weekly review`

The product stays evidence-first. The LLM writes drafts, not truth.

## Problems To Solve

### 1. Context Explosion

Weekly review generation currently fails once full context reaches model-window limits. This is not a prompt issue. It is an architecture issue.

Waybook therefore needs:

- a bounded packet for every LLM call
- deterministic aggregation before summarization
- stable fallbacks when the LLM is unavailable

### 2. Repo Versus Global History

A researcher often runs multiple repositories at the same time. Repo-only reviews are too narrow, while global-only reviews are too noisy.

Waybook therefore needs multiple review scopes:

- `repo`
- `project`
- `portfolio`

These scopes should all read from the same global evidence store. Scope is a lens, not a separate storage system.

### 3. Weekly Report Versus Daily Assistant

Weekly outlook language is appropriate for formal weekly reviews, but not for a short daily assistant.

Waybook therefore needs three distinct secretary products:

- `daily-brief`
- `daily-review`
- `weekly-review`

## Product Semantics

### Daily Brief

Purpose:

- a short, action-oriented assistant surface
- optimized for “what should I pay attention to now”

Questions answered:

- what is active today
- what just changed
- what is likely the next move
- what needs attention first

Tone:

- concise
- operational
- assistant-like

### Daily Review

Purpose:

- end-of-day recovery and reflection

Questions answered:

- what actually moved today
- what stalled today
- which patterns repeated
- what should happen tomorrow

Tone:

- still concise
- more reflective than the daily brief

### Weekly Review

Purpose:

- formal weekly orientation and research control

Questions answered:

- what materially advanced this week
- what repeated
- what deserves promotion
- what should be stopped, resumed, or emphasized next week

Tone:

- more formal
- closer to a weekly report

## Data Layers

### Thread State

Thread state is the first aggregation layer above research events.

Each thread state should include:

- `threadKey`
- `projectKey`
- `repoPaths`
- `firstEventAt`
- `lastEventAt`
- `eventCount`
- `sourceFamilies`
- `importanceScore`
- `topTags`
- `supportingEventIds`
- `exemplarTitles`

Thread state is deterministic. No LLM is needed here.

### Scope Digest

Scope digest is the second aggregation layer.

Inputs:

- thread states
- wiki entities
- current time
- selected scope
- requested secretary product kind

Outputs:

- active thread summaries
- stalled thread summaries
- repeated patterns
- promotion suggestions
- suggested next steps

Each digest is scoped to one of:

- `repo`
- `project`
- `portfolio`

### Secretary Packet

The secretary packet is the only object sent to the LLM.

It must be bounded:

- top active threads only
- top stalled threads only
- top repeated patterns only
- top promotion suggestions only
- no raw event dumps
- no unbounded evidence arrays

This packet should be small enough that daily and weekly drafts stay within provider limits.

## Scope Model

### Repo Scope

Use when the user wants the current repository only.

Identity:

- `scopeKind = repo`
- `scopeValue = repoPath`

### Project Scope

Use when the user wants a logical project across one or more repositories.

Identity:

- `scopeKind = project`
- `scopeValue = projectKey`

### Portfolio Scope

Use when the user wants the whole personal research portfolio.

Identity:

- `scopeKind = portfolio`
- `scopeValue = portfolio`

## Secretary UX

### Home Dashboard

The home dashboard should default to:

- portfolio daily brief
- current repo focus
- latest weekly review
- promotion suggestions

This keeps the page useful whether the user is working in one repo or several.

### Reviews Surface

The reviews surface should expose:

- `daily-brief`
- `daily-review`
- `weekly-review`

It should also support switching scope between:

- repo
- project
- portfolio

## Reliability Rules

- LLM requests must use bounded packets only
- if LLM generation fails, deterministic markdown must still be produced
- malformed external sources must degrade gracefully, not abort the secretary loop
- test environments must stay isolated from production data

## Rollout

This change is still part of the broader secretary loop, but it is a bounded architecture correction rather than a brand-new milestone.

Deliverables for this slice:

- thread-state layer
- scope-digest layer
- bounded secretary packet layer
- scoped `daily-brief`, `daily-review`, and `weekly-review`
- dashboard and reviews UI updates
- continued deterministic fallback behavior
