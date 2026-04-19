interface SparklineProps {
  values: number[];
  /**
   * Optional average-importance per bucket (0..1).
   * When provided, each bucket's visual weight is `count × importance`,
   * so a lone but high-importance commit outranks a flurry of trivial ones.
   */
  weights?: number[];
  width?: number;
  height?: number;
  stroke?: string;
  ariaLabel?: string;
}

export function Sparkline({
  values,
  weights,
  width = 80,
  height = 16,
  stroke = 'currentColor',
  ariaLabel = 'activity'
}: SparklineProps) {
  if (values.length === 0) {
    return <span aria-label="no activity" className="inline-block text-stone-300">——</span>;
  }

  const effective = values.map((v, i) => {
    const w = weights?.[i];
    if (w === undefined) return v;
    return v * Math.max(0.15, Math.min(1, w));
  });

  const max = Math.max(1, ...effective);
  const step = values.length === 1 ? width : width / (values.length - 1);
  const points = effective.map((v, i) => {
    const x = i * step;
    const y = height - (v / max) * (height - 2) - 1;
    return [x, y] as const;
  });

  const path = points
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(' ');

  // Heavy days get an accent dot so high-importance pivots are visible
  // even when the raw count is the same as neighbours.
  const pivots = weights
    ? points
        .map(([x, y], i) => ({ x, y, w: weights[i] ?? 0, v: values[i] ?? 0 }))
        .filter((p) => p.v > 0 && p.w >= 0.7)
    : [];

  return (
    <svg
      role="img"
      aria-label={ariaLabel}
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className="inline-block text-stone-400"
      preserveAspectRatio="none"
    >
      <path d={path} fill="none" stroke={stroke} strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" />
      {pivots.map((p, i) => (
        <circle
          key={i}
          cx={p.x.toFixed(1)}
          cy={p.y.toFixed(1)}
          r={1.6}
          fill="var(--accent, #b8581a)"
        />
      ))}
    </svg>
  );
}

export function bucketEventsByDay(timestamps: number[], days = 14, now = Date.now()): number[] {
  const dayMs = 24 * 60 * 60 * 1000;
  const buckets = new Array(days).fill(0) as number[];
  const start = now - days * dayMs;
  for (const ts of timestamps) {
    if (ts < start || ts > now) continue;
    const offset = Math.floor((ts - start) / dayMs);
    const idx = Math.min(days - 1, Math.max(0, offset));
    buckets[idx] += 1;
  }
  return buckets;
}

/**
 * Aggregate daily importance (average of event.importanceScore within each
 * bucket, 0..1). Pair with `bucketEventsByDay` to produce a Sparkline that
 * reflects *both* frequency and gravity.
 */
export function bucketImportanceByDay(
  samples: Array<{ occurredAt: number; importanceScore: number }>,
  days = 14,
  now = Date.now()
): number[] {
  const dayMs = 24 * 60 * 60 * 1000;
  const sums = new Array(days).fill(0) as number[];
  const counts = new Array(days).fill(0) as number[];
  const start = now - days * dayMs;
  for (const { occurredAt, importanceScore } of samples) {
    if (occurredAt < start || occurredAt > now) continue;
    const offset = Math.floor((occurredAt - start) / dayMs);
    const idx = Math.min(days - 1, Math.max(0, offset));
    sums[idx] += Math.max(0, Math.min(1, importanceScore));
    counts[idx] += 1;
  }
  return sums.map((s, i) => (counts[i] === 0 ? 0 : s / counts[i]));
}
