import { formatWorkspaceTimestamp } from '@/components/workspace/formatting';
import { SourceBadge } from '@/components/viz/SourceBadge';
import { StatusDot } from '@/components/viz/StatusDot';
import { ImportanceMeter } from '@/components/viz/ImportanceMeter';
import { dict, type Lang } from '@/lib/i18n';
import type { ReviewThreadSummary } from '@/types/review';

interface ThreadSummaryCardProps {
  thread: ReviewThreadSummary;
  lang?: Lang;
}

export function ThreadSummaryCard({ thread, lang = 'en' }: ThreadSummaryCardProps) {
  const t = dict[lang];
  const status = thread.status ?? 'active';

  return (
    <article className="relative overflow-hidden rounded-[1.5rem] border border-stone-200/80 bg-white/90 p-5 shadow-sm">
      <div className="absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-amber-400 via-amber-300 to-transparent" />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">
            {t.common.threads}
          </p>
          <h3 className="mt-1.5 text-[1.05rem] font-semibold leading-snug text-stone-950">
            {thread.label}
          </h3>
        </div>
        <StatusDot status={status} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-stone-500">
        <span className="rounded-full bg-amber-50 px-2.5 py-0.5 font-semibold uppercase tracking-[0.18em] text-amber-800">
          {thread.projectKey}
        </span>
        <span>
          {thread.eventCount} {t.common.events}
        </span>
        <span className="h-3 w-px bg-stone-300" />
        <ImportanceMeter score={thread.importanceScore} />
      </div>

      {(thread.sourceFamilies ?? []).length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {(thread.sourceFamilies ?? []).slice(0, 3).map((family) => (
            <SourceBadge key={family} family={family} />
          ))}
        </div>
      ) : null}

      {thread.exemplarTitles && thread.exemplarTitles.length > 0 ? (
        <ul className="mt-3 space-y-1.5 text-sm leading-6 text-stone-600">
          {thread.exemplarTitles.slice(0, 3).map((title) => (
            <li key={title} className="flex gap-2">
              <span className="mt-2 inline-block h-1 w-1 flex-none rounded-full bg-stone-400" />
              <span>{title}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {thread.topTags && thread.topTags.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] text-stone-500">
          {thread.topTags.slice(0, 5).map((tag) => (
            <span key={tag} className="rounded-full bg-stone-100 px-2 py-0.5">
              #{tag}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-4 text-[11px] tracking-[0.08em] text-stone-500">
        {formatWorkspaceTimestamp(thread.lastEventAt, lang)}
      </div>
    </article>
  );
}
