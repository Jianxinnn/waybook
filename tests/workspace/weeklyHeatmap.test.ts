import { describe, expect, it } from 'vitest';
import type { ResearchEvent } from '@/types/research';
import { buildWeeklyHeatmap } from '@/server/workspace/weeklyHeatmap';

function makeEvent(overrides: Partial<ResearchEvent> = {}): ResearchEvent {
  return {
    id: 'event-1',
    rawEventId: 'raw-1',
    sourceFamily: 'git',
    connectorId: 'git-log',
    provenanceTier: 'primary',
    eventType: 'git.commit',
    title: 'Event title',
    summary: '',
    projectKey: 'waybook',
    repoPath: '/repo/waybook',
    threadKey: 'project:waybook:default',
    occurredAt: 0,
    actorKind: 'user',
    evidenceRefs: [],
    files: [],
    tags: [],
    importanceScore: 0.5,
    ...overrides
  };
}

describe('buildWeeklyHeatmap', () => {
  const now = new Date('2026-04-18T15:00:00Z').getTime();
  const startOfToday = (() => {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  })();
  const day = 86_400_000;

  it('buckets events into a day × project matrix with weighted cells', () => {
    const events: ResearchEvent[] = [
      // 4 today, project A (heavy)
      makeEvent({ id: 'a1', occurredAt: startOfToday + 1, importanceScore: 0.9, projectKey: 'a' }),
      makeEvent({ id: 'a2', occurredAt: startOfToday + 2, importanceScore: 0.8, projectKey: 'a' }),
      makeEvent({ id: 'a3', occurredAt: startOfToday + 3, importanceScore: 0.8, projectKey: 'a' }),
      makeEvent({ id: 'a4', occurredAt: startOfToday + 4, importanceScore: 0.9, projectKey: 'a' }),
      // 1 today, project B
      makeEvent({ id: 'b1', occurredAt: startOfToday + 5, importanceScore: 0.3, projectKey: 'b' }),
      // 2 days ago project A
      makeEvent({ id: 'a5', occurredAt: startOfToday - 2 * day + 100, importanceScore: 0.5, projectKey: 'a' }),
      // outside range
      makeEvent({ id: 'old', occurredAt: startOfToday - 30 * day, importanceScore: 0.5, projectKey: 'c' })
    ];
    const heat = buildWeeklyHeatmap(events, 7, now);

    expect(heat.days).toBe(7);
    expect(heat.projectKeys).toEqual(['a', 'b']);
    // 4 today + 1 today + 1 two-days-ago = 6 total kept
    const totalCount = heat.cells.reduce((n, c) => n + c.count, 0);
    expect(totalCount).toBe(6);
    expect(heat.dailyTotals.reduce((n, x) => n + x, 0)).toBe(6);

    const todayIndex = 6; // last position
    const aCellToday = heat.cells.find((c) => c.projectKey === 'a' && c.dayIndex === todayIndex);
    expect(aCellToday).toBeDefined();
    expect(aCellToday!.count).toBe(4);
    expect(aCellToday!.weight).toBeGreaterThan(0);
    expect(aCellToday!.weight).toBeLessThanOrEqual(1);
    // normalized against peak: this should be the peak cell
    expect(aCellToday!.weight).toBe(1);
  });

  it('handles empty input', () => {
    const heat = buildWeeklyHeatmap([], 7, now);
    expect(heat.projectKeys).toEqual([]);
    expect(heat.cells).toEqual([]);
    expect(heat.dailyTotals).toEqual([0, 0, 0, 0, 0, 0, 0]);
  });
});
