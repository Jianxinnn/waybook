type StatusKind = 'active' | 'stalled' | 'dormant';

const TONE: Record<StatusKind, string> = {
  active: 'bg-emerald-500',
  stalled: 'bg-amber-500',
  dormant: 'bg-stone-300'
};

export function StatusDot({ status, pulse = false }: { status: StatusKind | string; pulse?: boolean }) {
  const key = (status as StatusKind) in TONE ? (status as StatusKind) : 'dormant';
  const tone = TONE[key];
  return (
    <span
      aria-label={`status ${key}`}
      title={key}
      className="relative inline-flex h-2 w-2 items-center justify-center"
    >
      {pulse && key === 'active' ? (
        <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${tone} opacity-40`} />
      ) : null}
      <span className={`relative inline-block h-2 w-2 rounded-full ${tone}`} />
    </span>
  );
}
