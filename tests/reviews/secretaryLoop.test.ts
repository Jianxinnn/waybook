import { afterEach, describe, expect, it } from 'vitest';
import Database from 'better-sqlite3';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createWaybookConfig } from '@/lib/config';
import { createDatabaseClient } from '@/server/db/client';
import { runIngestJob } from '@/server/jobs/ingestJob';
import { runExportJob } from '@/server/jobs/exportJob';
import { runSecretaryLoop } from '@/server/jobs/secretaryLoopJob';
import { listReviewDrafts } from '@/server/reviews/reviewStore';

const execFileAsync = promisify(execFile);
const tempPaths: string[] = [];

async function makeTempDir(prefix: string) {
  const dir = await mkdtemp(path.join(tmpdir(), prefix));
  tempPaths.push(dir);
  return dir;
}

afterEach(async () => {
  await Promise.all(tempPaths.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe('runSecretaryLoop', () => {
  it('persists daily and weekly drafts and exports them as markdown without requiring an LLM', async () => {
    const root = await makeTempDir('waybook-m2-');
    const dbPath = path.join(root, 'waybook.sqlite');
    const exportRoot = path.join(root, 'obsidian');
    const repoDir = path.join(root, 'repo');
    const experimentsRoot = path.join(root, 'experiments');
    const memDbPath = path.join(root, 'claude-mem.db');

    await mkdir(repoDir, { recursive: true });
    await execFileAsync('git', ['init'], { cwd: repoDir });
    await execFileAsync('git', ['config', 'user.email', 'waybook@example.com'], { cwd: repoDir });
    await execFileAsync('git', ['config', 'user.name', 'Waybook'], { cwd: repoDir });
    await writeFile(path.join(repoDir, 'README.md'), '# waybook secretary\n');
    await execFileAsync('git', ['add', 'README.md'], { cwd: repoDir });
    await execFileAsync('git', ['commit', '-m', 'feat: add secretary readme'], { cwd: repoDir });

    await mkdir(path.join(experimentsRoot, 'digest-eval'), { recursive: true });
    await writeFile(
      path.join(experimentsRoot, 'digest-eval', 'metrics.json'),
      JSON.stringify({ accuracy: 0.93 }, null, 2)
    );
    await writeFile(path.join(experimentsRoot, 'digest-eval', 'summary.md'), '# Digest Eval\nReady.\n');

    const memDb = new Database(memDbPath);
    memDb.exec(`
      create table sdk_sessions (
        id integer primary key autoincrement,
        content_session_id text unique not null,
        memory_session_id text unique,
        project text not null,
        platform_source text not null default 'claude',
        user_prompt text,
        started_at text not null,
        started_at_epoch integer not null,
        completed_at text,
        completed_at_epoch integer,
        status text not null default 'completed'
      );
      create table observations (
        id integer primary key autoincrement,
        memory_session_id text not null,
        project text not null,
        text text,
        type text not null,
        title text,
        subtitle text,
        facts text,
        narrative text,
        concepts text,
        files_read text,
        files_modified text,
        prompt_number integer,
        discovery_tokens integer default 0,
        created_at text not null,
        created_at_epoch integer not null
      );
      create table session_summaries (
        id integer primary key autoincrement,
        memory_session_id text not null,
        project text not null,
        request text,
        investigated text,
        learned text,
        completed text,
        next_steps text,
        files_read text,
        files_edited text,
        notes text,
        prompt_number integer,
        discovery_tokens integer default 0,
        created_at text not null,
        created_at_epoch integer not null
      );
    `);
    memDb.prepare(
      'insert into sdk_sessions (content_session_id, memory_session_id, project, started_at, started_at_epoch) values (?, ?, ?, ?, ?)'
    ).run('content-1', 'memory-1', 'waybook', '2026-04-16T06:00:00Z', 1_776_320_400_000);
    memDb.prepare(
      'insert into session_summaries (memory_session_id, project, request, learned, completed, next_steps, created_at, created_at_epoch) values (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(
      'memory-1',
      'waybook',
      'Implement M2',
      'Need a secretary loop on top of M1.',
      'Added daily and weekly drafts.',
      'Refine promotion suggestions.',
      '2026-04-16T06:10:00Z',
      1_776_321_000_000
    );
    memDb.close();

    const config = createWaybookConfig({
      databasePath: dbPath,
      exportRoot,
      claudeProjectsRoots: [path.resolve('tests/fixtures/claude-project')],
      codexSessionsRoots: [path.resolve('tests/fixtures/codex-sessions')],
      repoRoots: [repoDir],
      experimentRoots: [experimentsRoot],
      claudeMemDbPath: memDbPath,
      seededSourcesEnabled: true
    });

    await runIngestJob(config);
    const reviewResult = await runSecretaryLoop(config, {
      now: Date.parse('2026-04-16T23:30:00Z'),
      useLlm: false
    });
    const client = createDatabaseClient(config.databasePath);
    const drafts = await listReviewDrafts(client);
    const exportResult = await runExportJob(config, client);

    expect(reviewResult.generated.length).toBe(3);
    expect(drafts.map((draft) => draft.reviewType)).toEqual(
      expect.arrayContaining(['daily-brief', 'daily-review', 'weekly-review'])
    );
    expect(drafts.some((draft) => draft.promotionSuggestions.length > 0)).toBe(true);
    expect(exportResult.filesWritten.some((filePath) => filePath.includes('/reviews/'))).toBe(true);
  });
});
