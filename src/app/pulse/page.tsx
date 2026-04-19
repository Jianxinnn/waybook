import { createWaybookConfig } from '@/lib/config';
import { buildWorkspaceHref, dict, resolveLang } from '@/lib/i18n';
import { buildWorkspaceSnapshot } from '@/server/bootstrap/pipeline';
import { parseRequestedScope } from '@/server/reviews/scopeOptions';
import { buildDailyPulse } from '@/server/workspace/dailyPulse';
import { buildWeeklyHeatmap } from '@/server/workspace/weeklyHeatmap';
import { buildMonthlyArc } from '@/server/workspace/monthlyArc';
import { Eyebrow, Pill } from '@/components/workspace/chrome';
import { formatWorkspaceDay, formatWorkspaceTime } from '@/components/workspace/formatting';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function PulsePage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = (await searchParams) ?? {};
  const lang = resolveLang(resolved);
  const t = dict[lang].pulse;
  const scope = parseRequestedScope(
    typeof resolved.scopeKind === 'string' ? resolved.scopeKind : undefined,
    typeof resolved.scopeValue === 'string' ? resolved.scopeValue : undefined,
    typeof resolved.scopeLabel === 'string' ? resolved.scopeLabel : undefined
  );
  const snapshot = await buildWorkspaceSnapshot(createWaybookConfig(), {
    scope,
    itemLimit: 2000
  });
  const now = Date.now();
  const pulse = buildDailyPulse(snapshot.items, snapshot.entities, now);
  const heat = buildWeeklyHeatmap(snapshot.items, 7, now);
  const arc = buildMonthlyArc(snapshot.items, snapshot.entities, snapshot.reviews, now, 4);

  return (
    <main className="mx-auto w-full max-w-5xl px-6 pb-24 pt-10 md:pt-14">
      <header className="mb-12">
        <div className="caption num mb-3">
          {formatWorkspaceDay(now, lang)} · {snapshot.currentScope.scopeLabel}
        </div>
        <h1 className="serif text-4xl font-semibold tracking-tight text-stone-950 md:text-5xl">
          {t.title}
        </h1>
        <p className="lead mt-5 max-w-2xl">{t.lead(snapshot.currentScope.scopeLabel)}</p>
      </header>

      {/* Day list */}
      <section className="mb-16">
        <div className="mb-4 flex items-baseline gap-3">
          <Eyebrow>{t.sectionToday}</Eyebrow>
          <span className="caption num">
            {t.todayMeta(pulse.counts.events, pulse.counts.threadsTouched, pulse.counts.entitiesTouched)}
          </span>
        </div>
        {pulse.items.length === 0 ? (
          <p className="muted text-sm">{t.emptyToday}</p>
        ) : (
          <ul className="divide-y divide-stone-200/60">
            {pulse.items.map((item, idx) => (
              <li key={`${item.kind}-${idx}`} className="flex items-baseline gap-4 py-2.5">
                <span className="caption num w-14 flex-none text-stone-500">
                  {formatWorkspaceTime(item.at, lang)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span
                      aria-hidden
                      className={`inline-block h-1.5 w-1.5 rounded-full ${kindDotColor(item.kind)}`}
                    />
                    <a
                      href={
                        item.href
                          ? buildWorkspaceHref(item.href, snapshot.currentScope, lang)
                          : undefined
                      }
                      className="min-w-0 flex-1 truncate text-[14px] text-stone-900 hover:text-[color:var(--accent)]"
                    >
                      {item.title}
                    </a>
                  </div>
                  <div className="caption num mt-0.5">{item.context}</div>
                </div>
                <span
                  aria-label={t.weight}
                  className="ml-auto flex h-3 w-16 flex-none items-center overflow-hidden rounded-full bg-stone-200"
                >
                  <span
                    className="h-3 rounded-full bg-[color:var(--accent)]"
                    style={{ width: `${Math.round(item.weight * 100)}%` }}
                  />
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Weekly heatmap */}
      <section className="mb-16">
        <div className="mb-4 flex items-baseline gap-3">
          <Eyebrow>{t.sectionWeek}</Eyebrow>
          <span className="caption num">
            {t.weekMeta(
              heat.dailyTotals.reduce((n, x) => n + x, 0),
              heat.projectKeys.length
            )}
          </span>
        </div>
        {heat.projectKeys.length === 0 ? (
          <p className="muted text-sm">{t.emptyWeek}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-sm">
              <thead>
                <tr>
                  <th className="py-1 pr-3 text-left caption">{t.tableProject}</th>
                  {heat.dayStarts.map((d, idx) => (
                    <th
                      key={idx}
                      className="caption num py-1 px-1 text-center"
                      aria-label={formatWorkspaceDay(d, lang)}
                    >
                      {new Date(d).getDate()}
                    </th>
                  ))}
                  <th className="caption num py-1 pl-3 text-right">{t.tableTotal}</th>
                </tr>
              </thead>
              <tbody>
                {heat.projectKeys.map((pk) => {
                  const rowCells = heat.dayStarts.map((_, idx) =>
                    heat.cells.find((c) => c.projectKey === pk && c.dayIndex === idx)
                  );
                  const total = rowCells.reduce((n, c) => n + (c?.count ?? 0), 0);
                  return (
                    <tr key={pk}>
                      <td className="py-1 pr-3">
                        <a
                          href={buildWorkspaceHref(
                            `/projects/${pk}`,
                            snapshot.currentScope,
                            lang
                          )}
                          className="truncate text-stone-900 hover:text-[color:var(--accent)]"
                        >
                          {pk}
                        </a>
                      </td>
                      {rowCells.map((cell, idx) => (
                        <td key={idx} className="px-1 py-1">
                          <HeatCell cell={cell} />
                        </td>
                      ))}
                      <td className="caption num py-1 pl-3 text-right">{total}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Monthly arc */}
      <section className="mb-16">
        <div className="mb-4 flex items-baseline gap-3">
          <Eyebrow>{t.sectionMonth}</Eyebrow>
          <span className="caption num">{t.monthMeta(arc.eventCount, arc.deepWorkDays)}</span>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <ArcCard
            title={t.shipped}
            empty={t.shippedEmpty}
            items={arc.shipped.map((s) => ({
              key: s.projectKey,
              title: s.label,
              meta: `${s.projectKey} · ${formatWorkspaceDay(s.atMs, lang)}`,
              href: buildWorkspaceHref(`/projects/${s.projectKey}`, snapshot.currentScope, lang)
            }))}
          />
          <ArcCard
            title={t.stalled}
            empty={t.stalledEmpty}
            items={arc.stalled.map((s) => ({
              key: s.projectKey + s.label,
              title: s.label,
              meta: `${s.projectKey} · ${formatWorkspaceDay(s.atMs, lang)}`,
              href: buildWorkspaceHref(`/projects/${s.projectKey}`, snapshot.currentScope, lang)
            }))}
          />
          <ArcCard
            title={t.newProjects}
            empty={t.newProjectsEmpty}
            items={arc.newProjects.map((pk) => ({
              key: pk,
              title: pk,
              meta: '',
              href: buildWorkspaceHref(`/projects/${pk}`, snapshot.currentScope, lang)
            }))}
          />
          <ArcCard
            title={t.repeated}
            empty={t.repeatedEmpty}
            items={arc.repeatedPatterns.map((p) => ({
              key: p.label,
              title: p.label,
              meta: t.times(p.count),
              href: null
            }))}
          />
        </div>

        {arc.weeklyReviews.length > 0 ? (
          <div className="mt-8">
            <Eyebrow muted>{t.monthReviews}</Eyebrow>
            <ul className="mt-3 divide-y divide-stone-200/60">
              {arc.weeklyReviews.map((r) => (
                <li key={r.id} className="flex items-baseline gap-4 py-2.5">
                  <span className="caption num w-28 flex-none text-stone-500">
                    {formatWorkspaceDay(r.periodEnd, lang)}
                  </span>
                  <a
                    className="min-w-0 flex-1 truncate text-[14px] text-stone-900 hover:text-[color:var(--accent)]"
                    href={buildWorkspaceHref(`/reviews/${r.slug}`, snapshot.currentScope, lang)}
                  >
                    {r.title}
                  </a>
                  <Pill tone="default">{r.scope.scopeLabel}</Pill>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>
    </main>
  );
}

function kindDotColor(kind: 'event' | 'thread' | 'entity') {
  switch (kind) {
    case 'event':
      return 'bg-stone-500';
    case 'thread':
      return 'bg-emerald-600';
    case 'entity':
      return 'bg-[color:var(--accent)]';
  }
}

function HeatCell({ cell }: { cell?: { count: number; importance: number; weight: number } }) {
  if (!cell || cell.count === 0) {
    return <span className="block h-4 w-6 rounded-sm bg-stone-100" aria-hidden />;
  }
  const opacity = Math.max(0.15, Math.min(1, cell.weight));
  return (
    <span
      className="block h-4 w-6 rounded-sm bg-[color:var(--accent)]"
      style={{ opacity }}
      aria-label={`${cell.count} events`}
      title={`${cell.count} events · importance ${cell.importance.toFixed(2)}`}
    />
  );
}

interface ArcItem {
  key: string;
  title: string;
  meta: string;
  href: string | null;
}

function ArcCard({
  title,
  empty,
  items
}: {
  title: string;
  empty: string;
  items: ArcItem[];
}) {
  return (
    <div>
      <div className="mb-2 border-b border-stone-300/70 pb-1">
        <Eyebrow muted>{title}</Eyebrow>
      </div>
      {items.length === 0 ? (
        <p className="muted text-sm">{empty}</p>
      ) : (
        <ul className="space-y-1.5">
          {items.slice(0, 6).map((item) => (
            <li key={item.key} className="flex items-baseline gap-3 text-sm">
              <a
                href={item.href ?? undefined}
                className={
                  item.href
                    ? 'min-w-0 flex-1 truncate text-stone-900 hover:text-[color:var(--accent)]'
                    : 'min-w-0 flex-1 truncate text-stone-900'
                }
              >
                {item.title}
              </a>
              {item.meta ? (
                <span className="caption num flex-none">{item.meta}</span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
