import { notFound } from 'next/navigation';
import { createWaybookConfig } from '@/lib/config';
import { buildWorkspaceHref, dict, resolveLang } from '@/lib/i18n';
import { Sparkline, bucketEventsByDay, bucketImportanceByDay } from '@/components/viz/Sparkline';
import { StatusDot } from '@/components/viz/StatusDot';
import { Eyebrow, Pill } from '@/components/workspace/chrome';
import { buildWorkspaceSnapshot } from '@/server/bootstrap/pipeline';
import { parseRequestedScope } from '@/server/reviews/scopeOptions';
import { buildProjectDetail } from '@/server/workspace/projectDetail';
import { buildProjectTree } from '@/server/workspace/projectTree';
import { ProgressTree } from '@/components/projects/ProgressTree';
import { formatWorkspaceTime } from '@/components/workspace/formatting';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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

export default async function ProjectDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ projectKey: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { projectKey } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const lang = resolveLang(resolvedSearchParams);
  const t = dict[lang];
  const scope = parseRequestedScope(
    typeof resolvedSearchParams.scopeKind === 'string' ? resolvedSearchParams.scopeKind : undefined,
    typeof resolvedSearchParams.scopeValue === 'string' ? resolvedSearchParams.scopeValue : undefined,
    typeof resolvedSearchParams.scopeLabel === 'string' ? resolvedSearchParams.scopeLabel : undefined
  );
  const snapshot = await buildWorkspaceSnapshot(createWaybookConfig(), { scope });
  const summary = snapshot.projectSummaries.find((s) => s.projectKey === projectKey);
  if (!summary) {
    notFound();
  }
  const detail = buildProjectDetail(projectKey, snapshot.items, snapshot.entities);
  const projectEvents = snapshot.items.filter((e) => e.projectKey === projectKey);
  const spark = bucketEventsByDay(
    projectEvents.map((e) => e.occurredAt),
    14
  );
  const sparkWeights = bucketImportanceByDay(
    projectEvents.map((e) => ({ occurredAt: e.occurredAt, importanceScore: e.importanceScore })),
    14
  );
  const progressTree = buildProjectTree(projectKey, snapshot.items, snapshot.entities);

  const canonical = detail.entities[0]?.canonicalSummary;
  const activeThreads = detail.threadIntelligence.activeThreads;
  const stalledThreads = detail.threadIntelligence.stalledThreads;
  const patterns = detail.threadIntelligence.repeatedPatterns;

  const backHref = buildWorkspaceHref('/projects', snapshot.currentScope, lang);
  const timelineHref = buildWorkspaceHref(
    `/timeline?project=${projectKey}`,
    snapshot.currentScope,
    lang
  );

  return (
    <main className="mx-auto w-full max-w-5xl px-6 pb-24 pt-10 md:pt-14">
      {/* Masthead (no eyebrow repetition) */}
      <header className="mb-10">
        <div className="mb-4 flex items-center gap-3">
          <a className="caption hover:text-[color:var(--accent)]" href={backHref}>
            ← {lang === 'zh' ? '项目' : 'Projects'}
          </a>
          <span className="caption num">
            {lang === 'zh' ? '项目详情' : 'Project Detail'} · {snapshot.currentScope.scopeLabel}
          </span>
        </div>
        <div className="flex items-baseline gap-4">
          <StatusDot
            status={
              activeThreads.length > 0
                ? 'active'
                : stalledThreads.length > 0
                  ? 'stalled'
                  : 'dormant'
            }
            pulse={activeThreads.length > 0}
          />
          <h1 className="serif text-4xl font-semibold tracking-tight text-stone-950 md:text-5xl">
            {projectKey}
          </h1>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
          <Pill>
            {summary.eventCount.toLocaleString()} {t.common.events}
          </Pill>
          {activeThreads.length > 0 ? (
            <Pill tone="emerald">
              {activeThreads.length} {lang === 'zh' ? '活跃' : 'active'}
            </Pill>
          ) : null}
          {stalledThreads.length > 0 ? (
            <Pill tone="amber">
              {stalledThreads.length} {lang === 'zh' ? '停滞' : 'stalled'}
            </Pill>
          ) : null}
          <span className="caption num">
            {lang === 'zh' ? '最近' : 'last'} {relativeShort(summary.lastEventAt, lang)}
          </span>
          <div className="ml-auto text-stone-400">
            <Sparkline values={spark} weights={sparkWeights} width={200} height={26} />
          </div>
        </div>

        {canonical ? (
          <p className="lead mt-6 max-w-2xl">{canonical}</p>
        ) : (
          <p className="muted mt-6 text-sm">
            {lang === 'zh'
              ? '尚未为该项目编译出知识实体。'
              : 'No compiled project summary is available yet.'}
          </p>
        )}
      </header>

      {/* Threads triad */}
      <section className="mb-14 grid gap-8 md:grid-cols-3">
        <ThreadColumn
          title={lang === 'zh' ? '活跃线索' : 'Active Threads'}
          tone="active"
          count={activeThreads.length}
          emptyText={lang === 'zh' ? '当前项目暂无活跃线索。' : 'Nothing moving right now.'}
        >
          {activeThreads.slice(0, 8).map((thread) => (
            <ThreadRow
              key={thread.threadKey}
              label={thread.label}
              support={thread.exemplarTitles?.[0]}
              meta={`${thread.eventCount} ${t.common.events}`}
              tone="active"
            />
          ))}
        </ThreadColumn>

        <ThreadColumn
          title={lang === 'zh' ? '停滞线索' : 'Stalled Threads'}
          tone="stalled"
          count={stalledThreads.length}
          emptyText={lang === 'zh' ? '没有停滞线索。' : 'Nothing stalled.'}
        >
          {stalledThreads.slice(0, 8).map((thread) => (
            <ThreadRow
              key={thread.threadKey}
              label={thread.label}
              support={thread.exemplarTitles?.[0]}
              meta={`${thread.eventCount} ${t.common.events}`}
              tone="stalled"
            />
          ))}
        </ThreadColumn>

        <ThreadColumn
          title={lang === 'zh' ? '重复模式' : 'Repeated Patterns'}
          tone="pattern"
          count={patterns.length}
          emptyText={lang === 'zh' ? '暂未浮现重复模式。' : 'No repeated patterns yet.'}
        >
          {patterns.slice(0, 8).map((p) => (
            <div
              key={p.label}
              className="flex items-baseline justify-between border-b border-stone-200/60 py-2 text-sm"
            >
              <span className="min-w-0 truncate">{p.label}</span>
              <span className="caption num flex-none">{p.count}</span>
            </div>
          ))}
        </ThreadColumn>
      </section>

      {/* Recent evidence tail */}
      <section className="mb-14">
        <div className="mb-3 flex items-baseline justify-between">
          <Eyebrow>{lang === 'zh' ? '最近证据' : 'Recent Evidence'}</Eyebrow>
          <a className="caption hover:text-[color:var(--accent)]" href={timelineHref}>
            {lang === 'zh' ? '打开时间线' : 'open timeline'} →
          </a>
        </div>
        <p className="caption mb-2">{`Scope: ${snapshot.currentScope.scopeLabel}`}</p>
        <ul className="divide-y divide-stone-200/60">
          {detail.recentEvents.slice(0, 10).map((e) => (
            <li key={e.id} className="flex items-baseline gap-4 py-2.5">
              <span className="caption num w-14 flex-none text-stone-500">
                {formatWorkspaceTime(e.occurredAt, lang)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] text-stone-900">{e.title}</div>
                {e.summary ? (
                  <div className="mt-0.5 truncate text-[12px] text-stone-500">{e.summary}</div>
                ) : null}
              </div>
              <span className="caption num flex-none text-stone-500">{e.sourceFamily}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Project progress tree */}
      <section className="mb-14 border-t border-stone-200/70 pt-10">
        <ProgressTree tree={progressTree} lang={lang} />
      </section>
    </main>
  );
}

function ThreadColumn({
  title,
  tone,
  count,
  emptyText,
  children
}: {
  title: string;
  tone: 'active' | 'stalled' | 'pattern';
  count: number;
  emptyText: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between border-b border-stone-300/70 pb-2">
        <Eyebrow muted={tone !== 'active'}>{title}</Eyebrow>
        <span className="caption num">{count}</span>
      </div>
      {count === 0 ? <p className="muted text-sm">{emptyText}</p> : <div>{children}</div>}
    </div>
  );
}

function ThreadRow({
  label,
  support,
  meta,
  tone
}: {
  label: string;
  support?: string;
  meta: string;
  tone: 'active' | 'stalled';
}) {
  return (
    <div className="flex items-start gap-3 border-b border-stone-200/60 py-2.5">
      <span className="mt-1.5 flex-none">
        <StatusDot status={tone} pulse={tone === 'active'} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14px] text-stone-900">{label}</div>
        {support ? (
          <div className="mt-0.5 truncate text-[12px] text-stone-500">{support}</div>
        ) : null}
        <div className="caption num mt-1">{meta}</div>
      </div>
    </div>
  );
}
