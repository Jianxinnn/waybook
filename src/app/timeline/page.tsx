import { createWaybookConfig } from '@/lib/config';
import { TimelineList } from '@/components/timeline/TimelineList';
import { WorkspacePage, WorkspaceSection } from '@/components/workspace/WorkspacePage';
import { dict, resolveLang } from '@/lib/i18n';
import { buildWorkspaceSnapshot } from '@/server/bootstrap/pipeline';
import { parseRequestedScope } from '@/server/reviews/scopeOptions';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function buildFilterSummary(filters: {
  q?: string;
  project?: string;
  source?: string;
  scopeLabel?: string;
}) {
  return [
    filters.q ? { label: 'Search', value: filters.q } : null,
    filters.project ? { label: 'Project', value: filters.project } : null,
    filters.source ? { label: 'Source', value: filters.source } : null,
    filters.scopeLabel ? { label: 'Scope', value: filters.scopeLabel } : null
  ].filter((filter): filter is { label: string; value: string } => filter !== null);
}

export default async function TimelinePage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const lang = resolveLang(resolvedSearchParams);
  const t = dict[lang];
  const q = typeof resolvedSearchParams.q === 'string' ? resolvedSearchParams.q : undefined;
  const project =
    typeof resolvedSearchParams.project === 'string' ? resolvedSearchParams.project : undefined;
  const source =
    typeof resolvedSearchParams.source === 'string' ? resolvedSearchParams.source : undefined;
  const scope = parseRequestedScope(
    typeof resolvedSearchParams.scopeKind === 'string' ? resolvedSearchParams.scopeKind : undefined,
    typeof resolvedSearchParams.scopeValue === 'string' ? resolvedSearchParams.scopeValue : undefined,
    typeof resolvedSearchParams.scopeLabel === 'string' ? resolvedSearchParams.scopeLabel : undefined
  );
  const snapshot = await buildWorkspaceSnapshot(createWaybookConfig(), {
    filters: { q, project, source },
    scope
  });
  const activeFilters = buildFilterSummary({ q, project, source, scopeLabel: scope.scopeLabel });

  const meta = `${snapshot.items.length} ${t.common.events} · ${snapshot.currentScope.scopeLabel}`;

  return (
    <WorkspacePage
      title="Research Timeline"
      description="Evidence from every connector, normalized into one chronology."
      meta={meta}
    >
      {activeFilters.length > 0 ? (
        <WorkspaceSection title="Active Filters">
          <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
            {activeFilters.map((filter) => (
              <li key={filter.label} className="flex items-baseline gap-1">
                <span className="caption">{filter.label}:</span>
                <span>{`${filter.label}: ${filter.value}`}</span>
              </li>
            ))}
          </ul>
        </WorkspaceSection>
      ) : null}

      <WorkspaceSection title="Latest Research Activity">
        <TimelineList items={snapshot.items} lang={lang} />
      </WorkspaceSection>
    </WorkspacePage>
  );
}
