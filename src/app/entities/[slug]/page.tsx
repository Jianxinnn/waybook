import { notFound } from 'next/navigation';
import { createWaybookConfig } from '@/lib/config';
import { buildWorkspaceHref, dict, resolveLang } from '@/lib/i18n';
import { createDatabaseClient } from '@/server/db/client';
import { getWikiEntity } from '@/server/search/entityService';
import { parseRequestedScope } from '@/server/reviews/scopeOptions';
import { DetailPage, DetailSection } from '@/components/workspace/DetailPage';
import { Eyebrow, MetaList, Pill } from '@/components/workspace/chrome';
import { ProseView } from '@/components/workspace/ProseView';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ENTITY_LABEL: Record<string, { en: string; zh: string }> = {
  project: { en: 'Project', zh: '项目' },
  experiment: { en: 'Experiment', zh: '实验' },
  topic: { en: 'Topic', zh: '主题' },
  decision: { en: 'Decision', zh: '决策' },
  method: { en: 'Method', zh: '方法' },
  artifact: { en: 'Artifact', zh: '产出' }
};

export default async function EntityDetailPage({
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

  const client = createDatabaseClient(config.databasePath);
  const entity = await getWikiEntity(client, slug);

  if (!entity) {
    notFound();
  }

  const kindLabel = ENTITY_LABEL[entity.entityType]?.[lang] ?? entity.entityType;
  const backHref = buildWorkspaceHref('/entities', scope, lang);
  const projectHref = buildWorkspaceHref(`/projects/${entity.projectKey}`, scope, lang);
  const timelineHref = buildWorkspaceHref(
    `/timeline?project=${entity.projectKey}`,
    scope,
    lang
  );

  const aside = (
    <MetaList
      items={[
        {
          label: lang === 'zh' ? '项目' : 'Project',
          value: (
            <a className="hover:text-[color:var(--accent)]" href={projectHref}>
              {entity.projectKey}
            </a>
          )
        },
        {
          label: lang === 'zh' ? '状态' : 'Status',
          value: (
            <Pill tone={entity.status === 'active' ? 'emerald' : 'default'}>
              {entity.status}
            </Pill>
          )
        },
        {
          label: lang === 'zh' ? '证据' : 'Evidence',
          value: `${entity.supportingEventIds.length} ${t.common.events}`
        },
        {
          label: lang === 'zh' ? '关联线索' : 'Source threads',
          value: entity.sourceThreadIds.length
        },
        {
          label: lang === 'zh' ? '导出路径' : 'Obsidian',
          value: (
            <span className="truncate text-[11px] text-stone-500" title={entity.obsidianPath}>
              {entity.obsidianPath}
            </span>
          )
        }
      ]}
    />
  );

  return (
    <DetailPage
      eyebrow={
        <div className="flex items-center gap-3">
          <Eyebrow>{kindLabel}</Eyebrow>
          <a className="caption hover:text-[color:var(--accent)]" href={backHref}>
            ← {lang === 'zh' ? '回到知识' : 'Knowledge'}
          </a>
        </div>
      }
      title={entity.title}
      lead={entity.canonicalSummary}
      aside={aside}
    >
      <DetailSection title={lang === 'zh' ? '正文' : 'Compiled Notes'}>
        <ProseView markdown={entity.managedMarkdown} />
      </DetailSection>

      <DetailSection
        title={lang === 'zh' ? '后续' : 'Keep Reading'}
        hint={
          <a className="caption hover:text-[color:var(--accent)]" href={timelineHref}>
            {lang === 'zh' ? '打开时间线' : 'open timeline'} →
          </a>
        }
      >
        <p className="muted text-sm">
          {lang === 'zh'
            ? `在时间线中查看 ${entity.projectKey} 的原始证据。`
            : `See raw evidence for ${entity.projectKey} on the timeline.`}
        </p>
      </DetailSection>
    </DetailPage>
  );
}
