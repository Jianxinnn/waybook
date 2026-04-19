import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  hint?: string;
  icon?: ReactNode;
}

export function EmptyState({ title, hint, icon }: EmptyStateProps) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-stone-300 bg-white/60 p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 flex-none items-center justify-center rounded-2xl bg-stone-100 text-stone-400">
          {icon ?? <WaitingGlyph />}
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">
            {title}
          </p>
          {hint ? <p className="mt-2 text-sm leading-6 text-stone-500">{hint}</p> : null}
        </div>
      </div>
    </div>
  );
}

function WaitingGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={1.6}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" strokeLinecap="round" />
    </svg>
  );
}
