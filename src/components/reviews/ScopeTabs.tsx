import type { ReviewScope } from '@/types/review';

interface ScopeTabsProps {
  basePath: string;
  scopes: ReviewScope[];
  currentScope: ReviewScope;
}

export function ScopeTabs({ basePath, scopes, currentScope }: ScopeTabsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {scopes.map((scope) => {
        const isActive =
          scope.scopeKind === currentScope.scopeKind && scope.scopeValue === currentScope.scopeValue;
        const href = `${basePath}?scopeKind=${encodeURIComponent(scope.scopeKind)}&scopeValue=${encodeURIComponent(
          scope.scopeValue
        )}&scopeLabel=${encodeURIComponent(scope.scopeLabel)}`;

        return (
          <a
            key={`${scope.scopeKind}:${scope.scopeValue}`}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              isActive
                ? 'bg-amber-600 text-white'
                : 'bg-white text-stone-700 ring-1 ring-stone-200'
            }`}
            href={href}
          >
            {scope.scopeLabel}
          </a>
        );
      })}
    </div>
  );
}
