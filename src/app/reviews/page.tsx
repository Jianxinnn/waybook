import { createWaybookConfig } from '@/lib/config';
import { buildWorkspaceHref, dict, resolveLang } from '@/lib/i18n';
import { Eyebrow } from '@/components/workspace/chrome';
import { buildWorkspaceSnapshot } from '@/server/bootstrap/pipeline';
import { parseRequestedScope } from '@/server/reviews/scopeOptions';
import { formatWorkspaceDay } from '@/components/workspace/formatting';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const TYPE_LABEL = {
  en: {
    'daily-brief': 'Daily Brief',
    'daily-review': 'Daily Review',
    'weekly-review': 'Weekly Review',
    daily: 'Daily Review',
    weekly: 'Weekly Review'
  },
  zh: {
    'daily-brief': '每日简报',
    'daily-review': '每日评审',
    'weekly-review': '每周评审',
    daily: '每日评审',
    weekly: '每周评审'
  }
} as const;

function labelType(type: string, lang: 'en' | 'zh') {
  const map = TYPE_LABEL[lang] as Record<string, string>;
  return map[type] ?? type;
}

export default async function ReviewsPage({
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
  const frontPage =
    snapshot.latestDailyBrief ??
    snapshot.latestDailyReview ??
    snapshot.latestWeeklyReview ??
    snapshot.reviews[0];
  const feed = snapshot.reviews.filter((r) => !frontPage || r.id !== frontPage.id);
  const weekly = snapshot.latestWeeklyReview;

  return (
    <main className="mx-auto w-full max-w-4xl px-6 pb-24 pt-10 md:pt-14">
      <header className="mb-10">
        <div className="caption num mb-3">
          {snapshot.reviews.length} {lang === 'zh' ? '份草稿' : 'drafts'} ·{' '}
          {snapshot.currentScope.scopeLabel}
        </div>
        <h1 className="serif text-4xl font-semibold tracking-tight text-stone-950 md:text-5xl">
          {lang === 'zh' ? '评审' : 'Reviews'}
        </h1>
      </header>

      {/* Front page hero (Decision Support) */}
      <section className="mb-14">
        <div className="mb-3">
          <Eyebrow>{lang === 'zh' ? '决策支持' : 'Decision Support'}</Eyebrow>
        </div>
        {frontPage ? (
          <article className="max-w-2xl">
            <div className="caption num mb-2">
              {labelType(frontPage.reviewType, lang)} ·{' '}
              {formatWorkspaceDay(frontPage.generatedAt, lang)}
            </div>
            <h2 className="serif text-3xl font-semibold leading-tight tracking-tight text-stone-950 md:text-[34px]">
              {frontPage.title}
            </h2>
            <p className="serif mt-4 border-l-2 border-[color:var(--accent)] pl-4 text-[16px] leading-8 text-stone-700">
              {frontPage.canonicalSummary}
            </p>
            <div className="caption mt-4 flex items-center gap-4 num">
              <span>{t.reviews.promotions(frontPage.promotionSuggestions.length)}</span>
              <span className="text-stone-300">·</span>
              <span>{t.reviews.nextSteps(frontPage.suggestedNextSteps.length)}</span>
            </div>
            <a
              className="mt-6 inline-block caption hover:text-[color:var(--accent)]"
              href={buildWorkspaceHref(
                `/reviews/${frontPage.slug}`,
                snapshot.currentScope,
                lang
              )}
            >
              {lang === 'zh' ? '继续阅读' : 'continue reading'} →
            </a>
          </article>
        ) : (
          <p className="muted text-sm">{t.reviews.noReviews}</p>
        )}
      </section>

      {/* Weekly outlook */}
      {weekly ? (
        <section className="mb-14 max-w-2xl">
          <div className="mb-3">
            <Eyebrow muted>{lang === 'zh' ? '下周展望' : 'Weekly Outlook'}</Eyebrow>
          </div>
          <p className="serif text-[16px] leading-8 text-stone-700">
            {weekly.context.weeklyOutlook}
          </p>
        </section>
      ) : null}

      {/* Earlier feed */}
      {feed.length > 0 ? (
        <section className="mb-14">
          <div className="mb-3 flex items-baseline justify-between">
            <Eyebrow muted>{lang === 'zh' ? '更早' : 'Earlier'}</Eyebrow>
            <a className="caption hover:text-[color:var(--accent)]" href="/api/reviews">
              JSON feed →
            </a>
          </div>
          <ul className="divide-y divide-stone-200/60">
            {feed.map((r) => (
              <li key={r.id}>
                <a
                  href={buildWorkspaceHref(`/reviews/${r.slug}`, snapshot.currentScope, lang)}
                  className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-baseline gap-4 py-3 transition hover:bg-stone-100/40"
                >
                  <div className="min-w-0">
                    <div className="serif truncate text-[15px] font-semibold text-stone-900">
                      {r.title}
                    </div>
                    <div className="mt-0.5 truncate text-[13px] text-stone-500">
                      {r.canonicalSummary}
                    </div>
                  </div>
                  <span className="caption num flex-none">
                    {labelType(r.reviewType, lang)}
                  </span>
                  <span className="caption num flex-none text-right w-20">
                    {formatWorkspaceDay(r.generatedAt, lang)}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Scope footer */}
      <footer className="border-t border-stone-200/70 pt-5">
        <div className="caption mb-2">{lang === 'zh' ? '切换范围' : 'Scope'}</div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {snapshot.availableScopes.map((s) => {
            const isActive =
              s.scopeKind === snapshot.currentScope.scopeKind &&
              s.scopeValue === snapshot.currentScope.scopeValue;
            const href = buildWorkspaceHref('/reviews', s, lang);
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
