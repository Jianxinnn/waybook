import { describe, expect, it } from 'vitest';
import type { ResearchEvent } from '@/types/research';
import { buildMonthlyArc } from '@/server/workspace/monthlyArc';

const NOW = new Date('2026-04-18T12:00:00Z').getTime();
const DAY = 86_400_000;

function makeEvent(overrides: Partial<ResearchEvent> = {}): ResearchEvent {
  return {
    id: 'e-1',
    rawEventId: 'r-1',
    sourceFamily: 'git',
    connectorId: 'git-log',
    provenanceTier: 'primary',
    eventType: 'git.commit',
    title: 'Work',
    summary: '',
    projectKey: 'waybook',
    repoPath: '/repo',
    threadKey: 'project:waybook:a',
    occurredAt: NOW,
    actorKind: 'user',
    evidenceRefs: [],
    files: [],
    tags: [],
    importanceScore: 0.5,
    ...overrides
  };
}

describe('buildMonthlyArc', () => {
  it('detects new projects, shipped signals, repeated patterns, deep-work days', () => {
    const events: ResearchEvent[] = [
      // project new-within-month
      makeEvent({ id: 'n1', projectKey: 'fresh', occurredAt: NOW - 3 * DAY }),
      // old project present before month
      makeEvent({ id: 'o1', projectKey: 'waybook', occurredAt: NOW - 90 * DAY }),
      makeEvent({ id: 'o2', projectKey: 'waybook', occurredAt: NOW - 5 * DAY }),
      // shipping signal
      makeEvent({
        id: 's1',
        projectKey: 'waybook',
        occurredAt: NOW - 4 * DAY,
        title: 'Release v1 shipped to production',
        importanceScore: 0.85
      }),
      // deep-work day: 3 events, importance >= 0.5
      makeEvent({ id: 'd1', occurredAt: NOW - 1 * DAY, importanceScore: 0.7, tags: ['ranking'] }),
      makeEvent({ id: 'd2', occurredAt: NOW - 1 * DAY + 1000, importanceScore: 0.7, tags: ['ranking'] }),
      makeEvent({ id: 'd3', occurredAt: NOW - 1 * DAY + 2000, importanceScore: 0.7, tags: ['ranking'] })
    ];
    const arc = buildMonthlyArc(events, [], [], NOW, 4);
    expect(arc.newProjects).toContain('fresh');
    expect(arc.newProjects).not.toContain('waybook');
    expect(arc.shipped.map((s) => s.projectKey)).toContain('waybook');
    expect(arc.deepWorkDays).toBeGreaterThanOrEqual(1);
    expect(arc.repeatedPatterns.some((p) => p.label === 'ranking' && p.count >= 3)).toBe(true);
    expect(arc.projectTotals[0]!.weight).toBeGreaterThan(0);
  });
});
