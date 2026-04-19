import { notFound } from 'next/navigation';
import { createWaybookConfig } from '@/lib/config';
import { buildWorkspaceHref, dict, resolveLang } from '@/lib/i18n';
import { getReviewDraft } from '@/server/reviews/secretaryLoop';
import { parseRequestedScope } from '@/server/reviews/scopeOptions';
import { DetailPage, DetailSection } from '@/components/workspace/DetailPage';
import { Eyebrow, MetaList, Pill } from '@/components/workspace/chrome';
import { ProseView } from '@/components/workspace/ProseView';
import { formatWorkspaceDay } from '@/components/workspace/formatting';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const TYPE_LABEL: Record<string, { en: string; zh: string }> = {
  'daily-brief': { en: 'Daily Brief', zh: '每日简报' },
  'daily-review': { en: 'Daily Review', zh: '每日评审' },
  'weekly-review': { en: 'Weekly Review', zh: '每周评审' },
  daily: { en: 'Daily Review', zh: '每日评审' },
  weekly: { en: 'Weekly Review', zh: '每周评审' }
};

export default async function ReviewDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const lang = resolveLang(resolvedSearchParams);
  const t = dict[lang];
  const scope = parseRequestedScope(
    typeof resolvedSearchParams.scopeKind === 'string' ? resolvedSearchParams.scopeKind : undefined,
    typeof resolvedSearchParams.scopeValue === 'string' ? resolvedSearchParams.scopeValue : undefined,
    typeof resolvedSearchParams.scopeLabel === 'string' ? resolvedSearchParams.scopeLabel : undefined
  );
  const config = createWaybookConfig();
  const review = await getReviewDraft(config, slug);
  if (!review) {
    notFound();
  }

  const typeLabel = TYPE_LABEL[review.reviewType]?.[lang] ?? review.reviewType;
  const backHref = buildWorkspaceHref('/reviews', scope, lang);
  const ctx = review.context;

  const aside = (
    <MetaList
      items={[
        {
          label: lang === 'zh' ? '范围' : 'Scope',
          value: review.scope.scopeLabel
        },
        {
          label: lang === 'zh' ? '时段' : 'Period',
          value: `${formatWorkspaceDay(review.periodStart, lang)} → ${formatWorkspaceDay(
            review.periodEnd,
            lang
          )}`
        },
        {
          label: lang === 'zh' ? '生成于' : 'Generated',
          value: formatWorkspaceDay(review.generatedAt, lang)
        },
        {
          label: lang === 'zh' ? '证据' : 'Evidence',
          value: `${review.supportingEventIds.length} ${t.common.events}`
        },
        {
          label: lang === 'zh' ? '项目' : 'Projects',
          value: ctx.projectKeys.length
        },
        {
          label: lang === 'zh' ? '状态' : 'Status',
          value: (
            <Pill tone={review.status === 'accepted' ? 'emerald' : 'default'}>{review.status}</Pill>
          )
        }
      ]}
    />
  );

  return (
    <DetailPage
      eyebrow={
        <div className="flex items-center gap-3">
          <Eyebrow>{typeLabel}</Eyebrow>
          <a className="caption hover:text-[color:var(--accent)]" href={backHref}>
            ← {lang === 'zh' ? '回到评审' : 'Reviews'}
          </a>
        </div>
      }
      title={review.title}
      lead={review.canonicalSummary}
      aside={aside}
    >
      {ctx.whatMoved.length > 0 ? (
        <DetailSection title={lang === 'zh' ? '有进展' : 'What Moved'}>
          <ul className="list-disc space-y-2 pl-5 text-[15px] leading-7 text-stone-800">
            {ctx.whatMoved.map((line, idx) => (
              <li key={idx}>{line}</li>
            ))}
          </ul>
        </DetailSection>
      ) : null}

      {ctx.activeThreads.length > 0 ? (
        <DetailSection
          title={lang === 'zh' ? '活跃线索' : 'Active Threads'}
          hint={`${ctx.activeThreads.length}`}
        >
          <ul className="divide-y divide-stone-200/70">
            {ctx.activeThreads.map((thread) => (
              <li
                key={thread.threadKey}
                className="flex items-baseline justify-between gap-4 py-2.5"
              >
                <div className="min-w-0">
                  <div className="truncate text-[15px] text-stone-900">{thread.label}</div>
                  {thread.exemplarTitles?.[0] ? (
                    <div className="mt-0.5 truncate text-[13px] text-stone-500">
                      {thread.exemplarTitles[0]}
                    </div>
                  ) : null}
                </div>
                <span className="caption num flex-none">
                  {thread.projectKey} · {thread.eventCount} {t.common.events}
                </span>
              </li>
            ))}
          </ul>
        </DetailSection>
      ) : null}

      {ctx.stalledThreads.length > 0 ? (
        <DetailSection
          title={lang === 'zh' ? '停滞线索' : 'Stalled Threads'}
          hint={`${ctx.stalledThreads.length}`}
        >
          <ul className="divide-y divide-stone-200/70">
            {ctx.stalledThreads.map((thread) => (
              <li
                key={thread.threadKey}
                className="flex items-baseline justify-between gap-4 py-2.5"
              >
                <div className="min-w-0 truncate text-[15px] text-stone-700">{thread.label}</div>
                <span className="caption num flex-none">{thread.projectKey}</span>
              </li>
            ))}
          </ul>
        </DetailSection>
      ) : null}

      {ctx.repeatedPatterns.length > 0 ? (
        <DetailSection title={lang === 'zh' ? '重复模式' : 'Repeated Patterns'}>
          <ul className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
            {ctx.repeatedPatterns.map((p) => (
              <li
                key={p.label}
                className="flex items-baseline justify-between border-b border-stone-200/60 py-1.5 text-sm"
              >
                <span className="truncate">{p.label}</span>
                <span className="caption num flex-none">{p.count}</span>
              </li>
            ))}
          </ul>
        </DetailSection>
      ) : null}

      {ctx.promotionSuggestions.length > 0 ? (
        <DetailSection
          title={lang === 'zh' ? '提升建议' : 'Promotion Suggestions'}
          hint={`${ctx.promotionSuggestions.length}`}
        >
          <ul className="space-y-4">
            {ctx.promotionSuggestions.map((p) => (
              <li key={p.id} className="border-l-2 border-[color:var(--accent)] pl-4">
                <div className="flex items-baseline gap-2">
                  <Pill tone="accent">{p.action}</Pill>
                  <span className="serif text-[15px] font-semibold text-stone-900">{p.label}</span>
                  <span className="caption ml-auto num">
                    {p.entityType} · {(p.score * 100).toFixed(0)}
                  </span>
                </div>
                <p className="mt-1 text-[14px] leading-6 text-stone-600">{p.rationale}</p>
              </li>
            ))}
          </ul>
        </DetailSection>
      ) : null}

      {ctx.suggestedNextSteps.length > 0 ? (
        <DetailSection title={lang === 'zh' ? '下一步' : 'Next Steps'}>
          <ol className="list-decimal space-y-2 pl-5 text-[15px] leading-7 text-stone-800">
            {ctx.suggestedNextSteps.map((step, idx) => (
              <li key={idx}>{step}</li>
            ))}
          </ol>
        </DetailSection>
      ) : null}

      {ctx.weeklyOutlook ? (
        <DetailSection title={lang === 'zh' ? '下周展望' : 'Weekly Outlook'}>
          <p className="serif text-[16px] leading-8 text-stone-800">{ctx.weeklyOutlook}</p>
        </DetailSection>
      ) : null}

      <DetailSection title={lang === 'zh' ? '完整草稿' : 'Full Draft'}>
        <ProseView markdown={review.managedMarkdown} />
      </DetailSection>
    </DetailPage>
  );
}
