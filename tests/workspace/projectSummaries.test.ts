import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createWaybookConfig } from '@/lib/config';
import { buildWorkspaceSnapshot } from '@/server/bootstrap/pipeline';
import type { ResearchEvent } from '@/types/research';
import type { WikiEntityDraft } from '@/types/wiki';
import { buildProjectSummaries } from '@/server/workspace/projectSummaries';

const tempPaths: string[] = [];

async function makeTempDir(prefix: string) {
  const dir = await mkdtemp(path.join(tmpdir(), prefix));
  tempPaths.push(dir);
  return dir;
}

afterEach(async () => {
  await Promise.all(tempPaths.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe('buildProjectSummaries', () => {
  it('builds deterministic per-project summaries from events and entities', () => {
    const events: ResearchEvent[] = [
      {
        id: 'event-1',
        rawEventId: 'raw-1',
        sourceFamily: 'git',
        connectorId: 'git-log',
        provenanceTier: 'primary',
        eventType: 'git.commit',
        title: 'Prototype project summary card',
        summary: 'Initial project summary UI concept.',
        projectKey: 'waybook',
        repoPath: '/repo/waybook',
        threadKey: 'project:waybook:workspace',
        occurredAt: Date.parse('2026-04-16T09:00:00Z'),
        actorKind: 'user',
        evidenceRefs: ['git:1'],
        files: ['src/app/page.tsx'],
        tags: ['workspace'],
        importanceScore: 0.95
      },
      {
        id: 'event-2',
        rawEventId: 'raw-2',
        sourceFamily: 'codex',
        connectorId: 'codex-rollout-jsonl',
        provenanceTier: 'primary',
        eventType: 'codex.tool-result',
        title: 'Ship workspace refresh backend slice',
        summary: 'Connected the workspace snapshot builder.',
        projectKey: 'waybook',
        repoPath: '/repo/waybook',
        threadKey: 'project:waybook:workspace',
        occurredAt: Date.parse('2026-04-16T11:00:00Z'),
        actorKind: 'agent',
        evidenceRefs: ['codex:1'],
        files: ['src/server/bootstrap/pipeline.ts'],
        tags: ['workspace'],
        importanceScore: 0.82
      },
      {
        id: 'event-3',
        rawEventId: 'raw-3',
        sourceFamily: 'claude',
        connectorId: 'claude-cli-jsonl',
        provenanceTier: 'primary',
        eventType: 'claude.message',
        title: 'Backfill entity registry',
        summary: 'Confirmed project entities still compile.',
        projectKey: 'waybook',
        repoPath: '/repo/waybook',
        threadKey: 'project:waybook:entities',
        occurredAt: Date.parse('2026-04-16T10:00:00Z'),
        actorKind: 'agent',
        evidenceRefs: ['claude:1'],
        files: ['src/server/wiki/entityCompiler.ts'],
        tags: ['entities'],
        importanceScore: 0.82
      },
      {
        id: 'event-4',
        rawEventId: 'raw-4',
        sourceFamily: 'experiment',
        connectorId: 'experiment-fs',
        provenanceTier: 'primary',
        eventType: 'experiment.metrics',
        title: 'Investigated schema drift',
        summary: 'Validated refresh metrics for a second project.',
        projectKey: 'notes',
        repoPath: '/repo/notes',
        threadKey: 'experiment:notes:refresh-eval',
        occurredAt: Date.parse('2026-04-16T12:00:00Z'),
        actorKind: 'system',
        evidenceRefs: ['experiment:1'],
        files: ['experiments/refresh-eval/metrics.json'],
        tags: ['metrics', 'run:refresh-eval'],
        importanceScore: 0.7
      }
    ];

    const entities: WikiEntityDraft[] = [
      {
        id: 'entity-1',
        entityType: 'project',
        slug: 'waybook',
        title: 'Waybook',
        projectKey: 'waybook',
        canonicalSummary: 'Waybook summary',
        status: 'active',
        sourceThreadIds: ['project:waybook:workspace'],
        supportingEventIds: ['event-1', 'event-2'],
        outboundEntityIds: [],
        managedMarkdown: '',
        obsidianPath: 'projects/waybook.md'
      },
      {
        id: 'entity-2',
        entityType: 'topic',
        slug: 'topic-workspace',
        title: 'Workspace',
        projectKey: 'waybook',
        canonicalSummary: 'Workspace summary',
        status: 'active',
        sourceThreadIds: ['project:waybook:workspace'],
        supportingEventIds: ['event-1', 'event-2'],
        outboundEntityIds: [],
        managedMarkdown: '',
        obsidianPath: 'topics/workspace.md'
      },
      {
        id: 'entity-3',
        entityType: 'project',
        slug: 'notes',
        title: 'Notes',
        projectKey: 'notes',
        canonicalSummary: 'Notes summary',
        status: 'active',
        sourceThreadIds: ['experiment:notes:refresh-eval'],
        supportingEventIds: ['event-4'],
        outboundEntityIds: [],
        managedMarkdown: '',
        obsidianPath: 'projects/notes.md'
      }
    ];

    expect(buildProjectSummaries(events, entities)).toEqual([
      {
        projectKey: 'notes',
        eventCount: 1,
        entityCount: 1,
        lastEventAt: Date.parse('2026-04-16T12:00:00Z'),
        highlights: ['Investigated schema drift'],
        recentOccurrences: [Date.parse('2026-04-16T12:00:00Z')]
      },
      {
        projectKey: 'waybook',
        eventCount: 3,
        entityCount: 2,
        lastEventAt: Date.parse('2026-04-16T11:00:00Z'),
        highlights: [
          'Prototype project summary card',
          'Ship workspace refresh backend slice',
          'Backfill entity registry'
        ],
        recentOccurrences: [
          Date.parse('2026-04-16T09:00:00Z'),
          Date.parse('2026-04-16T11:00:00Z'),
          Date.parse('2026-04-16T10:00:00Z')
        ]
      }
    ]);
  });

  it('orders tied project summaries with locale-independent project key comparison', () => {
    const events: ResearchEvent[] = [
      {
        id: 'event-lower',
        rawEventId: 'raw-lower',
        sourceFamily: 'git',
        connectorId: 'git-log',
        provenanceTier: 'primary',
        eventType: 'git.commit',
        title: 'lowercase project',
        summary: 'Uses a lowercase project key.',
        projectKey: 'a',
        repoPath: '/repo/a',
        threadKey: 'project:a:summary',
        occurredAt: Date.parse('2026-04-16T11:00:00Z'),
        actorKind: 'user',
        evidenceRefs: ['git:lower'],
        files: ['src/server/workspace/projectSummaries.ts'],
        tags: ['workspace'],
        importanceScore: 0.8
      },
      {
        id: 'event-upper',
        rawEventId: 'raw-upper',
        sourceFamily: 'git',
        connectorId: 'git-log',
        provenanceTier: 'primary',
        eventType: 'git.commit',
        title: 'uppercase project',
        summary: 'Uses an uppercase project key.',
        projectKey: 'A',
        repoPath: '/repo/A',
        threadKey: 'project:A:summary',
        occurredAt: Date.parse('2026-04-16T11:00:00Z'),
        actorKind: 'user',
        evidenceRefs: ['git:upper'],
        files: ['src/server/workspace/projectSummaries.ts'],
        tags: ['workspace'],
        importanceScore: 0.8
      }
    ];

    expect(buildProjectSummaries(events, []).map((summary) => summary.projectKey)).toEqual(['A', 'a']);
  });

  it('orders tied highlights with locale-independent string comparison', () => {
    const events: ResearchEvent[] = [
      {
        id: 'event-b',
        rawEventId: 'raw-b',
        sourceFamily: 'git',
        connectorId: 'git-log',
        provenanceTier: 'primary',
        eventType: 'git.commit',
        title: 'e\u0301 plan',
        summary: 'Second equivalent title variant.',
        projectKey: 'waybook',
        repoPath: '/repo/waybook',
        threadKey: 'project:waybook:tied',
        occurredAt: Date.parse('2026-04-16T11:00:00Z'),
        actorKind: 'user',
        evidenceRefs: ['git:b'],
        files: ['src/server/workspace/projectSummaries.ts'],
        tags: ['workspace'],
        importanceScore: 0.8
      },
      {
        id: 'event-a',
        rawEventId: 'raw-a',
        sourceFamily: 'git',
        connectorId: 'git-log',
        provenanceTier: 'primary',
        eventType: 'git.commit',
        title: 'é plan',
        summary: 'First equivalent title variant.',
        projectKey: 'waybook',
        repoPath: '/repo/waybook',
        threadKey: 'project:waybook:tied',
        occurredAt: Date.parse('2026-04-16T11:00:00Z'),
        actorKind: 'user',
        evidenceRefs: ['git:a'],
        files: ['src/server/workspace/projectSummaries.ts'],
        tags: ['workspace'],
        importanceScore: 0.8
      }
    ];

    expect(buildProjectSummaries(events, [])).toEqual([
      {
        projectKey: 'waybook',
        eventCount: 2,
        entityCount: 0,
        lastEventAt: Date.parse('2026-04-16T11:00:00Z'),
        highlights: ['e\u0301 plan', 'é plan'],
        recentOccurrences: [
          Date.parse('2026-04-16T11:00:00Z'),
          Date.parse('2026-04-16T11:00:00Z')
        ]
      }
    ]);
  });

  it('computes lastEventAt for large projects without spreading event timestamps', () => {
    const eventCount = 150_000;
    const events: ResearchEvent[] = Array.from({ length: eventCount }, (_, index) => ({
      id: `event-${index}`,
      rawEventId: `raw-${index}`,
      sourceFamily: 'git',
      connectorId: 'git-log',
      provenanceTier: 'primary',
      eventType: 'git.commit',
      title: `Commit ${index}`,
      summary: `Summary ${index}`,
      projectKey: 'waybook',
      repoPath: '/repo/waybook',
      threadKey: 'project:waybook:large',
      occurredAt: index,
      actorKind: 'user',
      evidenceRefs: [`git:${index}`],
      files: [],
      tags: ['workspace'],
      importanceScore: 0.8
    }));

    expect(buildProjectSummaries(events, [])).toMatchObject([
      {
        projectKey: 'waybook',
        eventCount,
        entityCount: 0,
        lastEventAt: eventCount - 1
      }
    ]);
  });

  it('returns null lastEventAt and empty highlights for entity-only projects', () => {
    const entities: WikiEntityDraft[] = [
      {
        id: 'entity-1',
        entityType: 'project',
        slug: 'entity-only',
        title: 'Entity Only',
        projectKey: 'entity-only',
        canonicalSummary: 'Entity-only summary',
        status: 'active',
        sourceThreadIds: [],
        supportingEventIds: [],
        outboundEntityIds: [],
        managedMarkdown: '',
        obsidianPath: 'projects/entity-only.md'
      }
    ];

    expect(buildProjectSummaries([], entities)).toEqual([
      {
        projectKey: 'entity-only',
        eventCount: 0,
        entityCount: 1,
        lastEventAt: null,
        highlights: [],
        recentOccurrences: []
      }
    ]);
  });

  it('exposes project summaries on the workspace snapshot', async () => {
    const root = await makeTempDir('waybook-workspace-snapshot-');
    const config = createWaybookConfig({
      databasePath: path.join(root, 'waybook.sqlite'),
      exportRoot: path.join(root, 'obsidian'),
      projectRegistryPath: path.join(root, 'project-registry.json'),
      claudeProjectsRoots: [],
      codexSessionsRoots: [],
      repoRoots: [],
      experimentRoots: [],
      claudeMemDbPath: path.join(root, 'claude-mem.sqlite'),
      seededSourcesEnabled: true,
      secretaryAutogenerateOnRead: false
    });

    const snapshot = await buildWorkspaceSnapshot(config);

    expect(snapshot.projectSummaries).toEqual(buildProjectSummaries(snapshot.items, snapshot.entities));
  });

  it('does not write or refresh data during passive snapshot reads', async () => {
    const root = await makeTempDir('waybook-workspace-passive-read-');
    const config = createWaybookConfig({
      databasePath: path.join(root, 'waybook.sqlite'),
      exportRoot: path.join(root, 'obsidian'),
      projectRegistryPath: path.join(root, 'project-registry.json'),
      claudeProjectsRoots: [],
      codexSessionsRoots: [],
      repoRoots: [],
      experimentRoots: [],
      claudeMemDbPath: path.join(root, 'claude-mem.sqlite'),
      seededSourcesEnabled: true,
      secretaryAutogenerateOnRead: true
    });

    const snapshot = await buildWorkspaceSnapshot(config);

    expect(snapshot.items).toEqual([]);
    expect(snapshot.entities).toEqual([]);
    expect(snapshot.reviews).toEqual([]);
    expect(snapshot.availableScopes).toEqual([
      {
        scopeKind: 'portfolio',
        scopeValue: 'portfolio',
        scopeLabel: 'Portfolio'
      }
    ]);
    expect(snapshot.latestDailyBrief).toBeNull();
    expect(snapshot.latestWeeklyReview).toBeNull();
  });
});
