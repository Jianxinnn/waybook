import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { GET, POST } from '@/app/api/reviews/route';

const tempPaths: string[] = [];
const originalEnv = {
  WAYBOOK_DATABASE_PATH: process.env.WAYBOOK_DATABASE_PATH,
  WAYBOOK_EXPORT_ROOT: process.env.WAYBOOK_EXPORT_ROOT,
  WAYBOOK_PROJECT_REGISTRY_PATH: process.env.WAYBOOK_PROJECT_REGISTRY_PATH,
  WAYBOOK_CLAUDE_MEM_DB_PATH: process.env.WAYBOOK_CLAUDE_MEM_DB_PATH,
  WAYBOOK_CLAUDE_PROJECT_ROOTS: process.env.WAYBOOK_CLAUDE_PROJECT_ROOTS,
  WAYBOOK_CODEX_SESSION_ROOTS: process.env.WAYBOOK_CODEX_SESSION_ROOTS,
  WAYBOOK_REPO_ROOTS: process.env.WAYBOOK_REPO_ROOTS,
  WAYBOOK_EXPERIMENT_ROOTS: process.env.WAYBOOK_EXPERIMENT_ROOTS,
  WAYBOOK_SEEDED_SOURCES_ENABLED: process.env.WAYBOOK_SEEDED_SOURCES_ENABLED,
  WAYBOOK_SECRETARY_AUTOGENERATE_ON_READ: process.env.WAYBOOK_SECRETARY_AUTOGENERATE_ON_READ
};

async function makeTempDir(prefix: string) {
  const dir = await mkdtemp(path.join(tmpdir(), prefix));
  tempPaths.push(dir);
  return dir;
}

function restoreEnv(name: keyof typeof originalEnv) {
  const value = originalEnv[name];

  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}

afterEach(async () => {
  restoreEnv('WAYBOOK_DATABASE_PATH');
  restoreEnv('WAYBOOK_EXPORT_ROOT');
  restoreEnv('WAYBOOK_PROJECT_REGISTRY_PATH');
  restoreEnv('WAYBOOK_CLAUDE_MEM_DB_PATH');
  restoreEnv('WAYBOOK_CLAUDE_PROJECT_ROOTS');
  restoreEnv('WAYBOOK_CODEX_SESSION_ROOTS');
  restoreEnv('WAYBOOK_REPO_ROOTS');
  restoreEnv('WAYBOOK_EXPERIMENT_ROOTS');
  restoreEnv('WAYBOOK_SEEDED_SOURCES_ENABLED');
  restoreEnv('WAYBOOK_SECRETARY_AUTOGENERATE_ON_READ');

  await Promise.all(tempPaths.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe('reviews api', () => {
  it('lists current review drafts', async () => {
    const response = await GET(
      new Request(
        'http://localhost/api/reviews?reviewType=daily-brief&scopeKind=portfolio&scopeValue=portfolio'
      )
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(payload.items)).toBe(true);
    expect(payload.currentScope.scopeKind).toBe('portfolio');
    expect(Array.isArray(payload.availableScopes)).toBe(true);
  });

  it('does not generate review drafts during GET reads', async () => {
    const root = await makeTempDir('waybook-reviews-api-read-');
    process.env.WAYBOOK_DATABASE_PATH = path.join(root, 'waybook.sqlite');
    process.env.WAYBOOK_EXPORT_ROOT = path.join(root, 'obsidian');
    process.env.WAYBOOK_PROJECT_REGISTRY_PATH = path.join(root, 'project-registry.json');
    process.env.WAYBOOK_CLAUDE_MEM_DB_PATH = path.join(root, 'claude-mem.sqlite');
    process.env.WAYBOOK_CLAUDE_PROJECT_ROOTS = '';
    process.env.WAYBOOK_CODEX_SESSION_ROOTS = '';
    process.env.WAYBOOK_REPO_ROOTS = '';
    process.env.WAYBOOK_EXPERIMENT_ROOTS = '';
    process.env.WAYBOOK_SEEDED_SOURCES_ENABLED = 'true';
    process.env.WAYBOOK_SECRETARY_AUTOGENERATE_ON_READ = 'true';

    const response = await GET(
      new Request(
        'http://localhost/api/reviews?reviewType=daily-brief&scopeKind=portfolio&scopeValue=portfolio'
      )
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.items).toEqual([]);
    expect(payload.availableScopes).toEqual([
      {
        scopeKind: 'portfolio',
        scopeValue: 'portfolio',
        scopeLabel: 'Portfolio'
      }
    ]);
  });

  it('generates current secretary drafts on demand', async () => {
    const response = await POST(
      new Request(
        'http://localhost/api/reviews?reviewType=daily-brief&scopeKind=portfolio&scopeValue=portfolio',
        { method: 'POST' }
      )
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(payload.generated)).toBe(true);
    expect(payload.generated.length).toBeGreaterThan(0);
  });
});
