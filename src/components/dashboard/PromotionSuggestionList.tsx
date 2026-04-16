import type { PromotionSuggestion } from '@/types/review';

interface PromotionSuggestionListProps {
  items: PromotionSuggestion[];
}

export function PromotionSuggestionList({ items }: PromotionSuggestionListProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-stone-300 bg-white/70 p-6 text-sm text-stone-500">
        No promotion suggestions yet.
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.id} className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-lg font-semibold text-stone-900">{item.label}</h3>
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              {item.action} {item.entityType}
            </span>
          </div>
          <p className="mt-3 text-sm leading-6 text-stone-600">{item.rationale}</p>
        </li>
      ))}
    </ul>
  );
}
