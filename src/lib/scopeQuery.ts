import type { ReviewScope } from '@/types/review';

type SearchParamRecord = Record<string, string | string[] | undefined>;
type SearchParamReader = {
  get(name: string): string | null;
};

function getFirstValue(value: string | string[] | undefined) {
  return typeof value === 'string' ? value : value?.[0];
}

function isSearchParamReader(
  searchParams: SearchParamRecord | SearchParamReader
): searchParams is SearchParamReader {
  return typeof (searchParams as SearchParamReader).get === 'function';
}

export function readScopeQuery(searchParams: SearchParamRecord | SearchParamReader): ReviewScope | null {
  const scopeKind = isSearchParamReader(searchParams)
    ? searchParams.get('scopeKind') ?? undefined
    : getFirstValue(searchParams.scopeKind);
  const scopeValue = isSearchParamReader(searchParams)
    ? searchParams.get('scopeValue') ?? undefined
    : getFirstValue(searchParams.scopeValue);
  const scopeLabel = isSearchParamReader(searchParams)
    ? searchParams.get('scopeLabel') ?? undefined
    : getFirstValue(searchParams.scopeLabel);

  if (!scopeKind || !scopeValue) {
    return null;
  }

  return {
    scopeKind: scopeKind as ReviewScope['scopeKind'],
    scopeValue,
    scopeLabel: scopeLabel ?? scopeValue
  };
}

export function withScopeQuery(href: string, scope: ReviewScope | null) {
  if (!scope) {
    return href;
  }

  const [pathname, query = ''] = href.split('?');
  const params = new URLSearchParams(query);
  params.set('scopeKind', scope.scopeKind);
  params.set('scopeValue', scope.scopeValue);
  params.set('scopeLabel', scope.scopeLabel);
  const nextQuery = params.toString();

  return nextQuery ? `${pathname}?${nextQuery}` : pathname;
}
