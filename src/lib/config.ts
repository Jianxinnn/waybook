import { homedir } from 'node:os';
import path from 'node:path';
import { z } from 'zod';

const configSchema = z.object({
  databasePath: z.string(),
  exportRoot: z.string(),
  projectRegistryPath: z.string(),
  claudeProjectsRoots: z.array(z.string()),
  claudeMemDbPath: z.string(),
  codexSessionsRoots: z.array(z.string()),
  repoRoots: z.array(z.string()),
  experimentRoots: z.array(z.string()),
  seededSourcesEnabled: z.boolean(),
  llmProvider: z.string().nullable(),
  llmModel: z.string().nullable(),
  llmApiKey: z.string().nullable(),
  llmBaseUrl: z.string().nullable(),
  llmGenerationEnabled: z.boolean(),
  secretaryAutogenerateOnRead: z.boolean()
});

export type WaybookConfig = z.infer<typeof configSchema>;

function normalizeEnvString(value: string | undefined) {
  if (value == null) {
    return undefined;
  }

  const trimmed = value.trim();
  if (trimmed === '' || trimmed.toLowerCase() === 'undefined' || trimmed.toLowerCase() === 'null') {
    return undefined;
  }

  return trimmed;
}

function parsePathList(value: string | undefined) {
  const normalized = normalizeEnvString(value);
  if (!normalized) {
    return [];
  }

  return normalized
    .split(path.delimiter)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseBoolean(value: string | undefined, fallback: boolean) {
  const normalized = normalizeEnvString(value);
  if (normalized == null) {
    return fallback;
  }

  return ['1', 'true', 'yes', 'on'].includes(normalized.toLowerCase());
}

export function createWaybookConfig(overrides: Partial<WaybookConfig> = {}): WaybookConfig {
  const home = homedir();
  const isTestEnvironment = process.env.VITEST === 'true' || process.env.NODE_ENV === 'test';
  const defaultDatabasePath = isTestEnvironment
    ? path.join(process.cwd(), 'data', 'waybook.test.sqlite')
    : path.join(process.cwd(), 'data', 'waybook.sqlite');
  const defaultExportRoot = isTestEnvironment
    ? path.join(process.cwd(), 'data', 'obsidian-test')
    : path.join(process.cwd(), 'data', 'obsidian');

  return configSchema.parse({
    databasePath: normalizeEnvString(process.env.WAYBOOK_DATABASE_PATH) ?? defaultDatabasePath,
    exportRoot: normalizeEnvString(process.env.WAYBOOK_EXPORT_ROOT) ?? defaultExportRoot,
    projectRegistryPath:
      normalizeEnvString(process.env.WAYBOOK_PROJECT_REGISTRY_PATH) ??
      path.join(process.cwd(), 'data', 'project-registry.json'),
    claudeProjectsRoots: parsePathList(process.env.WAYBOOK_CLAUDE_PROJECT_ROOTS),
    claudeMemDbPath:
      normalizeEnvString(process.env.WAYBOOK_CLAUDE_MEM_DB_PATH) ?? path.join(home, '.claude-mem', 'missing.db'),
    codexSessionsRoots: parsePathList(process.env.WAYBOOK_CODEX_SESSION_ROOTS),
    repoRoots: parsePathList(process.env.WAYBOOK_REPO_ROOTS).length
      ? parsePathList(process.env.WAYBOOK_REPO_ROOTS)
      : [process.cwd()],
    experimentRoots: parsePathList(process.env.WAYBOOK_EXPERIMENT_ROOTS).length
      ? parsePathList(process.env.WAYBOOK_EXPERIMENT_ROOTS)
      : [path.join(process.cwd(), 'data', 'experiments')],
    seededSourcesEnabled: parseBoolean(process.env.WAYBOOK_SEEDED_SOURCES_ENABLED, true),
    llmProvider: normalizeEnvString(process.env.WAYBOOK_LLM_PROVIDER) ?? null,
    llmModel: normalizeEnvString(process.env.WAYBOOK_LLM_MODEL) ?? null,
    llmApiKey: normalizeEnvString(process.env.WAYBOOK_LLM_API_KEY) ?? null,
    llmBaseUrl: normalizeEnvString(process.env.WAYBOOK_LLM_BASE_URL) ?? null,
    llmGenerationEnabled: parseBoolean(process.env.WAYBOOK_LLM_GENERATION_ENABLED, false),
    secretaryAutogenerateOnRead: parseBoolean(process.env.WAYBOOK_SECRETARY_AUTOGENERATE_ON_READ, true),
    ...overrides
  });
}
