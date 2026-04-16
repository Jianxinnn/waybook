import path from 'node:path';
import type { WaybookConfig } from '@/lib/config';
import { listProjectScopes } from '@/lib/projectRegistry';
import type { ReviewScope } from '@/types/review';
import type { ResearchEvent } from '@/types/research';

function titleize(value: string) {
  return value
    .split(/[-_]/g)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

export async function buildAvailableScopes(
  config: WaybookConfig,
  events: ResearchEvent[]
): Promise<ReviewScope[]> {
  const projectScopes = await listProjectScopes(
    config,
    events.map((event) => event.projectKey)
  );
  const repoScopes = [...new Set(events.map((event) => event.repoPath))]
    .sort()
    .map((repoPath) => ({
      scopeKind: 'repo' as const,
      scopeValue: repoPath,
      scopeLabel: titleize(path.basename(repoPath))
    }));

  return [
    {
      scopeKind: 'portfolio',
      scopeValue: 'portfolio',
      scopeLabel: 'Portfolio'
    },
    ...projectScopes,
    ...repoScopes
  ];
}

export function parseRequestedScope(
  scopeKind: string | undefined,
  scopeValue: string | undefined,
  scopeLabel?: string
): ReviewScope {
  if (!scopeKind || !scopeValue) {
    return {
      scopeKind: 'portfolio',
      scopeValue: 'portfolio',
      scopeLabel: 'Portfolio'
    };
  }

  return {
    scopeKind: scopeKind as ReviewScope['scopeKind'],
    scopeValue,
    scopeLabel: scopeLabel ?? scopeValue
  };
}

export function matchesScope(
  scope: ReviewScope,
  target: { projectKey?: string; repoPath?: string; scope?: ReviewScope }
) {
  if (target.scope) {
    return target.scope.scopeKind === scope.scopeKind && target.scope.scopeValue === scope.scopeValue;
  }

  if (scope.scopeKind === 'portfolio') {
    return true;
  }

  if (scope.scopeKind === 'project') {
    return target.projectKey === scope.scopeValue;
  }

  return target.repoPath === scope.scopeValue;
}
