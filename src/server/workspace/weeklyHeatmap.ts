import type { ResearchEvent } from '@/types/research';

const DAY_MS = 24 * 60 * 60 * 1000;

export interface HeatmapCell {
  dayIndex: number;    // 0..days-1, 0 = oldest
  projectKey: string;
  count: number;
  importance: number;  // mean importanceScore for the cell (0..1)
  /** visual weight = count × mean(importance), 0..1 normalized across matrix */
  weight: number;
}

export interface WeeklyHeatmap {
  days: number;
  start: number;        // day 0's start-of-day
  end: number;          // exclusive end of last day
  projectKeys: string[]; // ordered by total weight desc
  dayStarts: number[];  // per-day start-of-day timestamps (length = days)
  cells: HeatmapCell[]; // only non-zero cells
  /** count per day across all projects (length = days) */
  dailyTotals: number[];
  /** max `count × importance` across cells, used to normalize weight */
  peak: number;
}

function startOfDay(ms: number) {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * Build a day × project heatmap matrix for the last `days` days.
 * Projects are ordered by total weight desc. Weight = count × mean(importance).
 */
export function buildWeeklyHeatmap(
  events: ResearchEvent[],
  days = 7,
  now = Date.now()
): WeeklyHeatmap {
  const end = startOfDay(now) + DAY_MS;
  const start = end - days * DAY_MS;
  const dayStarts = Array.from({ length: days }, (_, i) => start + i * DAY_MS);

  interface Bucket {
    count: number;
    sum: number;
  }
  const grid = new Map<string, Bucket>(); // key = `${projectKey}|${dayIndex}`
  const projectTotals = new Map<string, number>();
  const dailyTotals = new Array(days).fill(0) as number[];

  for (const e of events) {
    if (e.occurredAt < start || e.occurredAt >= end) continue;
    const dayIndex = Math.min(days - 1, Math.max(0, Math.floor((e.occurredAt - start) / DAY_MS)));
    const key = `${e.projectKey}|${dayIndex}`;
    const b = grid.get(key) ?? { count: 0, sum: 0 };
    b.count += 1;
    b.sum += clamp01(e.importanceScore);
    grid.set(key, b);
    dailyTotals[dayIndex] += 1;
  }

  const rawCells: Array<{ key: string; projectKey: string; dayIndex: number; count: number; importance: number; raw: number }> = [];
  for (const [key, b] of grid) {
    const [projectKey, dayIndexStr] = key.split('|');
    const importance = b.sum / Math.max(1, b.count);
    const raw = b.count * importance;
    rawCells.push({ key, projectKey, dayIndex: Number(dayIndexStr), count: b.count, importance, raw });
    projectTotals.set(projectKey, (projectTotals.get(projectKey) ?? 0) + raw);
  }

  const peak = rawCells.reduce((m, c) => (c.raw > m ? c.raw : m), 0) || 1;

  const projectKeys = [...projectTotals.entries()]
    .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))
    .map(([k]) => k);

  const cells: HeatmapCell[] = rawCells.map((c) => ({
    dayIndex: c.dayIndex,
    projectKey: c.projectKey,
    count: c.count,
    importance: c.importance,
    weight: c.raw / peak
  }));

  return {
    days,
    start,
    end,
    projectKeys,
    dayStarts,
    cells,
    dailyTotals,
    peak
  };
}

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}
