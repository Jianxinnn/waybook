import path from 'node:path';
import type { CollectResult, SourceCollector } from '@/types/source';
import type { CollectorCheckpointState, RawSourceEventInput } from '@/types/source';
import { resolveProjectForPath } from '@/lib/projectRegistry';
import { extractTextContent, pathExists, readJsonLines, toProjectKey, walkFiles } from './shared';

export const claudeCollector: SourceCollector = {
  sourceFamily: 'claude',
  connectorId: 'claude-cli-jsonl',
  async collect({ config }): Promise<CollectResult> {
    const events: RawSourceEventInput[] = [];
    const checkpoints: CollectorCheckpointState[] = [];

    for (const root of config.claudeProjectsRoots) {
      if (!(await pathExists(root))) {
        continue;
      }

      const files = (await walkFiles(root)).filter((filePath) => filePath.endsWith('.jsonl'));

      for (const filePath of files) {
        const lines = await readJsonLines(filePath);
        const sessionId = String(lines.find((line) => line.sessionId)?.sessionId ?? path.basename(filePath, '.jsonl'));
        const repoPath =
          String(lines.find((line) => typeof line.cwd === 'string')?.cwd ?? path.dirname(filePath));
        const { projectKey } = await resolveProjectForPath(config, repoPath);

        lines.forEach((line, index) => {
          const payload = line.payload as Record<string, unknown> | undefined;
          const role = typeof payload?.role === 'string' ? payload.role : undefined;
          const itemType = typeof payload?.type === 'string' ? payload.type : undefined;
          const timestamp = Date.parse(String(line.timestamp ?? new Date().toISOString()));

          if (itemType === 'message' && role) {
            events.push({
              id: `claude:${sessionId}:${index}`,
              sourceFamily: 'claude',
              connectorId: 'claude-cli-jsonl',
              provenanceTier: 'primary',
              sourceEventId: `${sessionId}:${index}`,
              projectKey,
              repoPath,
              capturedAt: timestamp,
              occurredAt: timestamp,
              sessionId,
              payload: {
                kind: `${role}-message`,
                title: extractTextContent((payload as Record<string, unknown>).content),
                text: extractTextContent((payload as Record<string, unknown>).content)
              }
            });
          }

          if (line.type === 'event_msg' && payload?.type === 'tool_use') {
            events.push({
              id: `claude:${sessionId}:tool:${index}`,
              sourceFamily: 'claude',
              connectorId: 'claude-cli-jsonl',
              provenanceTier: 'primary',
              sourceEventId: `${sessionId}:tool:${index}`,
              projectKey,
              repoPath,
              capturedAt: timestamp,
              occurredAt: timestamp,
              sessionId,
              payload: {
                kind: 'tool-use',
                title: String(payload.tool_name ?? 'tool use'),
                summary: String(payload.input ?? '')
              }
            });
          }
        });
      }

      checkpoints.push({
        connectorId: 'claude-cli-jsonl',
        scopeKey: root,
        cursorToken: String(files.length),
        updatedAt: Date.now()
      });
    }

    return { events, checkpoints };
  }
};
