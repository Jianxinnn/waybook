# Waybook M1 Research Memory Backbone Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first usable local Waybook release that runs a real persisted research-memory pipeline from source collection through export, with a mix of live and seeded connectors.

**Architecture:** Use a single-repo TypeScript web app with Next.js for UI and HTTP endpoints, SQLite plus Drizzle for local persistence, and a collector pipeline that distinguishes source family from connector implementation and provenance tier. M1 should ingest a combination of primary live local sources, derived summaries, and seeded fixtures, then normalize those raw records into research events, compile wiki entities, and export markdown. Scope this plan to Milestone 1 only; later milestones should mainly replace collector implementations rather than rewriting the product backbone.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, Drizzle ORM, SQLite, Zod, Vitest, Playwright, simple-git, chokidar

---

## Target File Structure

- `package.json`: workspace scripts and dependencies
- `next.config.ts`: Next.js runtime configuration
- `tsconfig.json`: TypeScript project configuration
- `drizzle.config.ts`: Drizzle migration configuration
- `src/app/`: Next.js routes, layouts, and API handlers
- `src/components/`: UI components for dashboard, timeline, and entities
- `src/lib/config.ts`: environment and local settings parsing
- `src/server/db/schema.ts`: SQLite schema definitions
- `src/server/db/client.ts`: SQLite and Drizzle client setup
- `src/server/ingest/`: source adapters and ingestion services
- `src/server/events/`: normalization and thread assignment logic
- `src/server/wiki/`: entity compiler and markdown renderer
- `src/server/search/`: timeline and search query services
- `src/server/jobs/`: polling and indexing jobs
- `src/types/`: shared domain types
- `tests/`: unit, integration, and UI tests
- `docs/superpowers/specs/`: product design documents
- `docs/superpowers/plans/`: implementation plans

## Task 1: Bootstrap The Local-First Web App

**Files:**
- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `postcss.config.js`
- Create: `tailwind.config.ts`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/globals.css`
- Test: `tests/app/smoke.test.ts`

- [ ] **Step 1: Write the failing smoke test**

```ts
import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import HomePage from '@/app/page';

describe('home page', () => {
  it('renders the Waybook product heading', () => {
    const html = renderToString(HomePage());
    expect(html).toContain('Waybook');
    expect(html).toContain('personal research secretary');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest tests/app/smoke.test.ts`

Expected: FAIL with module resolution or missing file errors because the app files do not exist yet.

- [ ] **Step 3: Create the initial project manifest and core config**

```json
{
  "name": "waybook",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate"
  }
}
```

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true
  }
};

export default nextConfig;
```

- [ ] **Step 4: Create the minimal app shell**

```tsx
// src/app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Waybook',
  description: 'A personal research secretary for AI-native work'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

```tsx
// src/app/page.tsx
export default function HomePage() {
  return (
    <main>
      <h1>Waybook</h1>
      <p>A personal research secretary for AI-native work.</p>
    </main>
  );
}
```

- [ ] **Step 5: Run the smoke test and confirm it passes**

Run: `pnpm vitest tests/app/smoke.test.ts`

Expected: PASS with one test passing.

- [ ] **Step 6: Commit the bootstrap**

```bash
git add package.json next.config.ts tsconfig.json postcss.config.js tailwind.config.ts src/app tests/app
git commit -m "chore: bootstrap waybook web app"
```

## Task 2: Define The Persistent Research Database

**Files:**
- Create: `drizzle.config.ts`
- Create: `src/server/db/schema.ts`
- Create: `src/server/db/client.ts`
- Create: `src/server/db/migrate.ts`
- Test: `tests/db/schema.test.ts`

- [ ] **Step 1: Write the failing database schema test**

```ts
import { describe, expect, it } from 'vitest';
import { researchEvents, wikiEntities } from '@/server/db/schema';

describe('database schema', () => {
  it('defines research events and wiki entities tables', () => {
    expect(researchEvents).toBeDefined();
    expect(wikiEntities).toBeDefined();
  });
});
```

- [ ] **Step 2: Run the schema test to verify it fails**

Run: `pnpm vitest tests/db/schema.test.ts`

Expected: FAIL because the schema module does not exist.

- [ ] **Step 3: Create the SQLite schema**

```ts
// src/server/db/schema.ts
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const rawSourceEvents = sqliteTable('raw_source_events', {
  id: text('id').primaryKey(),
  source: text('source').notNull(),
  sourceEventId: text('source_event_id').notNull(),
  projectKey: text('project_key').notNull(),
  repoPath: text('repo_path').notNull(),
  capturedAt: integer('captured_at', { mode: 'timestamp_ms' }).notNull(),
  payloadJson: text('payload_json').notNull()
});

export const researchEvents = sqliteTable('research_events', {
  id: text('id').primaryKey(),
  rawEventId: text('raw_event_id').notNull(),
  eventType: text('event_type').notNull(),
  title: text('title').notNull(),
  summary: text('summary').notNull(),
  projectKey: text('project_key').notNull(),
  repoPath: text('repo_path').notNull(),
  threadKey: text('thread_key').notNull(),
  occurredAt: integer('occurred_at', { mode: 'timestamp_ms' }).notNull(),
  actorKind: text('actor_kind').notNull(),
  evidenceRefsJson: text('evidence_refs_json').notNull(),
  filesJson: text('files_json').notNull(),
  tagsJson: text('tags_json').notNull(),
  importanceScore: integer('importance_score').notNull().default(0)
});

export const wikiEntities = sqliteTable('wiki_entities', {
  id: text('id').primaryKey(),
  entityType: text('entity_type').notNull(),
  slug: text('slug').notNull(),
  title: text('title').notNull(),
  canonicalSummary: text('canonical_summary').notNull(),
  status: text('status').notNull(),
  sourceThreadIdsJson: text('source_thread_ids_json').notNull(),
  supportingEventIdsJson: text('supporting_event_ids_json').notNull(),
  outboundEntityIdsJson: text('outbound_entity_ids_json').notNull(),
  managedMarkdown: text('managed_markdown').notNull(),
  obsidianPath: text('obsidian_path')
});
```

- [ ] **Step 4: Create the database client and migration config**

```ts
// src/server/db/client.ts
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

const sqlite = new Database(process.env.WAYBOOK_DB_PATH ?? './data/waybook.db');

export const db = drizzle(sqlite, { schema });
export { schema };
```

```ts
// drizzle.config.ts
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/server/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.WAYBOOK_DB_PATH ?? './data/waybook.db'
  }
} satisfies Config;
```

- [ ] **Step 5: Run the schema test and generate the first migration**

Run: `pnpm vitest tests/db/schema.test.ts && pnpm db:generate`

Expected: PASS for the schema test and a new migration emitted under `drizzle/`.

- [ ] **Step 6: Commit the persistence layer**

```bash
git add drizzle.config.ts drizzle src/server/db tests/db
git commit -m "feat: add waybook persistence schema"
```

## Task 3: Build Source Adapters For Claude, Codex, Git, And Experiments

**Files:**
- Create: `src/types/source.ts`
- Create: `src/server/ingest/claudeCollector.ts`
- Create: `src/server/ingest/claudeMemCollector.ts`
- Create: `src/server/ingest/codexCollector.ts`
- Create: `src/server/ingest/gitCollector.ts`
- Create: `src/server/ingest/experimentCollector.ts`
- Create: `src/server/ingest/seedCollector.ts`
- Create: `src/server/ingest/sourceRegistry.ts`
- Test: `tests/ingest/sourceRegistry.test.ts`

- [ ] **Step 1: Write the failing source-registry test**

```ts
import { describe, expect, it } from 'vitest';
import { sourceRegistry } from '@/server/ingest/sourceRegistry';

describe('source registry', () => {
  it('registers the live and seeded v1 source collectors', () => {
    expect(sourceRegistry.map((item) => item.connectorId)).toEqual([
      'claude-cli-jsonl',
      'claude-mem-sqlite',
      'codex-rollout-jsonl',
      'git-log',
      'experiment-fs',
      'seed-fixture'
    ]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest tests/ingest/sourceRegistry.test.ts`

Expected: FAIL because the registry file does not exist.

- [ ] **Step 3: Define a shared source-collector contract**

```ts
// src/types/source.ts
export interface RawSourceEventInput {
  id: string;
  sourceFamily: 'claude' | 'codex' | 'git' | 'experiment';
  connectorId:
    | 'claude-cli-jsonl'
    | 'claude-mem-sqlite'
    | 'codex-rollout-jsonl'
    | 'git-log'
    | 'experiment-fs'
    | 'seed-fixture';
  provenanceTier: 'primary' | 'derived' | 'synthetic';
  sourceEventId: string;
  projectKey: string;
  repoPath: string;
  capturedAt: number;
  occurredAt: number;
  cursorToken?: string;
  sessionId?: string;
  threadId?: string;
  payload: Record<string, unknown>;
}

export interface SourceCollector {
  sourceFamily: RawSourceEventInput['sourceFamily'];
  connectorId: RawSourceEventInput['connectorId'];
  collect(): Promise<RawSourceEventInput[]>;
}
```

- [ ] **Step 4: Implement the live, derived, and seeded adapters with a consistent shape**

```ts
// src/server/ingest/claudeCollector.ts
import type { SourceCollector } from '@/types/source';

export const claudeCollector: SourceCollector = {
  sourceFamily: 'claude',
  connectorId: 'claude-cli-jsonl',
  async collect() {
    return [];
  }
};
```

```ts
// src/server/ingest/sourceRegistry.ts
import { claudeCollector } from './claudeCollector';
import { claudeMemCollector } from './claudeMemCollector';
import { codexCollector } from './codexCollector';
import { gitCollector } from './gitCollector';
import { experimentCollector } from './experimentCollector';
import { seedCollector } from './seedCollector';

export const sourceRegistry = [
  claudeCollector,
  claudeMemCollector,
  codexCollector,
  gitCollector,
  experimentCollector,
  seedCollector
];
```

- [ ] **Step 5: Run the registry test and add one fixture-backed adapter test**

Run: `pnpm vitest tests/ingest/sourceRegistry.test.ts`

Expected: PASS with the registry listing the primary, derived, and synthetic collectors used in M1.

- [ ] **Step 6: Commit the ingestion contracts**

```bash
git add src/types/source.ts src/server/ingest tests/ingest
git commit -m "feat: add source ingestion adapters"
```

## Task 4: Normalize Raw Inputs Into Research Events And Threads

**Files:**
- Create: `src/types/research.ts`
- Create: `src/server/events/normalizer.ts`
- Create: `src/server/events/threadAssigner.ts`
- Create: `src/server/events/eventStore.ts`
- Test: `tests/events/normalizer.test.ts`

- [ ] **Step 1: Write the failing normalization test**

```ts
import { describe, expect, it } from 'vitest';
import { normalizeRawSourceEvent } from '@/server/events/normalizer';

describe('normalizeRawSourceEvent', () => {
  it('maps a raw source event to a research event', () => {
    const event = normalizeRawSourceEvent({
      id: 'raw-1',
      source: 'git',
      sourceEventId: 'commit-1',
      projectKey: 'demo',
      repoPath: '/tmp/demo',
      capturedAt: 1,
      payload: { message: 'feat: add baseline' }
    });

    expect(event.projectKey).toBe('demo');
    expect(event.eventType).toBe('git.commit');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest tests/events/normalizer.test.ts`

Expected: FAIL because the normalizer module does not exist.

- [ ] **Step 3: Define the normalized domain types**

```ts
// src/types/research.ts
export interface ResearchEvent {
  id: string;
  rawEventId: string;
  eventType: string;
  title: string;
  summary: string;
  projectKey: string;
  repoPath: string;
  threadKey: string;
  occurredAt: number;
  actorKind: 'user' | 'agent' | 'system';
  evidenceRefs: string[];
  files: string[];
  tags: string[];
  importanceScore: number;
}
```

- [ ] **Step 4: Implement normalization and thread assignment**

```ts
// src/server/events/normalizer.ts
import type { RawSourceEventInput } from '@/types/source';
import type { ResearchEvent } from '@/types/research';

export function normalizeRawSourceEvent(input: RawSourceEventInput): ResearchEvent {
  const message = String(input.payload.message ?? input.payload.title ?? input.sourceEventId);
  const eventType = input.source === 'git' ? 'git.commit' : `${input.source}.event`;

  return {
    id: `evt:${input.id}`,
    rawEventId: input.id,
    eventType,
    title: message,
    summary: message,
    projectKey: input.projectKey,
    repoPath: input.repoPath,
    threadKey: `${input.projectKey}:${message.toLowerCase().slice(0, 32)}`,
    occurredAt: input.capturedAt,
    actorKind: input.source === 'git' ? 'user' : 'agent',
    evidenceRefs: [input.sourceEventId],
    files: [],
    tags: [input.source],
    importanceScore: 1
  };
}
```

- [ ] **Step 5: Run normalization tests and add persistence for the normalized event**

Run: `pnpm vitest tests/events/normalizer.test.ts`

Expected: PASS with one normalized research event produced.

- [ ] **Step 6: Commit the normalization layer**

```bash
git add src/types/research.ts src/server/events tests/events
git commit -m "feat: add research event normalization"
```

## Task 5: Compile Project, Topic, And Experiment Entities

**Files:**
- Create: `src/server/wiki/entityCompiler.ts`
- Create: `src/server/wiki/markdownRenderer.ts`
- Create: `src/server/wiki/entityRepository.ts`
- Test: `tests/wiki/entityCompiler.test.ts`

- [ ] **Step 1: Write the failing entity compiler test**

```ts
import { describe, expect, it } from 'vitest';
import { compileEntities } from '@/server/wiki/entityCompiler';
import type { ResearchEvent } from '@/types/research';

describe('compileEntities', () => {
  it('creates a project entity from research events', () => {
    const entities = compileEntities([
      {
        id: 'evt-1',
        rawEventId: 'raw-1',
        eventType: 'git.commit',
        title: 'feat: add baseline',
        summary: 'feat: add baseline',
        projectKey: 'alpha',
        repoPath: '/tmp/alpha',
        threadKey: 'alpha:baseline',
        occurredAt: 1,
        actorKind: 'user',
        evidenceRefs: ['commit-1'],
        files: [],
        tags: ['git'],
        importanceScore: 1
      } satisfies ResearchEvent
    ]);

    expect(entities.some((entity) => entity.entityType === 'project')).toBe(true);
  });
});
```

- [ ] **Step 2: Run the entity test to verify it fails**

Run: `pnpm vitest tests/wiki/entityCompiler.test.ts`

Expected: FAIL because the compiler module does not exist.

- [ ] **Step 3: Implement a minimal entity compiler**

```ts
// src/server/wiki/entityCompiler.ts
import type { ResearchEvent } from '@/types/research';

export interface WikiEntityDraft {
  id: string;
  entityType: 'project' | 'topic' | 'experiment';
  slug: string;
  title: string;
  canonicalSummary: string;
  supportingEventIds: string[];
}

export function compileEntities(events: ResearchEvent[]): WikiEntityDraft[] {
  const byProject = new Map<string, ResearchEvent[]>();

  for (const event of events) {
    const current = byProject.get(event.projectKey) ?? [];
    current.push(event);
    byProject.set(event.projectKey, current);
  }

  return Array.from(byProject.entries()).map(([projectKey, projectEvents]) => ({
    id: `project:${projectKey}`,
    entityType: 'project',
    slug: projectKey,
    title: projectKey,
    canonicalSummary: `Recent activity for ${projectKey}`,
    supportingEventIds: projectEvents.map((event) => event.id)
  }));
}
```

- [ ] **Step 4: Render managed markdown for compiled entities**

```ts
// src/server/wiki/markdownRenderer.ts
import type { WikiEntityDraft } from './entityCompiler';

export function renderEntityMarkdown(entity: WikiEntityDraft): string {
  return [
    '---',
    `title: ${entity.title}`,
    `entity_type: ${entity.entityType}`,
    `slug: ${entity.slug}`,
    '---',
    '',
    '<!-- waybook:managed:start -->',
    `# ${entity.title}`,
    '',
    entity.canonicalSummary,
    '',
    '## Supporting Events',
    ...entity.supportingEventIds.map((id) => `- ${id}`),
    '<!-- waybook:managed:end -->'
  ].join('\n');
}
```

- [ ] **Step 5: Run the entity compiler test and add one markdown snapshot test**

Run: `pnpm vitest tests/wiki/entityCompiler.test.ts`

Expected: PASS with at least one `project` entity compiled.

- [ ] **Step 6: Commit the wiki compiler foundation**

```bash
git add src/server/wiki tests/wiki
git commit -m "feat: add wiki entity compilation"
```

## Task 6: Expose Timeline, Search, And Entity APIs

**Files:**
- Create: `src/server/search/timelineService.ts`
- Create: `src/server/search/entityService.ts`
- Create: `src/app/api/timeline/route.ts`
- Create: `src/app/api/entities/route.ts`
- Create: `src/app/api/search/route.ts`
- Test: `tests/api/timelineRoute.test.ts`

- [ ] **Step 1: Write the failing API route test**

```ts
import { describe, expect, it } from 'vitest';
import { GET } from '@/app/api/timeline/route';

describe('GET /api/timeline', () => {
  it('returns a JSON response', async () => {
    const response = await GET();
    expect(response.status).toBe(200);
  });
});
```

- [ ] **Step 2: Run the API test to verify it fails**

Run: `pnpm vitest tests/api/timelineRoute.test.ts`

Expected: FAIL because the route does not exist.

- [ ] **Step 3: Implement the timeline and entity services**

```ts
// src/server/search/timelineService.ts
import type { ResearchEvent } from '@/types/research';

export function sortTimeline(events: ResearchEvent[]) {
  return [...events].sort((a, b) => b.occurredAt - a.occurredAt);
}
```

- [ ] **Step 4: Add the first API routes**

```ts
// src/app/api/timeline/route.ts
export async function GET() {
  return Response.json({ items: [] }, { status: 200 });
}
```

```ts
// src/app/api/search/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  return Response.json({
    query: searchParams.get('q') ?? '',
    results: []
  });
}
```

- [ ] **Step 5: Run route tests and add search and entity route coverage**

Run: `pnpm vitest tests/api`

Expected: PASS for timeline route and additional route tests you add in the same pattern.

- [ ] **Step 6: Commit the application API surface**

```bash
git add src/app/api src/server/search tests/api
git commit -m "feat: add timeline and entity APIs"
```

## Task 7: Build The First Dashboard And Timeline UI

**Files:**
- Create: `src/components/dashboard/TodayPanel.tsx`
- Create: `src/components/timeline/TimelineList.tsx`
- Create: `src/components/entities/EntityCard.tsx`
- Modify: `src/app/page.tsx`
- Create: `src/app/timeline/page.tsx`
- Create: `src/app/projects/[slug]/page.tsx`
- Test: `tests/ui/homePage.test.tsx`

- [ ] **Step 1: Write the failing home-page UI test**

```tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import HomePage from '@/app/page';

describe('home page dashboard', () => {
  it('shows the primary dashboard sections', () => {
    render(<HomePage />);
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('Projects In Motion')).toBeInTheDocument();
    expect(screen.getByText('Topics Emerging This Week')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the UI test to verify it fails**

Run: `pnpm vitest tests/ui/homePage.test.tsx`

Expected: FAIL because the sections are not rendered yet.

- [ ] **Step 3: Add focused UI components**

```tsx
// src/components/dashboard/TodayPanel.tsx
export function TodayPanel() {
  return (
    <section>
      <h2>Today</h2>
      <p>No indexed activity yet.</p>
    </section>
  );
}
```

```tsx
// src/components/timeline/TimelineList.tsx
export function TimelineList() {
  return (
    <section>
      <h2>Recent Evidence</h2>
      <ul>
        <li>Timeline will render normalized research events here.</li>
      </ul>
    </section>
  );
}
```

- [ ] **Step 4: Update the home page into a research dashboard**

```tsx
// src/app/page.tsx
import { TodayPanel } from '@/components/dashboard/TodayPanel';
import { TimelineList } from '@/components/timeline/TimelineList';

export default function HomePage() {
  return (
    <main>
      <h1>Waybook</h1>
      <p>A personal research secretary for AI-native work.</p>
      <TodayPanel />
      <section>
        <h2>Projects In Motion</h2>
      </section>
      <section>
        <h2>Topics Emerging This Week</h2>
      </section>
      <TimelineList />
    </main>
  );
}
```

- [ ] **Step 5: Run UI tests and add a Playwright smoke test for navigation**

Run: `pnpm vitest tests/ui/homePage.test.tsx`

Expected: PASS with all dashboard section assertions green.

- [ ] **Step 6: Commit the first usable UI**

```bash
git add src/components src/app tests/ui
git commit -m "feat: add waybook dashboard and timeline UI"
```

## Task 8: Add Background Jobs, Obsidian Export, And Release Verification

**Files:**
- Create: `src/server/jobs/ingestAllSources.ts`
- Create: `src/server/jobs/rebuildEntities.ts`
- Create: `src/server/jobs/exportToObsidian.ts`
- Create: `src/lib/config.ts`
- Create: `tests/jobs/exportToObsidian.test.ts`
- Create: `playwright.config.ts`

- [ ] **Step 1: Write the failing Obsidian-export test**

```ts
import { describe, expect, it } from 'vitest';
import { renderEntityMarkdown } from '@/server/wiki/markdownRenderer';

describe('Obsidian export', () => {
  it('renders managed markdown blocks', () => {
    const markdown = renderEntityMarkdown({
      id: 'project:alpha',
      entityType: 'project',
      slug: 'alpha',
      title: 'alpha',
      canonicalSummary: 'Recent activity for alpha',
      supportingEventIds: ['evt-1']
    });

    expect(markdown).toContain('<!-- waybook:managed:start -->');
  });
});
```

- [ ] **Step 2: Run the export test to verify current coverage**

Run: `pnpm vitest tests/jobs/exportToObsidian.test.ts`

Expected: PASS once the markdown renderer exists; if it fails, fix export-related imports before moving on.

- [ ] **Step 3: Implement the background job entry points**

```ts
// src/server/jobs/ingestAllSources.ts
import { sourceRegistry } from '@/server/ingest/sourceRegistry';

export async function ingestAllSources() {
  const collected = await Promise.all(sourceRegistry.map((collector) => collector.collect()));
  return collected.flat();
}
```

```ts
// src/server/jobs/exportToObsidian.ts
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { renderEntityMarkdown } from '@/server/wiki/markdownRenderer';
import type { WikiEntityDraft } from '@/server/wiki/entityCompiler';

export async function exportEntity(outputRoot: string, entity: WikiEntityDraft) {
  const folder = path.join(outputRoot, 'Waybook', 'Projects');
  await mkdir(folder, { recursive: true });
  await writeFile(path.join(folder, `${entity.slug}.md`), renderEntityMarkdown(entity), 'utf8');
}
```

- [ ] **Step 4: Wire environment-based configuration**

```ts
// src/lib/config.ts
import { z } from 'zod';

const envSchema = z.object({
  WAYBOOK_DB_PATH: z.string().default('./data/waybook.db'),
  WAYBOOK_OBSIDIAN_PATH: z.string().default('./exports/obsidian'),
  CLAUDE_MEM_BASE_URL: z.string().default('http://localhost:37777')
});

export const config = envSchema.parse(process.env);
```

- [ ] **Step 5: Run the full verification suite**

Run: `pnpm test && pnpm build`

Expected: all Vitest tests pass and Next.js production build succeeds.

- [ ] **Step 6: Commit the first milestone**

```bash
git add src/server/jobs src/lib/config.ts tests/jobs playwright.config.ts
git commit -m "feat: add jobs and obsidian export"
```

## M1 Exit Criteria

- [ ] Local app boots with `pnpm dev`
- [ ] SQLite schema migrates successfully
- [ ] Ingestion registry returns events from four source families
- [ ] Raw events can be normalized into research events
- [ ] Project entities compile from normalized events
- [ ] Timeline and search endpoints return structured JSON
- [ ] Dashboard shows core sections and loads without runtime errors
- [ ] Obsidian export writes managed markdown files
- [ ] `pnpm test` and `pnpm build` both pass

## Spec Coverage Check

- Ingestion from `claude-mem`, Codex, git, and experiment metadata is covered in Task 3.
- Normalized event storage and timeline backbone are covered in Tasks 2, 4, and 6.
- Project, topic, and experiment wiki compilation is introduced in Task 5.
- Web dashboard and timeline recovery are covered in Task 7.
- Optional Obsidian sync is covered in Task 8.
- Daily and weekly digest drafting is intentionally deferred to Milestone 2 and must be planned separately.

## Self-Review

- No placeholder markers remain in this plan.
- All tasks point to exact file paths.
- The plan is intentionally scoped to Milestone 1 to keep implementation bounded and testable.
