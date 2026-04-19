import Link from 'next/link';
import { buildWorkspaceHref, type Lang } from '@/lib/i18n';
import type { ReviewScope } from '@/types/review';

interface ScopeTabsProps {
  basePath: string;
  scopes: ReviewScope[];
  currentScope: ReviewScope;
  lang?: Lang;
  counts?: Record<string, number>;
}

export function ScopeTabs({
  basePath,
  scopes,
  currentScope,
  lang = 'en',
  counts
}: ScopeTabsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {scopes.map((scope) => {
        const isActive =
          scope.scopeKind === currentScope.scopeKind && scope.scopeValue === currentScope.scopeValue;
        const href = buildWorkspaceHref(basePath, scope, lang);
        const count = counts?.[`${scope.scopeKind}:${scope.scopeValue}`];

        return (
          <Link
            key={`${scope.scopeKind}:${scope.scopeValue}`}
            aria-current={isActive ? 'page' : undefined}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 ${
              isActive
                ? 'border-amber-700 bg-amber-700 text-white'
                : 'border-stone-200 bg-white/85 text-stone-700 hover:border-amber-300 hover:text-stone-950'
            }`}
            href={href}
          >
            <span
              aria-hidden
              className={`inline-block h-1.5 w-1.5 rounded-full ${
                scope.scopeKind === 'portfolio'
                  ? 'bg-amber-400'
                  : scope.scopeKind === 'project'
                    ? 'bg-emerald-400'
                    : 'bg-sky-400'
              }`}
            />
            <span>{scope.scopeLabel}</span>
            {typeof count === 'number' ? (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                  isActive ? 'bg-white/25 text-white' : 'bg-stone-100 text-stone-600'
                }`}
              >
                {count}
              </span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
