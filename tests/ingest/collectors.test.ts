import { afterEach, describe, expect, it } from 'vitest';
import Database from 'better-sqlite3';
import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createWaybookConfig } from '@/lib/config';
import { claudeCollector } from '@/server/ingest/claudeCollector';
import { claudeMemCollector } from '@/server/ingest/claudeMemCollector';
import { codexCollector } from '@/server/ingest/codexCollector';
import { experimentCollector } from '@/server/ingest/experimentCollector';
import { gitCollector } from '@/server/ingest/gitCollector';
import { seedCollector } from '@/server/ingest/seedCollector';

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

describe('collectors', () => {
  it('reads Claude session JSONL files as primary events', async () => {
    const config = createWaybookConfig({
      claudeProjectsRoots: [path.resolve('tests/fixtures/claude-project')]
    });

    const result = await claudeCollector.collect({ config, checkpoints: new Map() });

    expect(result.events[0]).toMatchObject({
      sourceFamily: 'claude',
      connectorId: 'claude-cli-jsonl',
      provenanceTier: 'primary',
      sessionId: 'claude-session-1'
    });
  });

  it('reads Codex rollout JSONL files as primary events', async () => {
    const config = createWaybookConfig({
      codexSessionsRoots: [path.resolve('tests/fixtures/codex-sessions')]
    });

    const result = await codexCollector.collect({ config, checkpoints: new Map() });

    expect(result.events[0]).toMatchObject({
      sourceFamily: 'codex',
      connectorId: 'codex-rollout-jsonl',
      provenanceTier: 'primary',
      sessionId: 'codex-session-1'
    });
  });

  it('reads git history and changed files from a repository', async () => {
    const repoDir = await makeTempDir('waybook-git-');
    await execFileAsync('git', ['init'], { cwd: repoDir });
    await execFileAsync('git', ['config', 'user.email', 'waybook@example.com'], { cwd: repoDir });
    await execFileAsync('git', ['config', 'user.name', 'Waybook'], { cwd: repoDir });
    await writeFile(path.join(repoDir, 'README.md'), '# test\n');
    await execFileAsync('git', ['add', 'README.md'], { cwd: repoDir });
    await execFileAsync('git', ['commit', '-m', 'feat: initial commit'], { cwd: repoDir });

    const config = createWaybookConfig({
      repoRoots: [repoDir]
    });

    const result = await gitCollector.collect({ config, checkpoints: new Map() });

    expect(result.events[0]).toMatchObject({
      sourceFamily: 'git',
      connectorId: 'git-log',
      provenanceTier: 'primary',
      projectKey: path.basename(repoDir).toLowerCase()
    });
    expect(result.events[0].payload.changedFiles).toContain('README.md');
  });

  it('indexes experiment summaries and metrics files from the filesystem', async () => {
    const experimentsRoot = await makeTempDir('waybook-experiments-');
    const runDir = path.join(experimentsRoot, 'run-a');
    await mkdir(runDir, { recursive: true });
    await writeFile(path.join(runDir, 'metrics.json'), JSON.stringify({ accuracy: 0.92 }, null, 2));
    await writeFile(path.join(runDir, 'summary.md'), '# Run A\nImproved accuracy.\n');

    const config = createWaybookConfig({
      experimentRoots: [experimentsRoot]
    });

    const result = await experimentCollector.collect({ config, checkpoints: new Map() });

    expect(result.events.map((event) => event.payload.kind)).toEqual(
      expect.arrayContaining(['metrics', 'summary'])
    );
  });

  it('reads claude-mem summaries and observations as derived events', async () => {
    const memDir = await makeTempDir('waybook-claude-mem-');
    const dbPath = path.join(memDir, 'claude-mem.db');
    const db = new Database(dbPath);
    db.exec(`
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
    db.prepare(
      'insert into sdk_sessions (content_session_id, memory_session_id, project, started_at, started_at_epoch) values (?, ?, ?, ?, ?)'
    ).run('content-1', 'memory-1', 'waybook', '2026-04-16T06:00:00Z', 1_713_246_400_000);
    db.prepare(
      'insert into observations (memory_session_id, project, text, type, title, narrative, created_at, created_at_epoch) values (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(
      'memory-1',
      'waybook',
      'Normalized the collector schema.',
      'observation',
      'Collector schema updated',
      'Normalized the collector schema.',
      '2026-04-16T06:05:00Z',
      1_713_246_700_000
    );
    db.prepare(
      'insert into session_summaries (memory_session_id, project, request, learned, completed, next_steps, created_at, created_at_epoch) values (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(
      'memory-1',
      'waybook',
      'Implement M1',
      'Need separated provenance tiers.',
      'Updated the design.',
      'Build the collectors.',
      '2026-04-16T06:10:00Z',
      1_713_247_000_000
    );
    db.close();

    const config = createWaybookConfig({
      claudeMemDbPath: dbPath
    });

    const result = await claudeMemCollector.collect({ config, checkpoints: new Map() });

    expect(result.events.map((event) => event.payload.kind)).toEqual(
      expect.arrayContaining(['observation', 'session-summary'])
    );
    expect(result.events[0].provenanceTier).toBe('derived');
  });

  it('falls back to claude-mem sessions, prompts, and pending messages when summaries are unavailable', async () => {
    const memDir = await makeTempDir('waybook-claude-mem-fallback-');
    const dbPath = path.join(memDir, 'claude-mem.db');
    const db = new Database(dbPath);
    db.exec(`
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
      create table user_prompts (
        id integer primary key autoincrement,
        content_session_id text not null,
        prompt_number integer not null,
        prompt_text text not null,
        created_at text not null,
        created_at_epoch integer not null
      );
      create table pending_messages (
        id integer primary key autoincrement,
        session_db_id integer not null,
        content_session_id text not null,
        message_type text not null,
        tool_name text,
        tool_input text,
        tool_response text,
        cwd text,
        last_user_message text,
        last_assistant_message text,
        prompt_number integer,
        status text not null default 'pending',
        retry_count integer not null default 0,
        created_at_epoch integer not null
      );
    `);
    db.prepare(
      'insert into sdk_sessions (id, content_session_id, memory_session_id, project, user_prompt, started_at, started_at_epoch) values (?, ?, ?, ?, ?, ?, ?)'
    ).run(
      1,
      'content-2',
      'memory-2',
      '/repo/waybook',
      'Implement the daily brief',
      '2026-04-16T06:00:00Z',
      1_713_246_400_000
    );
    db.prepare(
      'insert into user_prompts (content_session_id, prompt_number, prompt_text, created_at, created_at_epoch) values (?, ?, ?, ?, ?)'
    ).run(
      'content-2',
      1,
      'How should the daily brief differ from the weekly review?',
      '2026-04-16T06:01:00Z',
      1_713_246_460_000
    );
    db.prepare(
      'insert into pending_messages (session_db_id, content_session_id, message_type, tool_name, last_user_message, created_at_epoch) values (?, ?, ?, ?, ?, ?)'
    ).run(
      1,
      'content-2',
      'observation',
      'exec_command',
      'Inspect the review pipeline',
      1_713_246_470_000
    );
    db.close();

    const config = createWaybookConfig({
      claudeMemDbPath: dbPath
    });

    const result = await claudeMemCollector.collect({ config, checkpoints: new Map() });
    const kinds = result.events.map((event) => event.payload.kind);

    expect(kinds).toEqual(expect.arrayContaining(['session-start', 'user-prompt', 'pending-message']));
  });

  it('skips a malformed claude-mem database instead of aborting ingestion', async () => {
    const memDir = await makeTempDir('waybook-claude-mem-bad-');
    const dbPath = path.join(memDir, 'claude-mem.db');
    await writeFile(dbPath, 'not-a-real-sqlite-database');

    const config = createWaybookConfig({
      claudeMemDbPath: dbPath
    });

    const result = await claudeMemCollector.collect({ config, checkpoints: new Map() });

    expect(result.events).toEqual([]);
    expect(result.checkpoints).toEqual([]);
  });

  it('returns synthetic demo events from the seed collector', async () => {
    const config = createWaybookConfig({
      seededSourcesEnabled: true
    });

    const result = await seedCollector.collect({ config, checkpoints: new Map() });

    expect(result.events.length).toBeGreaterThan(0);
    expect(result.events.every((event) => event.provenanceTier === 'synthetic')).toBe(true);
  });
});
