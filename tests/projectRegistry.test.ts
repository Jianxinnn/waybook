import { describe, expect, it } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createWaybookConfig } from '@/lib/config';
import { loadProjectRegistry, resolveProjectForPath } from '@/lib/projectRegistry';

describe('project registry', () => {
  it('treats stringified undefined env values as unset configuration', () => {
    process.env.WAYBOOK_DATABASE_PATH = 'undefined';
    process.env.WAYBOOK_EXPORT_ROOT = 'undefined';
    process.env.WAYBOOK_PROJECT_REGISTRY_PATH = 'undefined';

    const config = createWaybookConfig();

    expect(config.databasePath.endsWith(path.join('data', 'waybook.test.sqlite')) || config.databasePath.endsWith(path.join('data', 'waybook.sqlite'))).toBe(true);
    expect(config.exportRoot.includes(path.join('data', 'obsidian'))).toBe(true);
    expect(config.projectRegistryPath.includes(path.join('data', 'project-registry.json'))).toBe(true);

    delete process.env.WAYBOOK_DATABASE_PATH;
    delete process.env.WAYBOOK_EXPORT_ROOT;
    delete process.env.WAYBOOK_PROJECT_REGISTRY_PATH;
  });

  it('maps multiple repo roots into one logical project key', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'waybook-project-registry-'));
    const registryPath = path.join(root, 'project-registry.json');
    await writeFile(
      registryPath,
      JSON.stringify(
        {
          projects: [
            {
              projectKey: 'waybook',
              label: 'Waybook',
              repoRoots: ['/repo/waybook', '/repo/waybook-ui']
            }
          ]
        },
        null,
        2
      )
    );

    const config = createWaybookConfig({
      projectRegistryPath: registryPath
    });

    const registry = await loadProjectRegistry(config);
    const resolved = await resolveProjectForPath(config, '/repo/waybook-ui/src/app');

    expect(registry.projects[0]?.projectKey).toBe('waybook');
    expect(resolved.projectKey).toBe('waybook');
    expect(resolved.label).toBe('Waybook');

    await rm(root, { recursive: true, force: true });
  });
});
