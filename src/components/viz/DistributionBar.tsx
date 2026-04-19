interface DistributionSegment {
  key: string;
  value: number;
  tone: string;
  label?: string;
}

interface DistributionBarProps {
  segments: DistributionSegment[];
  total?: number;
}

export function DistributionBar({ segments, total }: DistributionBarProps) {
  const sum = total ?? segments.reduce((acc, s) => acc + s.value, 0);

  if (sum <= 0) {
    return (
      <div className="rounded-full border border-dashed border-stone-300 bg-white/60 px-3 py-2 text-center text-[11px] uppercase tracking-[0.2em] text-stone-400">
        waiting for evidence
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-stone-100">
        {segments.map((s) => {
          const pct = (s.value / sum) * 100;
          if (pct <= 0) return null;
          return (
            <div
              key={s.key}
              className={s.tone}
              style={{ width: `${pct}%` }}
              title={`${s.label ?? s.key} · ${s.value}`}
            />
          );
        })}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] uppercase tracking-[0.18em] text-stone-500">
        {segments.map((s) => (
          <li key={s.key} className="inline-flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${s.tone}`} />
            <span>{s.label ?? s.key}</span>
            <span className="font-semibold text-stone-700">{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const FAMILY_TONES: Record<string, string> = {
  claude: 'bg-violet-400',
  codex: 'bg-sky-400',
  git: 'bg-emerald-400',
  experiment: 'bg-fuchsia-400',
  seed: 'bg-stone-300'
};

export function buildSourceDistribution(items: { sourceFamily: string }[]): DistributionSegment[] {
  const counts = new Map<string, number>();
  for (const it of items) {
    counts.set(it.sourceFamily, (counts.get(it.sourceFamily) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([key, value]) => ({
      key,
      value,
      tone: FAMILY_TONES[key] ?? 'bg-stone-300',
      label: key
    }));
}
