import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { WaybookConfig } from './config';
import type { ProjectRegistry, ProjectRegistryEntry } from '@/types/project';
import { toProjectKey } from '@/server/ingest/shared';

const emptyRegistry: ProjectRegistry = {
  projects: []
};

function normalizePath(value: string) {
  return path.resolve(value).replace(/\\/g, '/').replace(/\/+$/, '');
}

function titleize(value: string) {
  return value
    .split(/[-_]/g)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

export async function loadProjectRegistry(config: WaybookConfig): Promise<ProjectRegistry> {
  try {
    const contents = await readFile(config.projectRegistryPath, 'utf8');
    const parsed = JSON.parse(contents) as ProjectRegistry;
    return {
      projects: parsed.projects ?? []
    };
  } catch {
    return emptyRegistry;
  }
}

function findMatchingProject(registry: ProjectRegistry, repoPath: string) {
  const normalizedRepoPath = normalizePath(repoPath);
  const candidates = registry.projects
    .flatMap((project) =>
      (project.repoRoots ?? []).map((repoRoot) => ({
        project,
        repoRoot: normalizePath(repoRoot)
      }))
    )
    .filter(({ repoRoot }) => normalizedRepoPath === repoRoot || normalizedRepoPath.startsWith(`${repoRoot}/`))
    .sort((left, right) => right.repoRoot.length - left.repoRoot.length);

  return candidates[0]?.project;
}

export async function resolveProjectForPath(config: WaybookConfig, repoPath: string) {
  const registry = await loadProjectRegistry(config);
  const match = findMatchingProject(registry, repoPath);

  if (match) {
    return {
      projectKey: match.projectKey,
      label: match.label ?? titleize(match.projectKey)
    };
  }

  const fallbackKey = toProjectKey(repoPath);
  return {
    projectKey: fallbackKey,
    label: titleize(fallbackKey)
  };
}

export async function listProjectScopes(config: WaybookConfig, projectKeys: string[]) {
  const registry = await loadProjectRegistry(config);
  const byKey = new Map(registry.projects.map((project) => [project.projectKey, project]));

  return [...new Set(projectKeys)]
    .sort()
    .map((projectKey) => {
      const entry = byKey.get(projectKey);
      return {
        scopeKind: 'project' as const,
        scopeValue: projectKey,
        scopeLabel: entry?.label ?? titleize(projectKey)
      };
    });
}
