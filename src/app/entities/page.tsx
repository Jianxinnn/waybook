import { createWaybookConfig } from '@/lib/config';
import { buildWorkspaceHref, dict, resolveLang } from '@/lib/i18n';
import { Eyebrow } from '@/components/workspace/chrome';
import { buildWorkspaceSnapshot } from '@/server/bootstrap/pipeline';
import { parseRequestedScope } from '@/server/reviews/scopeOptions';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function EntitiesPage({
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

  const groups = new Map<string, typeof snapshot.entities>();
  for (const entity of snapshot.entities) {
    const bucket = groups.get(entity.entityType) ?? [];
    bucket.push(entity);
    groups.set(entity.entityType, bucket);
  }
  const ordered = ['project', 'topic', 'experiment', 'decision', 'method', 'artifact'];
  const groupedEntries = [
    ...ordered
      .filter((type) => groups.has(type))
      .map((type) => [type, groups.get(type)!] as const),
    ...[...groups.entries()].filter(([type]) => !ordered.includes(type))
  ];

  const lead =
    lang === 'zh'
      ? `${snapshot.entities.length} 个知识条目跨 ${groupedEntries.length} 种类型，按类型归类。点开任一条目查看完整正文与证据。`
      : `${snapshot.entities.length} compiled entries across ${groupedEntries.length} kinds, grouped by type. Click any entry to read the compiled notes.`;

  return (
    <main className="mx-auto w-full max-w-4xl px-6 pb-24 pt-10 md:pt-14">
      <header className="mb-10">
        <div className="caption num mb-3">
          {snapshot.entities.length} {lang === 'zh' ? '条目' : 'entries'} ·{' '}
          {snapshot.currentScope.scopeLabel}
        </div>
        <h1 className="serif text-4xl font-semibold tracking-tight text-stone-950 md:text-5xl">
          {lang === 'zh' ? '知识' : 'Knowledge'}
        </h1>
        <p className="lead mt-5 max-w-2xl">{lead}</p>
      </header>

      {snapshot.entities.length === 0 ? (
        <p className="muted text-sm">{t.entities.noEntities}</p>
      ) : (
        <div className="space-y-12">
          {groupedEntries.map(([type, entities]) => (
            <section key={type}>
              <div className="mb-3 flex items-baseline justify-between border-b border-stone-200/70 pb-2">
                <Eyebrow>
                  {t.entities.typeLabel[type] ?? type}
                </Eyebrow>
                <span className="caption num">{entities.length}</span>
              </div>
              <ul className="divide-y divide-stone-200/60">
                {entities.map((entity) => (
                  <li key={entity.id}>
                    <a
                      href={buildWorkspaceHref(
                        `/entities/${entity.slug}`,
                        snapshot.currentScope,
                        lang
                      )}
                      className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-4 py-3 transition hover:bg-stone-100/40"
                    >
                      <div className="min-w-0">
                        <div className="flex items-baseline gap-3">
                          <span className="serif truncate text-[15px] font-semibold text-stone-900">
                            {entity.title}
                          </span>
                          <span className="caption num flex-none">{entity.projectKey}</span>
                        </div>
                        <p className="mt-0.5 truncate text-[13px] leading-5 text-stone-500">
                          {entity.canonicalSummary}
                        </p>
                      </div>
                      <span className="caption num flex-none">
                        {entity.supportingEventIds.length}{' '}
                        {t.common.events}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <footer className="mt-14 border-t border-stone-200/70 pt-5">
        <div className="caption mb-2">{lang === 'zh' ? '切换范围' : 'Scope'}</div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {snapshot.availableScopes.map((s) => {
            const isActive =
              s.scopeKind === snapshot.currentScope.scopeKind &&
              s.scopeValue === snapshot.currentScope.scopeValue;
            const href = buildWorkspaceHref('/entities', s, lang);
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
        <p className="caption mt-2">
          {lang === 'zh'
            ? `正在以 ${snapshot.currentScope.scopeLabel} 的视角阅读工作区。`
            : `Currently reading the ${snapshot.currentScope.scopeLabel} surface.`}
        </p>
      </footer>
    </main>
  );
}
