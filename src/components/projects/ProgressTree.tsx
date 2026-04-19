import type { ProjectProgressTree, ProgressStatus } from '@/server/workspace/projectTree';
import { Eyebrow, Pill } from '@/components/workspace/chrome';
import { formatWorkspaceDay } from '@/components/workspace/formatting';
import { dict, type Lang } from '@/lib/i18n';

const DAY_MS = 24 * 60 * 60 * 1000;

interface ProgressTreeProps {
  tree: ProjectProgressTree;
  lang: Lang;
}

const statusColor: Record<ProgressStatus, string> = {
  'in-progress': 'bg-emerald-500',
  'waiting': 'bg-amber-500',
  'dormant': 'bg-stone-400',
  'completed': 'bg-[color:var(--accent)]'
};

function statusTone(status: ProgressStatus): 'default' | 'accent' | 'emerald' | 'amber' {
  switch (status) {
    case 'in-progress':
      return 'emerald';
    case 'waiting':
      return 'amber';
    case 'completed':
      return 'accent';
    default:
      return 'default';
  }
}

export function ProgressTree({ tree, lang }: ProgressTreeProps) {
  const t = dict[lang].lifeline;

  if (tree.threads.length === 0) {
    return <p className="muted text-sm">{t.empty}</p>;
  }

  const axisSpan = Math.max(1, tree.axisEnd - tree.axisStart);
  const statusLabel = (status: ProgressStatus) => {
    switch (status) {
      case 'in-progress':
        return t.statusLabel.inProgress;
      case 'waiting':
        return t.statusLabel.waiting;
      case 'dormant':
        return t.statusLabel.dormant;
      case 'completed':
        return t.statusLabel.completed;
    }
  };
  const roleLabel = (role: 'first' | 'peak' | 'last') => t.roleLabel[role];

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-baseline gap-3">
        <Eyebrow>{t.heading}</Eyebrow>
        <span className="caption num">
          {t.counts(tree.counts.inProgress, tree.counts.waiting, tree.counts.dormant, tree.counts.completed)}
        </span>
        <span className="caption num ml-auto">
          {formatWorkspaceDay(tree.axisStart, lang)} → {formatWorkspaceDay(tree.axisEnd, lang)}
        </span>
      </div>

      <ol
        className="space-y-8 border-l border-stone-300 pl-6"
        aria-label={t.heading}
      >
        {tree.threads.map((thread) => {
          const durationDays = Math.max(
            1,
            Math.round((thread.lastEventAt - thread.firstEventAt) / DAY_MS)
          );
          const bandLeft = ((thread.firstEventAt - tree.axisStart) / axisSpan) * 100;
          const bandWidth = Math.max(
            2,
            ((thread.lastEventAt - thread.firstEventAt) / axisSpan) * 100
          );
          return (
            <li key={thread.threadKey} className="relative">
              <span
                aria-hidden
                className={`absolute -left-[31px] top-2 inline-block h-2.5 w-2.5 rounded-full ring-2 ring-[color:var(--paper)] ${statusColor[thread.status]}`}
              />
              <div className="flex flex-wrap items-baseline gap-2">
                <h4 className="serif text-[17px] font-semibold text-stone-950">
                  {thread.label}
                </h4>
                <Pill tone={statusTone(thread.status)}>{statusLabel(thread.status)}</Pill>
                <span className="caption num ml-auto">
                  {thread.eventCount} · {durationDays}d
                </span>
              </div>

              <div
                aria-hidden
                className="relative mt-2 h-1.5 w-full rounded-full bg-stone-200/80"
              >
                <span
                  className={`absolute top-0 h-1.5 rounded-full ${statusColor[thread.status]} opacity-80`}
                  style={{ left: `${bandLeft}%`, width: `${bandWidth}%` }}
                />
              </div>

              {thread.keyEvents.length > 0 ? (
                <ul className="mt-3 space-y-1.5">
                  {thread.keyEvents.map((event) => (
                    <li
                      key={event.id}
                      className="flex items-baseline gap-3 text-[13px] text-stone-700"
                    >
                      <span className="caption num w-16 flex-none uppercase tracking-wide text-stone-500">
                        {roleLabel(event.role)}
                      </span>
                      <span className="min-w-0 flex-1 truncate">{event.title}</span>
                      <span className="caption num flex-none text-stone-500">
                        {formatWorkspaceDay(event.at, lang)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}

              {thread.linkedEntities.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {thread.linkedEntities.map((entity) => (
                    <span
                      key={entity.slug}
                      className="pill"
                      title={entity.entityType}
                    >
                      {entity.title}
                    </span>
                  ))}
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
