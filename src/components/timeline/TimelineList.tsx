import type { Lang } from '@/lib/i18n';
import { dict } from '@/lib/i18n';
import {
  formatWorkspaceDay,
  formatWorkspaceTime,
  relativeDayLabel,
  startOfDay
} from '@/components/workspace/formatting';

type TimelineListItem = {
  id: string;
  title: string;
  summary: string;
  eventType: string;
  projectKey: string;
  occurredAt: number;
  sourceFamily: string;
  connectorId?: string;
  provenanceTier: string;
  tags: string[];
  files: string[];
  importanceScore?: number;
};

const SOURCE_COLOR: Record<string, string> = {
  claude: 'text-violet-600',
  codex: 'text-sky-600',
  git: 'text-emerald-600',
  experiment: 'text-fuchsia-600',
  seed: 'text-stone-400'
};

function groupByDay(items: TimelineListItem[]) {
  const groups = new Map<number, TimelineListItem[]>();
  for (const it of items) {
    const day = startOfDay(it.occurredAt);
    const bucket = groups.get(day) ?? [];
    bucket.push(it);
    groups.set(day, bucket);
  }
  return [...groups.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([day, entries]) => ({
      day,
      entries: entries.sort((a, b) => b.occurredAt - a.occurredAt)
    }));
}

export function TimelineList({ items, lang = 'en' }: { items: TimelineListItem[]; lang?: Lang }) {
  const t = dict[lang];

  if (items.length === 0) {
    return <p className="muted text-sm">{t.timeline.noEvents}</p>;
  }

  const groups = groupByDay(items);

  return (
    <div className="space-y-10">
      {groups.map((group) => {
        const relative = relativeDayLabel(group.day, lang);
        const dayLabel = formatWorkspaceDay(group.day, lang);
        return (
          <section key={group.day}>
            <h3 className="serif mb-2 text-[15px] font-semibold text-stone-900">
              {relative ?? dayLabel}
              {relative ? <span className="caption ml-3 font-normal">{dayLabel}</span> : null}
              <span className="caption ml-3 font-normal num">
                · {t.timeline.events(group.entries.length)}
              </span>
            </h3>
            <div>
              {group.entries.map((item) => {
                const color = SOURCE_COLOR[item.sourceFamily] ?? 'text-stone-500';
                return (
                  <div
                    key={item.id}
                    className="grid grid-cols-[56px_1fr] gap-x-4 border-b border-stone-200/60 py-3"
                  >
                    <div className="caption pt-0.5 text-right num">
                      {formatWorkspaceTime(item.occurredAt, lang)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-baseline gap-2 text-sm">
                        <span className="font-medium text-stone-900">{item.title}</span>
                        <span className="caption">{item.projectKey}</span>
                        <span className={`caption ${color}`}>{item.sourceFamily}</span>
                      </div>
                      {item.summary ? (
                        <div className="mt-0.5 truncate text-[13px] leading-5 text-stone-500">
                          {item.summary}
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
