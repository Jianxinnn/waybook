import { simpleGit } from 'simple-git';
import type { CollectResult, SourceCollector } from '@/types/source';
import type { CollectorCheckpointState, RawSourceEventInput } from '@/types/source';
import { resolveProjectForPath } from '@/lib/projectRegistry';
import { pathExists, toProjectKey } from './shared';

export const gitCollector: SourceCollector = {
  sourceFamily: 'git',
  connectorId: 'git-log',
  async collect({ config }): Promise<CollectResult> {
    const events: RawSourceEventInput[] = [];
    const checkpoints: CollectorCheckpointState[] = [];

    for (const repoRoot of config.repoRoots) {
      if (!(await pathExists(repoRoot)) || !(await pathExists(`${repoRoot}/.git`))) {
        continue;
      }

      const git = simpleGit(repoRoot);
      const log = await git.log({ maxCount: 25 });
      const { projectKey } = await resolveProjectForPath(config, repoRoot);

      for (const commit of log.all) {
        const showOutput = await git.raw([
          'show',
          '--pretty=format:%H%n%s%n%ct',
          '--name-only',
          '--no-renames',
          commit.hash
        ]);
        const [hash, message, timestamp, ...files] = showOutput
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean);

        events.push({
          id: `git:${projectKey}:${hash}`,
          sourceFamily: 'git',
          connectorId: 'git-log',
          provenanceTier: 'primary',
          sourceEventId: hash,
          projectKey,
          repoPath: repoRoot,
          capturedAt: Date.now(),
          occurredAt: Number(timestamp) * 1000,
          payload: {
            kind: 'commit',
            message,
            changedFiles: files
          }
        });
      }

      checkpoints.push({
        connectorId: 'git-log',
        scopeKey: repoRoot,
        cursorToken: log.latest?.hash ?? 'empty',
        updatedAt: Date.now()
      });
    }

    return { events, checkpoints };
  }
};
