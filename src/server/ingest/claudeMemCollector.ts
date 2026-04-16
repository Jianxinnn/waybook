import { execFile } from 'node:child_process';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import Database from 'better-sqlite3';
import type { CollectResult, SourceCollector } from '@/types/source';
import type { RawSourceEventInput } from '@/types/source';
import { resolveProjectForPath } from '@/lib/projectRegistry';
import { pathExists, toProjectKey } from './shared';

const execFileAsync = promisify(execFile);

type ObservationRow = {
  id: number;
  memory_session_id: string;
  project: string;
  title: string | null;
  narrative: string | null;
  text: string | null;
  created_at_epoch: number;
};

type SessionSummaryRow = {
  id: number;
  memory_session_id: string;
  project: string;
  request: string | null;
  learned: string | null;
  completed: string | null;
  next_steps: string | null;
  created_at_epoch: number;
};

type SdkSessionRow = {
  id: number;
  content_session_id: string;
  memory_session_id: string | null;
  project: string;
  user_prompt: string | null;
  started_at_epoch: number;
};

type UserPromptRow = {
  id: number;
  content_session_id: string;
  prompt_number: number;
  prompt_text: string;
  created_at_epoch: number;
};

type PendingMessageRow = {
  id: number;
  content_session_id: string;
  message_type: string;
  tool_name: string | null;
  last_user_message: string | null;
  created_at_epoch: number;
};

async function buildPrimaryClaudeMemEvents(
  config: { projectRegistryPath: string },
  observations: ObservationRow[],
  sessionSummaries: SessionSummaryRow[]
) {
  const events: RawSourceEventInput[] = [];

  for (const row of observations) {
    const repoPath = row.project;
    const { projectKey } = await resolveProjectForPath(config as any, repoPath);
    events.push({
      id: `claude-mem:observation:${row.id}`,
      sourceFamily: 'claude',
      connectorId: 'claude-mem-sqlite',
      provenanceTier: 'derived',
      sourceEventId: `observation:${row.id}`,
      projectKey,
      repoPath,
      capturedAt: row.created_at_epoch,
      occurredAt: row.created_at_epoch,
      sessionId: row.memory_session_id,
      payload: {
        kind: 'observation',
        title: row.title ?? row.text ?? 'Observation',
        narrative: row.narrative ?? row.text ?? ''
      }
    });
  }

  for (const row of sessionSummaries) {
    const repoPath = row.project;
    const { projectKey } = await resolveProjectForPath(config as any, repoPath);
    events.push({
      id: `claude-mem:summary:${row.id}`,
      sourceFamily: 'claude',
      connectorId: 'claude-mem-sqlite',
      provenanceTier: 'derived',
      sourceEventId: `session-summary:${row.id}`,
      projectKey,
      repoPath,
      capturedAt: row.created_at_epoch,
      occurredAt: row.created_at_epoch,
      sessionId: row.memory_session_id,
      payload: {
        kind: 'session-summary',
        title: row.request ?? 'Session summary',
        learned: row.learned ?? '',
        completed: row.completed ?? '',
        summary: row.completed ?? row.learned ?? row.next_steps ?? ''
      }
    });
  }

  return events;
}

async function buildFallbackClaudeMemEvents(
  config: { projectRegistryPath: string },
  sessions: SdkSessionRow[],
  prompts: UserPromptRow[],
  pendingMessages: PendingMessageRow[]
) {
  const events: RawSourceEventInput[] = [];
  const sessionsById = new Map(sessions.map((row) => [row.content_session_id, row]));

  for (const row of sessions) {
    const repoPath = row.project || 'claude-mem';
    const { projectKey } = await resolveProjectForPath(config as any, repoPath);
    events.push({
      id: `claude-mem:session:${row.content_session_id}`,
      sourceFamily: 'claude',
      connectorId: 'claude-mem-sqlite',
      provenanceTier: 'derived',
      sourceEventId: `session:${row.content_session_id}`,
      projectKey,
      repoPath,
      capturedAt: row.started_at_epoch,
      occurredAt: row.started_at_epoch,
      sessionId: row.content_session_id,
      payload: {
        kind: 'session-start',
        title: row.user_prompt ?? 'Claude session',
        summary: row.user_prompt ?? ''
      }
    });
  }

  for (const row of prompts) {
    const session = sessionsById.get(row.content_session_id);
    const repoPath = session?.project || 'claude-mem';
    const { projectKey } = await resolveProjectForPath(config as any, repoPath);
    events.push({
      id: `claude-mem:prompt:${row.id}`,
      sourceFamily: 'claude',
      connectorId: 'claude-mem-sqlite',
      provenanceTier: 'derived',
      sourceEventId: `user-prompt:${row.id}`,
      projectKey,
      repoPath,
      capturedAt: row.created_at_epoch,
      occurredAt: row.created_at_epoch,
      sessionId: row.content_session_id,
      payload: {
        kind: 'user-prompt',
        title: row.prompt_text,
        summary: row.prompt_text,
        promptNumber: row.prompt_number
      }
    });
  }

  for (const row of pendingMessages) {
    const session = sessionsById.get(row.content_session_id);
    const repoPath = session?.project || 'claude-mem';
    const { projectKey } = await resolveProjectForPath(config as any, repoPath);
    events.push({
      id: `claude-mem:pending:${row.id}`,
      sourceFamily: 'claude',
      connectorId: 'claude-mem-sqlite',
      provenanceTier: 'derived',
      sourceEventId: `pending-message:${row.id}`,
      projectKey,
      repoPath,
      capturedAt: row.created_at_epoch,
      occurredAt: row.created_at_epoch,
      sessionId: row.content_session_id,
      payload: {
        kind: 'pending-message',
        title: row.tool_name ?? row.message_type,
        summary: row.last_user_message ?? ''
      }
    });
  }

  return events;
}

async function readClaudeMemEventsFromDatabase(
  config: { projectRegistryPath: string },
  sqlite: Database.Database
) {
  const observations = sqlite
    .prepare(
      `select id, memory_session_id, project, title, narrative, text, created_at_epoch from observations`
    )
    .all() as ObservationRow[];

  const sessionSummaries = sqlite
    .prepare(
      `select id, memory_session_id, project, request, learned, completed, next_steps, created_at_epoch from session_summaries`
    )
    .all() as SessionSummaryRow[];

  const primaryEvents = await buildPrimaryClaudeMemEvents(config, observations, sessionSummaries);
  if (primaryEvents.length > 0) {
    return primaryEvents;
  }

  const sessions = sqlite
    .prepare(
      `select id, content_session_id, memory_session_id, project, user_prompt, started_at_epoch from sdk_sessions`
    )
    .all() as SdkSessionRow[];
  const prompts = sqlite
    .prepare(
      `select id, content_session_id, prompt_number, prompt_text, created_at_epoch from user_prompts`
    )
    .all() as UserPromptRow[];
  const pendingMessages = sqlite
    .prepare(
      `select id, content_session_id, message_type, tool_name, last_user_message, created_at_epoch from pending_messages`
    )
    .all() as PendingMessageRow[];

  return buildFallbackClaudeMemEvents(config, sessions, prompts, pendingMessages);
}

async function recoverClaudeMemDatabase(sourcePath: string) {
  const cacheDir = path.join(process.cwd(), 'data', 'cache');
  const recoveredPath = path.join(
    cacheDir,
    `claude-mem-recovered-${process.pid}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}.sqlite`
  );

  await mkdir(cacheDir, { recursive: true });

  const shellQuote = (value: string) => `'${value.replace(/'/g, `'\\''`)}'`;
  await execFileAsync(
    'bash',
    [
      '-lc',
      `sqlite3 ${shellQuote(sourcePath)} ".recover" | sqlite3 ${shellQuote(recoveredPath)}`
    ],
    {
      maxBuffer: 64 * 1024 * 1024
    }
  );

  return recoveredPath;
}

export const claudeMemCollector: SourceCollector = {
  sourceFamily: 'claude',
  connectorId: 'claude-mem-sqlite',
  async collect({ config }): Promise<CollectResult> {
    if (!(await pathExists(config.claudeMemDbPath))) {
      return { events: [], checkpoints: [] };
    }

    try {
      const sqlite = new Database(config.claudeMemDbPath, { readonly: true });
      const events = await readClaudeMemEventsFromDatabase(config, sqlite);

      sqlite.close();

      return {
        events,
        checkpoints: [
          {
            connectorId: 'claude-mem-sqlite',
            scopeKey: config.claudeMemDbPath,
            cursorToken: String(events.length),
            updatedAt: Date.now()
          }
        ]
      };
    } catch (error) {
      console.warn(
        `[waybook] primary claude-mem read failed, trying recovery: ${
          error instanceof Error ? error.message : String(error)
        }`
      );

      try {
        const recoveredPath = await recoverClaudeMemDatabase(config.claudeMemDbPath);
        const recoveredDb = new Database(recoveredPath, { readonly: true });
        let events: RawSourceEventInput[] = [];
        try {
          events = await readClaudeMemEventsFromDatabase(config, recoveredDb);
        } finally {
          recoveredDb.close();
          await rm(recoveredPath, { force: true });
        }

        return {
          events,
          checkpoints: [
            {
              connectorId: 'claude-mem-sqlite',
              scopeKey: config.claudeMemDbPath,
              cursorToken: String(events.length),
              updatedAt: Date.now()
            }
          ]
        };
      } catch (recoveryError) {
        console.warn(
          `[waybook] skipping claude-mem collector: ${
            recoveryError instanceof Error ? recoveryError.message : String(recoveryError)
          }`
        );
        return { events: [], checkpoints: [] };
      }
    }
  }
};
