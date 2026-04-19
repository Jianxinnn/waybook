import { createWaybookConfig } from '@/lib/config';
import { buildWorkspaceHref, dict, resolveLang } from '@/lib/i18n';
import { buildWorkspaceSnapshot } from '@/server/bootstrap/pipeline';
import { parseRequestedScope } from '@/server/reviews/scopeOptions';
import { Sparkline, bucketEventsByDay, bucketImportanceByDay } from '@/components/viz/Sparkline';
import { StatusDot } from '@/components/viz/StatusDot';
import { formatWorkspaceDay, formatWorkspaceTime } from '@/components/workspace/formatting';
import { Eyebrow } from '@/components/workspace/chrome';
import { buildThreadStates } from '@/server/reviews/threadStateBuilder';
import { buildDailyPulse } from '@/server/workspace/dailyPulse';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function deriveStatus(lastEventAt: number | null, now = Date.now()): 'active' | 'stalled' | 'dormant' {
  if (lastEventAt === null) return 'dormant';
  const age = now - lastEventAt;
  const dayMs = 24 * 60 * 60 * 1000;
  if (age <= 3 * dayMs) return 'active';
  if (age <= 14 * dayMs) return 'stalled';
  return 'dormant';
}

function relativeShort(ts: number | null, lang: 'en' | 'zh') {
  if (ts === null) return '—';
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return lang === 'zh' ? `${d}天` : `${d}d`;
}

export default async function HomePage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const lang = resolveLang(resolvedSearchParams);
  const t = dict[lang];
  const scope = parseRequestedScope(
    typeof resolvedSearchParams.scopeKind === 'string' ? resolvedSearchParams.scopeKind : undefined,
    typeof resolvedSearchParams.scopeValue === 'string' ? resolvedSearchParams.scopeValue : undefined,
    typeof resolvedSearchParams.scopeLabel === 'string' ? resolvedSearchParams.scopeLabel : undefined
  );
  const snapshot = await buildWorkspaceSnapshot(createWaybookConfig(), { scope });
  const today = Date.now();
  const DAY_MS = 24 * 60 * 60 * 1000;
  const active = snapshot.projectSummaries.filter(
    (s) => deriveStatus(s.lastEventAt, today) === 'active'
  );
  const stalled = snapshot.projectSummaries.filter(
    (s) => deriveStatus(s.lastEventAt, today) === 'stalled'
  );
  const inMotion = active.slice(0, 3);
  const dailyBrief = snapshot.latestDailyBrief;
  const recent = snapshot.items.slice(0, 6);

  // Actionable today: high-importance threads idle 1-3 days (cooling) + pulse highlights.
  const threadStates = buildThreadStates(snapshot.items, today);
  const actionable = threadStates
    .filter((t) => {
      const age = today - t.lastEventAt;
      return age >= DAY_MS && age <= 3 * DAY_MS && t.importanceScore >= 0.55;
    })
    .sort((a, b) => b.importanceScore - a.importanceScore || b.lastEventAt - a.lastEventAt)
    .slice(0, 3);
  const pulse = buildDailyPulse(snapshot.items, snapshot.entities, today);
  const topMoves = pulse.items
    .filter((i) => i.kind === 'event' || i.kind === 'thread')
    .slice(0, 3);

  const lead =
    lang === 'zh'
      ? `今天 ${snapshot.currentScope.scopeLabel} 内有 ${active.length} 个活跃项目在推进，${stalled.length} 个停滞。共 ${snapshot.stats.eventCount.toLocaleString()} 条证据跨 ${snapshot.stats.projectCount} 个项目。`
      : `${active.length} projects moving in ${snapshot.currentScope.scopeLabel} today, ${stalled.length} stalled. ${snapshot.stats.eventCount.toLocaleString()} pieces of evidence across ${snapshot.stats.projectCount} projects.`;

  return (
    <main className="mx-auto w-full max-w-4xl px-6 pb-24 pt-10 md:pt-14">
      {/* Masthead */}
      <header className="mb-12">
        <div className="caption num mb-3">
          {formatWorkspaceDay(today, lang)} · {snapshot.currentScope.scopeLabel}
        </div>
        <h1 className="serif text-4xl font-semibold tracking-tight text-stone-950 md:text-5xl">
          {t.today.title}
        </h1>
        <p className="lead mt-5 max-w-2xl">{lead}</p>
      </header>

      {/* Actionable now — cooling threads and today's top moves */}
      {actionable.length > 0 || topMoves.length > 0 ? (
        <section className="mb-14 grid gap-6 border-y border-stone-200/80 py-6 md:grid-cols-2">
          <div>
            <Eyebrow muted={actionable.length === 0}>
              {lang === 'zh' ? '需要关注' : 'Needs Attention'}
            </Eyebrow>
            {actionable.length === 0 ? (
              <p className="muted mt-2 text-sm">
                {lang === 'zh' ? '暂无冷却中的重要线索。' : 'No cooling important threads.'}
              </p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {actionable.map((t) => {
                  const ageDays = Math.max(1, Math.floor((today - t.lastEventAt) / DAY_MS));
                  return (
                    <li key={t.threadKey} className="flex items-baseline gap-3 text-sm">
                      <span className="caption num w-10 flex-none text-stone-500">
                        {ageDays}d
                      </span>
                      <a
                        href={buildWorkspaceHref(
                          `/projects/${t.projectKey}`,
                          snapshot.currentScope,
                          lang
                        )}
                        className="min-w-0 flex-1 truncate text-stone-900 hover:text-[color:var(--accent)]"
                      >
                        {t.label}
                      </a>
                      <span className="caption num flex-none">{t.projectKey}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <div>
            <Eyebrow muted={topMoves.length === 0}>
              {lang === 'zh' ? '今日要点' : 'Top Moves Today'}
            </Eyebrow>
            {topMoves.length === 0 ? (
              <p className="muted mt-2 text-sm">
                {lang === 'zh' ? '今天还没有重要动作。' : 'Nothing important has moved today yet.'}
              </p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {topMoves.map((item, idx) => (
                  <li
                    key={`${item.kind}-${idx}`}
                    className="flex items-baseline gap-3 text-sm"
                  >
                    <span className="caption num w-10 flex-none text-stone-500">
                      {formatWorkspaceTime(item.at, lang)}
                    </span>
                    <a
                      href={
                        item.href
                          ? buildWorkspaceHref(item.href, snapshot.currentScope, lang)
                          : undefined
                      }
                      className="min-w-0 flex-1 truncate text-stone-900 hover:text-[color:var(--accent)]"
                    >
                      {item.title}
                    </a>
                    <span className="caption num flex-none">{item.context.split(' · ')[0]}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      ) : null}

      {/* Daily Brief hero */}
      <section className="mb-14">
        <div className="mb-3 flex items-baseline justify-between">
          <Eyebrow>{lang === 'zh' ? '决策支持 · 今日简报' : 'Decision Support · Daily Brief'}</Eyebrow>
          <a
            className="caption hover:text-[color:var(--accent)]"
            href={buildWorkspaceHref('/reviews', snapshot.currentScope, lang)}
          >
            {lang === 'zh' ? '打开评审' : 'open reviews'} →
          </a>
        </div>
        {dailyBrief ? (
          <article className="max-w-2xl">
            <h2 className="serif text-3xl font-semibold leading-tight tracking-tight text-stone-950 md:text-[34px]">
              {dailyBrief.title}
            </h2>
            <p className="serif mt-4 border-l-2 border-[color:var(--accent)] pl-4 text-[17px] leading-8 text-stone-700">
              {dailyBrief.canonicalSummary}
            </p>
            <div className="caption mt-3 num">{formatWorkspaceDay(dailyBrief.generatedAt, lang)}</div>
            <a
              className="caption mt-5 inline-block hover:text-[color:var(--accent)]"
              href={buildWorkspaceHref(
                `/reviews/${dailyBrief.slug}`,
                snapshot.currentScope,
                lang
              )}
            >
              {lang === 'zh' ? '继续阅读' : 'continue reading'} →
            </a>
          </article>
        ) : (
          <p className="muted text-sm">
            {lang === 'zh' ? '暂无今日简报。' : 'No daily brief yet.'}
          </p>
        )}
      </section>

      {/* In-motion rail (3 active projects, compact) */}
      {inMotion.length > 0 ? (
        <section className="mb-14">
          <div className="mb-3 flex items-baseline justify-between">
            <Eyebrow>{lang === 'zh' ? '正在推进' : 'In Motion'}</Eyebrow>
            <a
              className="caption hover:text-[color:var(--accent)]"
              href={buildWorkspaceHref('/projects', snapshot.currentScope, lang)}
            >
              {lang === 'zh' ? '查看全部项目' : 'all projects'} →
            </a>
          </div>
          <ul className="grid gap-5 sm:grid-cols-3">
            {inMotion.map((s) => {
              const projectEvents = snapshot.items.filter((e) => e.projectKey === s.projectKey);
              return (
              <li key={s.projectKey}>
                <a
                  href={buildWorkspaceHref(`/projects/${s.projectKey}`, snapshot.currentScope, lang)}
                  className="group block"
                >
                  <div className="flex items-center gap-2">
                    <StatusDot status="active" pulse />
                    <span className="serif truncate text-[17px] font-semibold text-stone-900 group-hover:text-[color:var(--accent)]">
                      {s.projectKey}
                    </span>
                  </div>
                  <div className="mt-2 text-stone-400">
                    <Sparkline
                      values={bucketEventsByDay(s.recentOccurrences, 14, today)}
                      weights={bucketImportanceByDay(
                        projectEvents.map((e) => ({
                          occurredAt: e.occurredAt,
                          importanceScore: e.importanceScore
                        })),
                        14,
                        today
                      )}
                      width={180}
                      height={20}
                    />
                  </div>
                  <div className="caption num mt-1 flex items-center justify-between">
                    <span>{s.eventCount.toLocaleString()} {t.common.events}</span>
                    <span>{relativeShort(s.lastEventAt, lang)}</span>
                  </div>
                  {s.highlights[0] ? (
                    <p className="mt-2 line-clamp-2 text-[13px] leading-5 text-stone-500">
                      {s.highlights[0]}
                    </p>
                  ) : null}
                </a>
              </li>
            );
            })}
          </ul>
        </section>
      ) : null}

      {/* Recent evidence, compact */}
      <section className="mb-14">
        <div className="mb-3 flex items-baseline justify-between">
          <Eyebrow>{lang === 'zh' ? '最新证据' : 'Since Yesterday'}</Eyebrow>
          <a
            className="caption hover:text-[color:var(--accent)]"
            href={buildWorkspaceHref('/timeline', snapshot.currentScope, lang)}
          >
            {lang === 'zh' ? '打开时间线' : 'open timeline'} →
          </a>
        </div>
        {recent.length === 0 ? (
          <p className="muted text-sm">
            {lang === 'zh' ? '暂无证据。' : 'No evidence yet.'}
          </p>
        ) : (
          <ul className="divide-y divide-stone-200/60">
            {recent.map((e) => (
              <li
                key={e.id}
                className="flex items-baseline gap-4 py-2.5"
              >
                <span className="caption num w-14 flex-none text-stone-500">
                  {formatWorkspaceTime(e.occurredAt, lang)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] text-stone-900">{e.title}</div>
                  {e.summary ? (
                    <div className="mt-0.5 truncate text-[12px] text-stone-500">{e.summary}</div>
                  ) : null}
                </div>
                <span className="caption num flex-none text-stone-500">
                  {e.projectKey} · {e.sourceFamily}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Scope footer */}
      <footer className="border-t border-stone-200/70 pt-5">
        <div className="caption mb-2">{lang === 'zh' ? '切换范围' : 'Scope'}</div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {snapshot.availableScopes.map((s) => {
            const isActive =
              s.scopeKind === snapshot.currentScope.scopeKind &&
              s.scopeValue === snapshot.currentScope.scopeValue;
            const href = buildWorkspaceHref('/', s, lang);
            return (
              <a
                key={`${s.scopeKind}:${s.scopeValue}`}
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={
                  isActive
                    ? 'text-stone-950 underline decoration-[color:var(--accent)] decoration-2 underline-offset-4'
                    : 'text-stone-500 hover:text-stone-900'
                }
              >
                {s.scopeLabel}
              </a>
            );
          })}
        </div>
      </footer>
    </main>
  );
}
