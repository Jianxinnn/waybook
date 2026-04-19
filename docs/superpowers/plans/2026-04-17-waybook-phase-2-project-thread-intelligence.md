# Waybook Phase 2 Project and Thread Intelligence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the first project/thread intelligence layer so Waybook can show dedicated project views, active/stalled thread summaries, and duplicate-effort hints on top of the existing research workspace.

**Architecture:** Keep the current event store and workspace shell intact, but add a focused thread/project view-model layer derived from `research_events`. Use deterministic thread-state aggregation as the source for project pages and API responses, then surface the results through a new Projects route and linked project detail pages.

**Tech Stack:** Next.js 15, React 19, TypeScript, SQLite, better-sqlite3, Drizzle ORM, Tailwind CSS, Vitest, react-dom/server

---

## Scope Check

This plan covers one bounded phase-2 slice only:
- dedicated Projects list page
- project detail page
- thread intelligence cards (active/stalled/repeated)
- duplicate-effort hints derived from thread/topic repetition

It intentionally defers:
- persisted `thread_states` tables
- dedicated thread detail routes
- richer cross-project search UI
- human-override flows

## Target File Structure

- Create: `src/server/workspace/threadSummaries.ts` — derive deterministic thread summaries and duplicate-effort hints from `ResearchEvent[]`
- Create: `src/server/workspace/projectDetail.ts` — assemble project detail view models from events, entities, and thread summaries
- Modify: `src/server/bootstrap/pipeline.ts` — expose thread summaries / repeated hints where useful for workspace pages
- Create: `src/app/projects/page.tsx` — list project surfaces with active/stalled/repeated summary blocks
- Create: `src/app/projects/[projectKey]/page.tsx` — project detail page with recent evidence, active threads, stalled threads, and repeated patterns
- Create: `src/components/projects/ThreadSummaryCard.tsx` — render one thread summary
- Create: `src/components/projects/RepeatedPatternList.tsx` — render duplicate-effort / repeated-pattern hints
- Modify: `src/components/workspace/WorkspaceShell.tsx` — add `Projects` nav item while preserving scope params
- Modify: `src/app/page.tsx` — link project cards into `/projects/[projectKey]`
- Modify: `src/components/projects/ProjectSummaryCard.tsx` — add detail link into the new project page and small thread intelligence preview
- Create: `src/app/api/projects/route.ts` — JSON feed for project summaries and thread intelligence
- Create: `tests/workspace/threadSummaries.test.ts` — verify active/stalled/repeated derivation
- Create: `tests/workspace/projectDetail.test.ts` — verify project detail aggregation
- Create: `tests/ui/projectsPage.test.tsx` — verify Projects page framing and linked summaries
- Create: `tests/ui/projectDetailPage.test.tsx` — verify project detail page sections
- Modify: `tests/app/smoke.test.ts` — include `Projects` navigation and home-page project links
- Modify: `tests/ui/navigationSemantics.test.tsx` — verify `Projects` nav semantics and scope retention
- Create: `tests/api/projectsRoute.test.ts` — verify project intelligence API shape

## Task 1: Add failing tests for thread intelligence derivation

**Files:**
- Create: `tests/workspace/threadSummaries.test.ts`
- Create: `src/server/workspace/threadSummaries.ts`

- [ ] **Step 1: Write the failing thread intelligence tests**

```ts
import { describe, expect, it } from 'vitest';
import { buildThreadSummariesForProject } from '@/server/workspace/threadSummaries';
import type { ResearchEvent } from '@/types/research';

describe('buildThreadSummariesForProject', () => {
  it('splits active and stalled threads for one project', () => {
    const events: ResearchEvent[] = [
      {
        id: 'event-active',
        rawEventId: 'raw-active',
        sourceFamily: 'git',
        connectorId: 'git-log',
        provenanceTier: 'primary',
        eventType: 'git.commit',
        title: 'Refine timeline cards',
        summary: 'Improved timeline card density.',
        projectKey: 'waybook',
        repoPath: '/repo/waybook',
        threadKey: 'topic:timeline',
        occurredAt: Date.parse('2026-04-16T09:00:00Z'),
        actorKind: 'user',
        evidenceRefs: ['git:1'],
        files: ['src/components/timeline/TimelineList.tsx'],
        tags: ['timeline'],
        importanceScore: 0.8
      },
      {
        id: 'event-stalled',
        rawEventId: 'raw-stalled',
        sourceFamily: 'claude',
        connectorId: 'claude-cli-jsonl',
        provenanceTier: 'primary',
        eventType: 'claude.message',
        title: 'Investigate promotion workflow',
        summary: 'Captured open questions for promotions.',
        projectKey: 'waybook',
        repoPath: '/repo/waybook',
        threadKey: 'topic:promotion',
        occurredAt: Date.parse('2026-04-04T09:00:00Z'),
        actorKind: 'agent',
        evidenceRefs: ['claude:1'],
        files: ['src/app/reviews/page.tsx'],
        tags: ['promotion'],
        importanceScore: 0.6
      }
    ];

    const summary = buildThreadSummariesForProject({
      events,
      projectKey: 'waybook',
      now: Date.parse('2026-04-16T12:00:00Z')
    });

    expect(summary.activeThreads).toHaveLength(1);
    expect(summary.stalledThreads).toHaveLength(1);
    expect(summary.activeThreads[0]?.threadKey).toBe('topic:timeline');
    expect(summary.stalledThreads[0]?.threadKey).toBe('topic:promotion');
  });

  it('detects repeated patterns across multiple project threads', () => {
    const events: ResearchEvent[] = [
      {
        id: 'event-1',
        rawEventId: 'raw-1',
        sourceFamily: 'git',
        connectorId: 'git-log',
        provenanceTier: 'primary',
        eventType: 'git.commit',
        title: 'Tune evaluation run',
        summary: 'Adjusted evaluation thresholds.',
        projectKey: 'waybook',
        repoPath: '/repo/waybook',
        threadKey: 'experiment:eval-a',
        occurredAt: Date.parse('2026-04-16T09:00:00Z'),
        actorKind: 'user',
        evidenceRefs: ['git:1'],
        files: ['experiments/eval-a/metrics.json'],
        tags: ['evaluation'],
        importanceScore: 0.7
      },
      {
        id: 'event-2',
        rawEventId: 'raw-2',
        sourceFamily: 'experiment',
        connectorId: 'experiment-fs',
        provenanceTier: 'primary',
        eventType: 'experiment.metrics',
        title: 'Run evaluation again',
        summary: 'Re-ran evaluation with another seed.',
        projectKey: 'waybook',
        repoPath: '/repo/waybook',
        threadKey: 'experiment:eval-b',
        occurredAt: Date.parse('2026-04-16T10:00:00Z'),
        actorKind: 'system',
        evidenceRefs: ['experiment:1'],
        files: ['experiments/eval-b/metrics.json'],
        tags: ['evaluation'],
        importanceScore: 0.75
      }
    ];

    const summary = buildThreadSummariesForProject({
      events,
      projectKey: 'waybook',
      now: Date.parse('2026-04-16T12:00:00Z')
    });

    expect(summary.repeatedPatterns).toEqual([
      expect.objectContaining({ label: 'evaluation', count: 2 })
    ]);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/workspace/threadSummaries.test.ts`
Expected: FAIL because `buildThreadSummariesForProject` does not exist yet.

- [ ] **Step 3: Write the minimal implementation**

```ts
import type { ResearchEvent } from '@/types/research';
import { buildThreadStates } from '@/server/reviews/threadStateBuilder';

export interface ProjectThreadIntelligence {
  activeThreads: ReturnType<typeof buildThreadStates>;
  stalledThreads: ReturnType<typeof buildThreadStates>;
  repeatedPatterns: Array<{ label: string; count: number; supportingThreadKeys: string[] }>;
}

export function buildThreadSummariesForProject({
  events,
  projectKey,
  now = Date.now()
}: {
  events: ResearchEvent[];
  projectKey: string;
  now?: number;
}): ProjectThreadIntelligence {
  const projectEvents = events.filter((event) => event.projectKey === projectKey);
  const threadStates = buildThreadStates(projectEvents, now);
  const repeated = new Map<string, { count: number; supportingThreadKeys: string[] }>();

  for (const thread of threadStates) {
    for (const tag of thread.topTags) {
      const entry = repeated.get(tag) ?? { count: 0, supportingThreadKeys: [] };
      entry.count += 1;
      entry.supportingThreadKeys.push(thread.threadKey);
      repeated.set(tag, entry);
    }
  }

  return {
    activeThreads: threadStates.filter((thread) => thread.status === 'active').slice(0, 6),
    stalledThreads: threadStates.filter((thread) => thread.status === 'stalled').slice(0, 6),
    repeatedPatterns: [...repeated.entries()]
      .map(([label, value]) => ({
        label,
        count: value.count,
        supportingThreadKeys: value.supportingThreadKeys
      }))
      .filter((pattern) => pattern.count >= 2)
      .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label))
      .slice(0, 6)
  };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/workspace/threadSummaries.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/workspace/threadSummaries.test.ts src/server/workspace/threadSummaries.ts
git commit -m "feat: add project thread intelligence"
```

## Task 2: Add failing tests for project detail aggregation

**Files:**
- Create: `tests/workspace/projectDetail.test.ts`
- Create: `src/server/workspace/projectDetail.ts`

- [ ] **Step 1: Write the failing project detail aggregation test**

```ts
import { describe, expect, it } from 'vitest';
import { buildProjectDetail } from '@/server/workspace/projectDetail';
import type { ResearchEvent } from '@/types/research';
import type { WikiEntityDraft } from '@/types/wiki';

describe('buildProjectDetail', () => {
  it('assembles project detail with recent evidence, entities, and thread intelligence', () => {
    const events: ResearchEvent[] = [
      {
        id: 'event-1',
        rawEventId: 'raw-1',
        sourceFamily: 'git',
        connectorId: 'git-log',
        provenanceTier: 'primary',
        eventType: 'git.commit',
        title: 'Refine timeline cards',
        summary: 'Improved timeline card density.',
        projectKey: 'waybook',
        repoPath: '/repo/waybook',
        threadKey: 'topic:timeline',
        occurredAt: Date.parse('2026-04-16T09:00:00Z'),
        actorKind: 'user',
        evidenceRefs: ['git:1'],
        files: ['src/components/timeline/TimelineList.tsx'],
        tags: ['timeline'],
        importanceScore: 0.8
      }
    ];

    const entities: WikiEntityDraft[] = [
      {
        id: 'entity-1',
        entityType: 'project',
        slug: 'waybook',
        title: 'Waybook',
        projectKey: 'waybook',
        canonicalSummary: 'Workspace summary',
        status: 'active',
        sourceThreadIds: ['topic:timeline'],
        supportingEventIds: ['event-1'],
        outboundEntityIds: [],
        managedMarkdown: '',
        obsidianPath: 'projects/waybook.md'
      }
    ];

    const detail = buildProjectDetail({
      projectKey: 'waybook',
      events,
      entities,
      now: Date.parse('2026-04-16T12:00:00Z')
    });

    expect(detail.projectKey).toBe('waybook');
    expect(detail.recentEvents).toHaveLength(1);
    expect(detail.entities).toHaveLength(1);
    expect(detail.threadIntelligence.activeThreads).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/workspace/projectDetail.test.ts`
Expected: FAIL because `buildProjectDetail` does not exist yet.

- [ ] **Step 3: Write the minimal implementation**

```ts
import type { ResearchEvent } from '@/types/research';
import type { WikiEntityDraft } from '@/types/wiki';
import { buildThreadSummariesForProject } from './threadSummaries';

export interface ProjectDetail {
  projectKey: string;
  recentEvents: ResearchEvent[];
  entities: WikiEntityDraft[];
  threadIntelligence: ReturnType<typeof buildThreadSummariesForProject>;
}

export function buildProjectDetail({
  projectKey,
  events,
  entities,
  now = Date.now()
}: {
  projectKey: string;
  events: ResearchEvent[];
  entities: WikiEntityDraft[];
  now?: number;
}): ProjectDetail {
  return {
    projectKey,
    recentEvents: events
      .filter((event) => event.projectKey === projectKey)
      .sort((left, right) => right.occurredAt - left.occurredAt)
      .slice(0, 8),
    entities: entities.filter((entity) => entity.projectKey === projectKey),
    threadIntelligence: buildThreadSummariesForProject({ events, projectKey, now })
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/workspace/projectDetail.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/workspace/projectDetail.test.ts src/server/workspace/projectDetail.ts
git commit -m "feat: add project detail view model"
```

## Task 3: Add Projects navigation and list page

**Files:**
- Modify: `src/components/workspace/WorkspaceShell.tsx`
- Create: `src/app/projects/page.tsx`
- Create: `tests/ui/projectsPage.test.tsx`
- Modify: `tests/app/smoke.test.ts`
- Modify: `tests/ui/navigationSemantics.test.tsx`

- [ ] **Step 1: Write the failing Projects-page and nav tests**

```tsx
// tests/app/smoke.test.ts
expect(html).toContain('Projects');

// tests/ui/projectsPage.test.tsx
expect(html).toContain('Projects');
expect(html).toContain('Projects in Motion');
expect(html).toContain('Active Threads');

// tests/ui/navigationSemantics.test.tsx
expect(html).toContain('/projects');
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/app/smoke.test.ts tests/ui/projectsPage.test.tsx tests/ui/navigationSemantics.test.tsx`
Expected: FAIL because the nav and Projects page do not exist yet.

- [ ] **Step 3: Write the minimal implementation**

```tsx
// src/components/workspace/WorkspaceShell.tsx
const navigationItems = [
  { href: '/', label: 'Today' },
  { href: '/projects', label: 'Projects' },
  { href: '/timeline', label: 'Timeline' },
  { href: '/entities', label: 'Knowledge' },
  { href: '/reviews', label: 'Reviews' }
];
```

```tsx
// src/app/projects/page.tsx
import { createWaybookConfig } from '@/lib/config';
import { ScopeTabs } from '@/components/reviews/ScopeTabs';
import { ProjectSummaryCard } from '@/components/projects/ProjectSummaryCard';
import { WorkspacePage, WorkspaceSection } from '@/components/workspace/WorkspacePage';
import { buildWorkspaceSnapshot } from '@/server/bootstrap/pipeline';
import { parseRequestedScope } from '@/server/reviews/scopeOptions';

export default async function ProjectsPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const scope = parseRequestedScope(
    typeof resolvedSearchParams.scopeKind === 'string' ? resolvedSearchParams.scopeKind : undefined,
    typeof resolvedSearchParams.scopeValue === 'string' ? resolvedSearchParams.scopeValue : undefined,
    typeof resolvedSearchParams.scopeLabel === 'string' ? resolvedSearchParams.scopeLabel : undefined
  );
  const snapshot = await buildWorkspaceSnapshot(createWaybookConfig(), { scope });

  return (
    <WorkspacePage
      title="Projects"
      description="Projects in motion, with active threads and repeated investigation signals."
      eyebrow="Projects"
    >
      <WorkspaceSection title="Scope" description={`Currently reading the ${snapshot.currentScope.scopeLabel} surface.`}>
        <ScopeTabs basePath="/projects" scopes={snapshot.availableScopes} currentScope={snapshot.currentScope} />
      </WorkspaceSection>
      <WorkspaceSection title="Projects in Motion" description="Project surfaces with the strongest recent activity and knowledge density.">
        <div className="grid gap-4 md:grid-cols-2">
          {snapshot.projectSummaries.map((summary) => (
            <ProjectSummaryCard key={summary.projectKey} summary={summary} scope={snapshot.currentScope} />
          ))}
        </div>
      </WorkspaceSection>
      <WorkspaceSection title="Active Threads" description="A quick scan of the most recently active investigations will appear here in phase 2.">
        <p className="text-sm leading-7 text-stone-600">Project thread intelligence is now connected through project detail pages.</p>
      </WorkspaceSection>
    </WorkspacePage>
  );
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/app/smoke.test.ts tests/ui/projectsPage.test.tsx tests/ui/navigationSemantics.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/workspace/WorkspaceShell.tsx src/app/projects/page.tsx tests/app/smoke.test.ts tests/ui/projectsPage.test.tsx tests/ui/navigationSemantics.test.tsx
git commit -m "feat: add projects workspace page"
```

## Task 4: Add project detail page and thread intelligence UI

**Files:**
- Create: `src/app/projects/[projectKey]/page.tsx`
- Create: `src/components/projects/ThreadSummaryCard.tsx`
- Create: `src/components/projects/RepeatedPatternList.tsx`
- Modify: `src/components/projects/ProjectSummaryCard.tsx`
- Create: `tests/ui/projectDetailPage.test.tsx`

- [ ] **Step 1: Write the failing project detail page test**

```tsx
import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import ProjectDetailPage from '@/app/projects/[projectKey]/page';

describe('ProjectDetailPage', () => {
  it('renders recent evidence, active threads, stalled threads, and repeated patterns', async () => {
    const html = renderToString(
      await ProjectDetailPage({
        params: Promise.resolve({ projectKey: 'waybook' }),
        searchParams: Promise.resolve({ scopeKind: 'project', scopeValue: 'waybook', scopeLabel: 'Waybook' })
      } as never)
    );

    expect(html).toContain('Project Detail');
    expect(html).toContain('Recent Evidence');
    expect(html).toContain('Active Threads');
    expect(html).toContain('Stalled Threads');
    expect(html).toContain('Repeated Patterns');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/ui/projectDetailPage.test.tsx`
Expected: FAIL because the project detail route does not exist yet.

- [ ] **Step 3: Write the minimal implementation**

```tsx
// src/components/projects/ThreadSummaryCard.tsx
import type { ReviewThreadState } from '@/types/review';

export function ThreadSummaryCard({ thread }: { thread: ReviewThreadState }) {
  return (
    <article className="rounded-[1.5rem] border border-stone-200/80 bg-white/85 p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">{thread.status}</p>
      <h3 className="mt-2 text-lg font-semibold text-stone-950">{thread.label}</h3>
      <p className="mt-3 text-sm leading-6 text-stone-600">{thread.eventCount} events · {thread.sourceFamilies.join(', ')}</p>
    </article>
  );
}
```

```tsx
// src/components/projects/RepeatedPatternList.tsx
export function RepeatedPatternList({ patterns }: { patterns: Array<{ label: string; count: number }> }) {
  if (patterns.length === 0) {
    return <p className="text-sm leading-7 text-stone-500">No repeated patterns detected.</p>;
  }

  return (
    <ul className="space-y-3 text-sm leading-7 text-stone-600">
      {patterns.map((pattern) => (
        <li key={pattern.label}>{pattern.label} · {pattern.count} threads</li>
      ))}
    </ul>
  );
}
```

```tsx
// src/app/projects/[projectKey]/page.tsx
import { notFound } from 'next/navigation';
import { createWaybookConfig } from '@/lib/config';
import { ScopeTabs } from '@/components/reviews/ScopeTabs';
import { TimelineList } from '@/components/timeline/TimelineList';
import { RepeatedPatternList } from '@/components/projects/RepeatedPatternList';
import { ThreadSummaryCard } from '@/components/projects/ThreadSummaryCard';
import { WorkspacePage, WorkspaceSection } from '@/components/workspace/WorkspacePage';
import { buildWorkspaceSnapshot } from '@/server/bootstrap/pipeline';
import { buildProjectDetail } from '@/server/workspace/projectDetail';
import { parseRequestedScope } from '@/server/reviews/scopeOptions';

export default async function ProjectDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ projectKey: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { projectKey } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const scope = parseRequestedScope(
    typeof resolvedSearchParams.scopeKind === 'string' ? resolvedSearchParams.scopeKind : undefined,
    typeof resolvedSearchParams.scopeValue === 'string' ? resolvedSearchParams.scopeValue : undefined,
    typeof resolvedSearchParams.scopeLabel === 'string' ? resolvedSearchParams.scopeLabel : undefined
  );
  const snapshot = await buildWorkspaceSnapshot(createWaybookConfig(), { scope });
  const detail = buildProjectDetail({
    projectKey,
    events: snapshot.items,
    entities: snapshot.entities
  });

  if (detail.recentEvents.length === 0 && detail.entities.length === 0) {
    notFound();
  }

  return (
    <WorkspacePage
      title={detail.projectKey}
      description="Project Detail"
      eyebrow="Projects"
    >
      <WorkspaceSection title="Scope" description={`Currently reading the ${snapshot.currentScope.scopeLabel} surface.`}>
        <ScopeTabs basePath={`/projects/${detail.projectKey}`} scopes={snapshot.availableScopes} currentScope={snapshot.currentScope} />
      </WorkspaceSection>
      <WorkspaceSection title="Recent Evidence" description="Recent events for this project.">
        <TimelineList items={detail.recentEvents} />
      </WorkspaceSection>
      <WorkspaceSection title="Active Threads" description="Threads that are currently moving.">
        <div className="grid gap-4 md:grid-cols-2">
          {detail.threadIntelligence.activeThreads.map((thread) => <ThreadSummaryCard key={thread.threadKey} thread={thread} />)}
        </div>
      </WorkspaceSection>
      <WorkspaceSection title="Stalled Threads" description="Threads that need a resume-or-close decision.">
        <div className="grid gap-4 md:grid-cols-2">
          {detail.threadIntelligence.stalledThreads.map((thread) => <ThreadSummaryCard key={thread.threadKey} thread={thread} />)}
        </div>
      </WorkspaceSection>
      <WorkspaceSection title="Repeated Patterns" description="Signals that the same investigation keeps recurring.">
        <RepeatedPatternList patterns={detail.threadIntelligence.repeatedPatterns} />
      </WorkspaceSection>
    </WorkspacePage>
  );
}
```

```tsx
// src/components/projects/ProjectSummaryCard.tsx
<a className="mt-5 inline-flex text-sm font-medium text-amber-700" href={withScopeQuery(`/projects/${summary.projectKey}`, scope)}>
  Open project
</a>
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/ui/projectDetailPage.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/projects/[projectKey]/page.tsx src/components/projects/ThreadSummaryCard.tsx src/components/projects/RepeatedPatternList.tsx src/components/projects/ProjectSummaryCard.tsx tests/ui/projectDetailPage.test.tsx
git commit -m "feat: add project detail intelligence page"
```

## Task 5: Add project intelligence API and final verification

**Files:**
- Create: `src/app/api/projects/route.ts`
- Create: `tests/api/projectsRoute.test.ts`
- Test: `tests/workspace/threadSummaries.test.ts`
- Test: `tests/workspace/projectDetail.test.ts`
- Test: `tests/ui/projectsPage.test.tsx`
- Test: `tests/ui/projectDetailPage.test.tsx`

- [ ] **Step 1: Write the failing projects API test**

```ts
import { describe, expect, it } from 'vitest';
import { GET } from '@/app/api/projects/route';

describe('GET /api/projects', () => {
  it('returns project summaries with thread intelligence', async () => {
    const response = await GET(new Request('http://localhost/api/projects?scopeKind=portfolio&scopeValue=portfolio'));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(payload.items)).toBe(true);
    expect(payload.items[0]).toHaveProperty('projectKey');
    expect(payload.items[0]).toHaveProperty('activeThreadCount');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/api/projectsRoute.test.ts`
Expected: FAIL because the route does not exist yet.

- [ ] **Step 3: Write the minimal implementation**

```ts
import { createWaybookConfig } from '@/lib/config';
import { buildWorkspaceSnapshot } from '@/server/bootstrap/pipeline';
import { buildThreadSummariesForProject } from '@/server/workspace/threadSummaries';
import { parseRequestedScope } from '@/server/reviews/scopeOptions';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const scope = parseRequestedScope(
    url.searchParams.get('scopeKind') ?? undefined,
    url.searchParams.get('scopeValue') ?? undefined,
    url.searchParams.get('scopeLabel') ?? undefined
  );
  const snapshot = await buildWorkspaceSnapshot(createWaybookConfig(), { scope });

  return Response.json({
    items: snapshot.projectSummaries.map((summary) => {
      const intelligence = buildThreadSummariesForProject({
        events: snapshot.items,
        projectKey: summary.projectKey
      });

      return {
        ...summary,
        activeThreadCount: intelligence.activeThreads.length,
        stalledThreadCount: intelligence.stalledThreads.length,
        repeatedPatternCount: intelligence.repeatedPatterns.length
      };
    })
  });
}
```

- [ ] **Step 4: Run the focused phase-2 suite**

Run: `npx vitest run tests/workspace/threadSummaries.test.ts tests/workspace/projectDetail.test.ts tests/ui/projectsPage.test.tsx tests/ui/projectDetailPage.test.tsx tests/api/projectsRoute.test.ts tests/app/smoke.test.ts tests/ui/navigationSemantics.test.tsx`
Expected: PASS

- [ ] **Step 5: Run the full verification suite**

Run: `npm test && npm run build`
Expected: PASS for both commands.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/projects/route.ts tests/api/projectsRoute.test.ts src/app/projects src/components/projects src/server/workspace tests/workspace tests/ui tests/app
git commit -m "feat: add phase 2 project thread intelligence"
```

## Self-Review

- Spec coverage: this plan implements the first bounded slice of phase 2 — project views, thread intelligence summaries, and duplicate-effort hints. It intentionally defers persisted thread tables and dedicated thread routes.
- Placeholder scan: no `TBD`, `TODO`, or “implement later” placeholders remain in the implementation steps.
- Type consistency: `buildThreadSummariesForProject`, `buildProjectDetail`, `ThreadSummaryCard`, and `RepeatedPatternList` are used consistently across route, UI, and test tasks.
