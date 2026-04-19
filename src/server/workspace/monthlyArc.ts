import type { ResearchEvent } from '@/types/research';
import type { ReviewDraft, ReviewPatternSummary } from '@/types/review';
import type { WikiEntityDraft } from '@/types/wiki';
import { buildThreadStates } from '@/server/reviews/threadStateBuilder';

const DAY_MS = 24 * 60 * 60 * 1000;

export interface MonthlyArc {
  periodStart: number;
  periodEnd: number;
  weeks: number;
  /** week boundaries in ms, length = weeks+1 */
  weekBounds: number[];
  /** weekly review drafts whose period ends inside this month (newest last) */
  weeklyReviews: ReviewDraft[];
  /** project keys that first appeared this month */
  newProjects: string[];
  /** projects where the latest important shipping signal surfaced this month */
  shipped: ArcProject[];
  /** threads dormant for >14d that had activity earlier this month */
  stalled: ArcProject[];
  /** top repeated patterns this month */
  repeatedPatterns: ReviewPatternSummary[];
  /** coarse estimate: #distinct "deep work" days (>= 3 events with importance > 0.5) */
  deepWorkDays: number;
  /** total events this month */
  eventCount: number;
  /** project totals this month, ordered by weight desc (count × mean importance) */
  projectTotals: ProjectTotal[];
}

export interface ArcProject {
  projectKey: string;
  label: string;
  atMs: number;
  sampleEventIds: string[];
}

export interface ProjectTotal {
  projectKey: string;
  eventCount: number;
  weight: number;
  lastEventAt: number;
}

const SHIP_TOKENS = [
  'done', 'ship', 'shipped', 'merged', 'resolved', 'fixed',
  'closed', 'landed', 'released', '完成', '合并', '已完成'
];

export function buildMonthlyArc(
  events: ResearchEvent[],
  entities: WikiEntityDraft[],
  weeklyReviews: ReviewDraft[],
  now = Date.now(),
  weeks = 4
): MonthlyArc {
  const periodEnd = startOfDay(now) + DAY_MS;
  const periodStart = periodEnd - weeks * 7 * DAY_MS;

  const inRange = events.filter((e) => e.occurredAt >= periodStart && e.occurredAt < periodEnd);

  // week boundaries (oldest → newest)
  const weekBounds = Array.from({ length: weeks + 1 }, (_, i) => periodStart + i * 7 * DAY_MS);

  // weekly reviews whose period overlaps
  const monthlyReviews = weeklyReviews
    .filter((r) => r.reviewType === 'weekly-review' && r.periodEnd >= periodStart)
    .sort((a, b) => a.periodEnd - b.periodEnd);

  // new projects this month — first ever event within period
  const projectFirstEver = new Map<string, number>();
  for (const e of events) {
    const prev = projectFirstEver.get(e.projectKey);
    if (prev === undefined || e.occurredAt < prev) projectFirstEver.set(e.projectKey, e.occurredAt);
  }
  const newProjects = [...projectFirstEver.entries()]
    .filter(([, at]) => at >= periodStart)
    .sort((a, b) => a[1] - b[1])
    .map(([key]) => key);

  // shipped — events matching ship tokens this month, grouped by project (pick highest importance)
  const shippedMap = new Map<string, ArcProject>();
  for (const e of inRange) {
    const hay = `${e.title} ${e.summary}`.toLowerCase();
    if (!SHIP_TOKENS.some((token) => hay.includes(token))) continue;
    const current = shippedMap.get(e.projectKey);
    if (!current || e.importanceScore > 0.5) {
      shippedMap.set(e.projectKey, {
        projectKey: e.projectKey,
        label: e.title,
        atMs: e.occurredAt,
        sampleEventIds: [e.id]
      });
    }
  }
  const shipped = [...shippedMap.values()].sort((a, b) => b.atMs - a.atMs);

  // stalled — threads whose last event is 14+ days old but had activity this month
  const threadStates = buildThreadStates(inRange, now);
  const stalled: ArcProject[] = threadStates
    .filter((t) => now - t.lastEventAt > 14 * DAY_MS && t.firstEventAt >= periodStart)
    .map((t) => ({
      projectKey: t.projectKey,
      label: t.label,
      atMs: t.lastEventAt,
      sampleEventIds: t.supportingEventIds.slice(0, 3)
    }));

  // repeated patterns — top tags across this month's events (non-generic)
  const GENERIC = new Set(['claude', 'codex', 'git', 'experiment', 'primary', 'derived', 'synthetic']);
  const tagCounts = new Map<string, { count: number; ids: string[] }>();
  for (const e of inRange) {
    for (const tag of e.tags) {
      if (GENERIC.has(tag) || tag.startsWith('run:')) continue;
      const cur = tagCounts.get(tag) ?? { count: 0, ids: [] };
      cur.count += 1;
      if (cur.ids.length < 6) cur.ids.push(e.id);
      tagCounts.set(tag, cur);
    }
  }
  const repeatedPatterns: ReviewPatternSummary[] = [...tagCounts.entries()]
    .filter(([, v]) => v.count >= 3)
    .sort((a, b) => b[1].count - a[1].count || (a[0] < b[0] ? -1 : 1))
    .slice(0, 8)
    .map(([label, v]) => ({ label, count: v.count, supportingEventIds: v.ids }));

  // deep work days — distinct days with 3+ events of importance >= 0.5
  const byDay = new Map<number, number>();
  for (const e of inRange) {
    if (e.importanceScore < 0.5) continue;
    const d = startOfDay(e.occurredAt);
    byDay.set(d, (byDay.get(d) ?? 0) + 1);
  }
  const deepWorkDays = [...byDay.values()].filter((n) => n >= 3).length;

  // project totals
  const totals = new Map<string, { count: number; sum: number; last: number }>();
  for (const e of inRange) {
    const cur = totals.get(e.projectKey) ?? { count: 0, sum: 0, last: 0 };
    cur.count += 1;
    cur.sum += Math.max(0, Math.min(1, e.importanceScore));
    if (e.occurredAt > cur.last) cur.last = e.occurredAt;
    totals.set(e.projectKey, cur);
  }
  const projectTotals: ProjectTotal[] = [...totals.entries()]
    .map(([projectKey, v]) => ({
      projectKey,
      eventCount: v.count,
      weight: v.count * (v.sum / Math.max(1, v.count)),
      lastEventAt: v.last
    }))
    .sort((a, b) => b.weight - a.weight);

  // quiet-count: "entities" isn't used in the arc itself, but we expose something
  // downstream callers may want. Keep parameter so type stays stable.
  void entities;

  return {
    periodStart,
    periodEnd,
    weeks,
    weekBounds,
    weeklyReviews: monthlyReviews,
    newProjects,
    shipped,
    stalled,
    repeatedPatterns,
    deepWorkDays,
    eventCount: inRange.length,
    projectTotals
  };
}

function startOfDay(ms: number) {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}
