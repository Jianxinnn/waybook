import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import type { CollectResult, SourceCollector } from '@/types/source';
import type { CollectorCheckpointState, RawSourceEventInput } from '@/types/source';
import { resolveProjectForPath } from '@/lib/projectRegistry';
import { pathExists, toProjectKey, walkFiles } from './shared';

function inferKind(filePath: string) {
  if (filePath.endsWith('metrics.json')) {
    return 'metrics';
  }

  if (filePath.endsWith('.md')) {
    return 'summary';
  }

  return 'artifact';
}

export const experimentCollector: SourceCollector = {
  sourceFamily: 'experiment',
  connectorId: 'experiment-fs',
  async collect({ config }): Promise<CollectResult> {
    const events: RawSourceEventInput[] = [];
    const checkpoints: CollectorCheckpointState[] = [];

    for (const root of config.experimentRoots) {
      if (!(await pathExists(root))) {
        continue;
      }

      const files = await walkFiles(root);
      const interestingFiles = files.filter((filePath) =>
        /(metrics\.json|\.md|\.png|\.jpg|\.svg)$/i.test(filePath)
      );
      const { projectKey } = await resolveProjectForPath(config, root);

      for (const filePath of interestingFiles) {
        const relativePath = path.relative(root, filePath);
        const runName = relativePath.split(path.sep)[0] ?? 'run';
        const fileStats = await stat(filePath);
        const kind = inferKind(filePath);
        const contents =
          kind === 'artifact'
            ? path.basename(filePath)
            : (await readFile(filePath, 'utf8')).slice(0, 280);

        events.push({
          id: `experiment:${projectKey}:${relativePath}`,
          sourceFamily: 'experiment',
          connectorId: 'experiment-fs',
          provenanceTier: 'primary',
          sourceEventId: relativePath,
          projectKey,
          repoPath: root,
          capturedAt: fileStats.mtimeMs,
          occurredAt: fileStats.mtimeMs,
          threadId: runName,
          payload: {
            kind,
            title: `${runName} ${kind} updated`,
            summary: contents.trim(),
            runName,
            filePath: relativePath
          }
        });
      }

      checkpoints.push({
        connectorId: 'experiment-fs',
        scopeKey: root,
        cursorToken: String(interestingFiles.length),
        updatedAt: Date.now()
      });
    }

    return { events, checkpoints };
  }
};
