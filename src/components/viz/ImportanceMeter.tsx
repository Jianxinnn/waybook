interface ImportanceMeterProps {
  score: number;
  segments?: number;
}

export function ImportanceMeter({ score, segments = 5 }: ImportanceMeterProps) {
  const clamped = Math.max(0, Math.min(1, score));
  const filled = Math.round(clamped * segments);
  const pct = Math.round(clamped * 100);

  return (
    <span
      className="inline-flex items-center gap-1.5"
      title={`importance ${pct}%`}
      aria-label={`importance ${pct}%`}
    >
      <span className="flex items-end gap-[2px]">
        {Array.from({ length: segments }).map((_, idx) => {
          const active = idx < filled;
          const heights = ['h-1.5', 'h-2', 'h-2.5', 'h-3', 'h-3.5'];
          const h = heights[idx] ?? 'h-3.5';
          const tone = active
            ? idx >= segments - 2
              ? 'bg-amber-600'
              : idx >= segments - 3
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            : 'bg-stone-200';
          return <span key={idx} className={`w-[3px] rounded-sm ${h} ${tone}`} />;
        })}
      </span>
      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">
        {pct}
      </span>
    </span>
  );
}
