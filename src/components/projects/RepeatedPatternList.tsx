import { dict, type Lang } from '@/lib/i18n';
import type { ReviewPatternSummary } from '@/types/review';

interface RepeatedPatternListProps {
  items: ReviewPatternSummary[];
  lang?: Lang;
}

export function RepeatedPatternList({ items, lang = 'en' }: RepeatedPatternListProps) {
  const t = dict[lang];

  if (items.length === 0) {
    return (
      <div className="rounded-[1.25rem] border border-dashed border-stone-300 bg-white/70 p-6 text-sm text-stone-500">
        {t.projectDetail.repeatedEmpty}
      </div>
    );
  }

  const max = items.reduce((acc, it) => Math.max(acc, it.count), 1);

  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const pct = Math.max(0.08, item.count / max);
        return (
          <li key={item.label} className="rounded-[1.25rem] border border-stone-200/80 bg-white/85 p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-stone-950">{item.label}</span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                {item.count} {t.common.threads}
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600"
                style={{ width: `${Math.round(pct * 100)}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
