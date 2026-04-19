import { createWaybookConfig } from '@/lib/config';
import { buildWorkspaceHref, dict, resolveLang } from '@/lib/i18n';
import { Sparkline, bucketEventsByDay } from '@/components/viz/Sparkline';
import { StatusDot } from '@/components/viz/StatusDot';
import { Eyebrow } from '@/components/workspace/chrome';
import { buildWorkspaceSnapshot } from '@/server/bootstrap/pipeline';
import { parseRequestedScope } from '@/server/reviews/scopeOptions';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Status = 'active' | 'stalled' | 'dormant';

function deriveStatus(lastEventAt: number | null, now = Date.now()): Status {
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

export default async function ProjectsPage({
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
  const now = Date.now();

  const withStatus = snapshot.projectSummaries.map((s) => ({
    ...s,
    status: deriveStatus(s.lastEventAt, now)
  }));
  const active = withStatus.filter((s) => s.status === 'active');
  const stalled = withStatus.filter((s) => s.status === 'stalled');
  const dormant = withStatus.filter((s) => s.status === 'dormant');

  const lead =
    lang === 'zh'
      ? `${active.length} 个项目正在推进，${stalled.length} 个停滞，${dormant.length} 个休眠。按状态阅读全部 ${withStatus.length} 个项目。`
      : `${active.length} in motion, ${stalled.length} stalled, ${dormant.length} dormant across ${withStatus.length} projects in ${snapshot.currentScope.scopeLabel}.`;

  const renderGroup = (
    label: string,
    tone: Status,
    items: typeof withStatus,
    hint?: string
  ) =>
    items.length === 0 ? null : (
      <section className="mb-12">
        <div className="mb-3 flex items-baseline justify-between">
          <div className="flex items-baseline gap-3">
            <Eyebrow muted={tone !== 'active'}>{label}</Eyebrow>
            <span className="caption num">{items.length}</span>
          </div>
          {hint ? <span className="caption">{hint}</span> : null}
        </div>
        <ul className="divide-y divide-stone-200/60">
          {items.map((s) => (
            <li key={s.projectKey}>
              <a
                href={buildWorkspaceHref(`/projects/${s.projectKey}`, snapshot.currentScope, lang)}
                className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-5 py-3.5 transition hover:bg-stone-100/40"
              >
                <StatusDot status={s.status} pulse={s.status === 'active'} />
                <div className="min-w-0">
                  <div className="flex items-baseline gap-3">
                    <span className="serif truncate text-[16px] font-semibold text-stone-900">
                      {s.projectKey}
                    </span>
                    <span className="caption num flex-none">
                      {s.eventCount.toLocaleString()} {t.common.events}
                    </span>
                  </div>
                  {s.highlights[0] ? (
                    <p className="mt-0.5 truncate text-[13px] leading-5 text-stone-500">
                      {s.highlights[0]}
                    </p>
                  ) : null}
                </div>
                <div className="text-stone-400">
                  <Sparkline
                    values={bucketEventsByDay(s.recentOccurrences, 14, now)}
                    width={96}
                    height={20}
                  />
                </div>
                <span className="caption num w-10 flex-none text-right">
                  {relativeShort(s.lastEventAt, lang)}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    );

  return (
    <main className="mx-auto w-full max-w-4xl px-6 pb-24 pt-10 md:pt-14">
      <header className="mb-10">
        <div className="caption num mb-3">
          {withStatus.length} {lang === 'zh' ? '项目' : 'projects'} · {snapshot.currentScope.scopeLabel}
        </div>
        <h1 className="serif text-4xl font-semibold tracking-tight text-stone-950 md:text-5xl">
          {t.projects.title}
        </h1>
        <p className="lead mt-5 max-w-2xl">{lead}</p>
      </header>

      {renderGroup(
        lang === 'zh' ? '活跃' : 'In Motion',
        'active',
        active,
        lang === 'zh' ? '近 3 天有动作' : 'moved in the last 3 days'
      )}
      {renderGroup(
        lang === 'zh' ? '停滞' : 'Stalled',
        'stalled',
        stalled,
        lang === 'zh' ? '3 – 14 天未动' : '3–14 days quiet'
      )}
      {renderGroup(
        lang === 'zh' ? '休眠' : 'Dormant',
        'dormant',
        dormant,
        lang === 'zh' ? '超过 14 天' : 'over 14 days'
      )}

      <footer className="border-t border-stone-200/70 pt-5">
        <div className="caption mb-2">{lang === 'zh' ? '切换范围' : 'Scope'}</div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {snapshot.availableScopes.map((s) => {
            const isActive =
              s.scopeKind === snapshot.currentScope.scopeKind &&
              s.scopeValue === snapshot.currentScope.scopeValue;
            const href = buildWorkspaceHref('/projects', s, lang);
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
