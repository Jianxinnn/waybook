import { dict, type Lang } from '@/lib/i18n';
import type { PromotionSuggestion } from '@/types/review';

interface PromotionSuggestionListProps {
  items: PromotionSuggestion[];
  lang?: Lang;
}

const ACTION_TONE: Record<string, string> = {
  create: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  update: 'bg-sky-50 text-sky-800 ring-sky-200',
  promote: 'bg-amber-50 text-amber-800 ring-amber-200',
  merge: 'bg-violet-50 text-violet-800 ring-violet-200'
};

export function PromotionSuggestionList({ items, lang = 'en' }: PromotionSuggestionListProps) {
  const t = dict[lang];
  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-stone-300 bg-white/70 p-6 text-sm text-stone-500">
        {t.common.waiting}
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const tone = ACTION_TONE[item.action] ?? 'bg-stone-100 text-stone-700 ring-stone-200';
        return (
          <li
            key={item.id}
            className="relative overflow-hidden rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] ring-1 ring-inset ${tone}`}
                  >
                    {item.action}
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                    {item.entityType}
                  </span>
                </div>
                <h3 className="mt-2 text-base font-semibold text-stone-900">{item.label}</h3>
                <p className="mt-2 text-sm leading-6 text-stone-600">{item.rationale}</p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
