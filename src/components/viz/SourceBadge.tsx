import type { ProvenanceTier, SourceFamily } from '@/types/source';

const FAMILY_CONFIG: Record<
  SourceFamily | 'seed' | string,
  { glyph: string; tone: string; label: string }
> = {
  claude: { glyph: 'C', tone: 'bg-violet-50 text-violet-700 ring-violet-200', label: 'claude' },
  codex: { glyph: 'X', tone: 'bg-sky-50 text-sky-700 ring-sky-200', label: 'codex' },
  git: { glyph: 'G', tone: 'bg-emerald-50 text-emerald-700 ring-emerald-200', label: 'git' },
  experiment: {
    glyph: 'E',
    tone: 'bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200',
    label: 'experiment'
  },
  seed: { glyph: 'S', tone: 'bg-stone-100 text-stone-600 ring-stone-200', label: 'seed' }
};

const DEFAULT = {
  glyph: '·',
  tone: 'bg-stone-100 text-stone-600 ring-stone-200',
  label: 'source'
};

interface SourceBadgeProps {
  family: SourceFamily | string;
  connectorId?: string;
  provenance?: ProvenanceTier;
  size?: 'sm' | 'md';
}

export function SourceBadge({ family, connectorId, provenance, size = 'sm' }: SourceBadgeProps) {
  const cfg = FAMILY_CONFIG[family] ?? DEFAULT;
  const px = size === 'md' ? 'px-3 py-1.5 text-xs' : 'px-2.5 py-1 text-[11px]';
  const glyphSize =
    size === 'md' ? 'h-5 w-5 text-[11px]' : 'h-4 w-4 text-[9px]';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold uppercase tracking-[0.18em] ring-1 ring-inset ${cfg.tone} ${px}`}
      title={connectorId ? `${cfg.label} · ${connectorId}` : cfg.label}
    >
      <span
        className={`inline-flex items-center justify-center rounded-full bg-white/80 font-bold ${glyphSize}`}
      >
        {cfg.glyph}
      </span>
      <span>{cfg.label}</span>
      {provenance ? <ProvenanceDot tier={provenance} /> : null}
    </span>
  );
}

const PROVENANCE_TONE: Record<ProvenanceTier, string> = {
  primary: 'bg-emerald-500',
  derived: 'bg-amber-400',
  synthetic: 'bg-stone-400'
};

export function ProvenanceDot({ tier }: { tier: ProvenanceTier }) {
  return (
    <span
      aria-label={`provenance ${tier}`}
      title={`provenance · ${tier}`}
      className={`inline-block h-1.5 w-1.5 rounded-full ${PROVENANCE_TONE[tier] ?? 'bg-stone-300'}`}
    />
  );
}

export function ProvenanceTag({ tier }: { tier: ProvenanceTier }) {
  const tone =
    tier === 'primary'
      ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
      : tier === 'derived'
        ? 'bg-amber-50 text-amber-700 ring-amber-200'
        : 'bg-stone-100 text-stone-600 ring-stone-200';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] ring-1 ring-inset ${tone}`}
    >
      <ProvenanceDot tier={tier} />
      <span>{tier}</span>
    </span>
  );
}
