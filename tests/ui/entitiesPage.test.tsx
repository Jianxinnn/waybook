import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import EntitiesPage from '@/app/entities/page';
import EntityDetailPage from '@/app/entities/[slug]/page';
import { createDatabaseClient } from '@/server/db/client';

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
  WAYBOOK_SEEDED_SOURCES_ENABLED: process.env.WAYBOOK_SEEDED_SOURCES_ENABLED
};

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  }
}));

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

  await Promise.all(tempPaths.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe('EntitiesPage', () => {
  it('renders the refreshed knowledge framing', async () => {
    const html = renderToString(await EntitiesPage({}));

    expect(html).toContain('Knowledge');
    expect(html).toContain('Waybook');
  });

  it('keeps the current scope when opening the knowledge page', async () => {
    const html = renderToString(
      await EntitiesPage({
        searchParams: Promise.resolve({
          scopeKind: 'project',
          scopeValue: 'waybook',
          scopeLabel: 'Waybook'
        })
      })
    );

    expect(html).toContain('Currently reading the Waybook surface.');
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('/entities/topic-timeline?scopeKind=project&amp;scopeValue=waybook&amp;scopeLabel=Waybook');
  });

  it('does not ingest during entity detail reads', async () => {
    const root = await makeTempDir('waybook-entity-page-read-');
    const databasePath = path.join(root, 'waybook.sqlite');
    process.env.WAYBOOK_DATABASE_PATH = databasePath;
    process.env.WAYBOOK_EXPORT_ROOT = path.join(root, 'obsidian');
    process.env.WAYBOOK_PROJECT_REGISTRY_PATH = path.join(root, 'project-registry.json');
    process.env.WAYBOOK_CLAUDE_MEM_DB_PATH = path.join(root, 'claude-mem.sqlite');
    process.env.WAYBOOK_CLAUDE_PROJECT_ROOTS = '';
    process.env.WAYBOOK_CODEX_SESSION_ROOTS = '';
    process.env.WAYBOOK_REPO_ROOTS = '';
    process.env.WAYBOOK_EXPERIMENT_ROOTS = '';
    process.env.WAYBOOK_SEEDED_SOURCES_ENABLED = 'true';

    await expect(EntityDetailPage({ params: Promise.resolve({ slug: 'missing' }) })).rejects.toThrow(
      'NEXT_NOT_FOUND'
    );

    const client = createDatabaseClient(databasePath);
    expect(client.sqlite.prepare('select count(*) as count from research_events').get()).toEqual({ count: 0 });
    expect(client.sqlite.prepare('select count(*) as count from wiki_entities').get()).toEqual({ count: 0 });
    client.sqlite.close();
  });
});
