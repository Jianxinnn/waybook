import { describe, expect, it } from 'vitest';
import type { ResearchEvent } from '@/types/research';
import { compileEntities } from '@/server/wiki/entityCompiler';
import { renderEntityMarkdown } from '@/server/wiki/entityRenderer';

describe('compileEntities', () => {
  it('compiles project, experiment, and topic entities from research events', () => {
    const events: ResearchEvent[] = [
      {
        id: 'event-1',
        rawEventId: 'raw-1',
        sourceFamily: 'git',
        connectorId: 'git-log',
        provenanceTier: 'primary',
        eventType: 'git.commit',
        title: 'feat: add timeline service',
        summary: 'Adds the timeline query service.',
        projectKey: 'waybook',
        repoPath: '/repo/waybook',
        threadKey: 'project:waybook:timeline',
        occurredAt: 1_710_000_000_000,
        actorKind: 'user',
        evidenceRefs: ['git-log:commit-1'],
        files: ['src/server/search/timelineService.ts'],
        tags: ['git', 'primary', 'timeline'],
        importanceScore: 0.8
      },
      {
        id: 'event-2',
        rawEventId: 'raw-2',
        sourceFamily: 'experiment',
        connectorId: 'experiment-fs',
        provenanceTier: 'primary',
        eventType: 'experiment.metrics',
        title: 'run-a metrics updated',
        summary: 'Accuracy improved to 0.92.',
        projectKey: 'waybook',
        repoPath: '/repo/waybook',
        threadKey: 'experiment:waybook:run-a',
        occurredAt: 1_710_000_010_000,
        actorKind: 'system',
        evidenceRefs: ['experiment-fs:run-a-metrics'],
        files: ['experiments/run-a/metrics.json'],
        tags: ['experiment', 'primary', 'run:run-a', 'timeline'],
        importanceScore: 0.7
      }
    ];

    const entities = compileEntities(events);
    const entityTypes = entities.map((entity) => entity.entityType);

    expect(entityTypes).toEqual(expect.arrayContaining(['project', 'experiment', 'topic']));

    const projectEntity = entities.find((entity) => entity.entityType === 'project');
    expect(projectEntity?.title).toBe('Waybook');

    const markdown = renderEntityMarkdown(projectEntity!);
    expect(markdown).toContain('title: Waybook');
    expect(markdown).toContain('## Summary');
    expect(markdown).toContain('git.commit');
  });
});
