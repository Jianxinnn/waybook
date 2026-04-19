import { formatWorkspaceTimestamp } from '@/components/workspace/formatting';
import type { ReviewScope } from '@/types/review';
import { buildWorkspaceHref, dict, type Lang } from '@/lib/i18n';
import { Sparkline, bucketEventsByDay } from '@/components/viz/Sparkline';
import { StatusDot } from '@/components/viz/StatusDot';

interface ProjectSummary {
  projectKey: string;
  eventCount: number;
  entityCount: number;
  lastEventAt: number | null;
  highlights: string[];
  recentOccurrences?: number[];
  status?: 'active' | 'stalled' | 'dormant';
}

interface ProjectSummaryCardProps {
  summary: ProjectSummary;
  scope?: ReviewScope | null;
  lang?: Lang;
}

function deriveStatus(lastEventAt: number | null): 'active' | 'stalled' | 'dormant' {
  if (lastEventAt === null) return 'dormant';
  const dayMs = 24 * 60 * 60 * 1000;
  const age = Date.now() - lastEventAt;
  if (age <= 3 * dayMs) return 'active';
  if (age <= 14 * dayMs) return 'stalled';
  return 'dormant';
}

export function ProjectSummaryCard({
  summary,
  scope = null,
  lang = 'en'
}: ProjectSummaryCardProps) {
  const t = dict[lang];
  const status = summary.status ?? deriveStatus(summary.lastEventAt);
  const spark = bucketEventsByDay(summary.recentOccurrences ?? [], 14);

  return (
    <article className="group relative overflow-hidden rounded-[1.5rem] border border-stone-200/80 bg-gradient-to-br from-white via-white to-stone-50/70 p-5 shadow-sm transition hover:shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
            {t.scope.project}
          </p>
          <h3 className="mt-2 text-xl font-semibold text-stone-950">
            <a href={buildWorkspaceHref(`/projects/${summary.projectKey}`, scope, lang)}>
              {`${t.scope.project}: ${summary.projectKey}`}
            </a>
          </h3>
        </div>
        <StatusDot status={status} />
      </div>

      <div className="mt-4">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400">
          {t.today.days14} · {summary.eventCount} {t.common.events}
        </p>
        <Sparkline values={spark} />
        <p className="mt-1 text-[11px] tracking-[0.08em] text-stone-500">
          {formatWorkspaceTimestamp(summary.lastEventAt, lang)}
        </p>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm text-stone-600">
        <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-stone-200/60">
          <dt className="text-[10px] uppercase tracking-[0.2em] text-stone-500">
            {t.common.events}
          </dt>
          <dd className="mt-1 text-2xl font-semibold text-stone-950">{summary.eventCount}</dd>
        </div>
        <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-stone-200/60">
          <dt className="text-[10px] uppercase tracking-[0.2em] text-stone-500">
            {t.common.knowledge}
          </dt>
          <dd className="mt-1 text-2xl font-semibold text-stone-950">{summary.entityCount}</dd>
        </div>
      </dl>

      <div className="mt-4">
        {summary.highlights.length > 0 ? (
          <ul className="space-y-1.5 text-sm leading-6 text-stone-600">
            {summary.highlights.slice(0, 3).map((highlight) => (
              <li key={highlight} className="flex gap-2">
                <span className="mt-2 inline-block h-1 w-1 flex-none rounded-full bg-amber-500" />
                <span>{highlight}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm leading-6 text-stone-500">{t.common.waiting}</p>
        )}
      </div>
    </article>
  );
}
