import path from 'node:path';
import type { CollectResult, SourceCollector } from '@/types/source';
import type { CollectorCheckpointState, RawSourceEventInput } from '@/types/source';
import { resolveProjectForPath } from '@/lib/projectRegistry';
import { extractTextContent, pathExists, readJsonLines, toProjectKey, walkFiles } from './shared';

export const codexCollector: SourceCollector = {
  sourceFamily: 'codex',
  connectorId: 'codex-rollout-jsonl',
  async collect({ config }): Promise<CollectResult> {
    const events: RawSourceEventInput[] = [];
    const checkpoints: CollectorCheckpointState[] = [];

    for (const root of config.codexSessionsRoots) {
      if (!(await pathExists(root))) {
        continue;
      }

      const files = (await walkFiles(root)).filter((filePath) => filePath.endsWith('.jsonl'));

      for (const filePath of files) {
        const lines = await readJsonLines(filePath);
        const sessionMeta = lines.find((line) => line.type === 'session_meta');
        const sessionId = String(sessionMeta?.payload?.id ?? path.basename(filePath, '.jsonl'));
        const repoPath = String(sessionMeta?.payload?.cwd ?? path.dirname(filePath));
        const { projectKey } = await resolveProjectForPath(config, repoPath);

        lines.forEach((line, index) => {
          const payload = line.payload as Record<string, unknown> | undefined;
          const timestamp = Date.parse(String(line.timestamp ?? new Date().toISOString()));

          if (payload?.type === 'message' && typeof payload.role === 'string') {
            events.push({
              id: `codex:${sessionId}:${index}`,
              sourceFamily: 'codex',
              connectorId: 'codex-rollout-jsonl',
              provenanceTier: 'primary',
              sourceEventId: `${sessionId}:${index}`,
              projectKey,
              repoPath,
              capturedAt: timestamp,
              occurredAt: timestamp,
              sessionId,
              payload: {
                kind: `${payload.role}-message`,
                title: extractTextContent(payload.content),
                text: extractTextContent(payload.content)
              }
            });
          }

          if (payload?.type === 'function_call') {
            events.push({
              id: `codex:${sessionId}:tool:${index}`,
              sourceFamily: 'codex',
              connectorId: 'codex-rollout-jsonl',
              provenanceTier: 'primary',
              sourceEventId: `${sessionId}:tool:${index}`,
              projectKey,
              repoPath,
              capturedAt: timestamp,
              occurredAt: timestamp,
              sessionId,
              payload: {
                kind: 'tool-use',
                title: String(payload.name ?? 'tool use'),
                summary: String(payload.arguments ?? '')
              }
            });
          }

          if (payload?.type === 'function_call_output') {
            events.push({
              id: `codex:${sessionId}:tool-output:${index}`,
              sourceFamily: 'codex',
              connectorId: 'codex-rollout-jsonl',
              provenanceTier: 'primary',
              sourceEventId: `${sessionId}:tool-output:${index}`,
              projectKey,
              repoPath,
              capturedAt: timestamp,
              occurredAt: timestamp,
              sessionId,
              payload: {
                kind: 'tool-result',
                title: 'Tool result',
                summary: String(payload.output ?? '')
              }
            });
          }
        });
      }

      checkpoints.push({
        connectorId: 'codex-rollout-jsonl',
        scopeKey: root,
        cursorToken: String(files.length),
        updatedAt: Date.now()
      });
    }

    return { events, checkpoints };
  }
};
