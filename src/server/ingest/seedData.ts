import type { RawSourceEventInput } from '../../types/source'

const projectKey = 'waybook-m1'
const repoPath = '/public/home/jxtang/project/cs/waybook/.worktrees/waybook-m1'

export const seededRawSourceEvents: Record<RawSourceEventInput['source'], RawSourceEventInput> = {
  'claude-mem': {
    id: 'raw-mem-bootstrap',
    source: 'claude-mem',
    sourceEventId: 'memory-waybook-bootstrap',
    projectKey,
    repoPath,
    capturedAt: 1713322800000,
    payload: {
      eventType: 'claude-mem.note',
      title: 'Capture the M1 bootstrap path',
      summary: 'Pin the minimum pipeline needed to make the app useful on first launch.',
      tags: ['bootstrap', 'memory'],
      files: ['src/server/bootstrap/pipeline.ts'],
      importanceScore: 2,
    },
  },
  codex: {
    id: 'raw-codex-dashboard',
    source: 'codex',
    sourceEventId: 'session-waybook-dashboard',
    projectKey,
    repoPath,
    capturedAt: 1713326400000,
    payload: {
      eventType: 'codex.task',
      title: 'Wire dashboard to seeded pipeline',
      summary: 'Connected the home and timeline surfaces to the bootstrap pipeline.',
      tags: ['dashboard', 'timeline'],
      files: ['src/app/page.tsx', 'src/app/timeline/page.tsx'],
      importanceScore: 3,
    },
  },
  git: {
    id: 'raw-git-bootstrap',
    source: 'git',
    sourceEventId: 'commit-seeded-happy-path',
    projectKey,
    repoPath,
    capturedAt: 1713330000000,
    payload: {
      message: 'feat: wire seeded M1 happy path',
      summary: 'Normalized seeded source events into live project and topic views.',
      tags: ['pipeline'],
      files: ['src/server/ingest/sourceRegistry.ts', 'src/server/wiki/entityCompiler.ts'],
      importanceScore: 4,
    },
  },
  experiment: {
    id: 'raw-exp-obsidian',
    source: 'experiment',
    sourceEventId: 'run-obsidian-export-smoke',
    projectKey,
    repoPath,
    capturedAt: 1713333600000,
    payload: {
      eventType: 'experiment.run',
      title: 'Validate Obsidian export keeps manual notes',
      summary: 'Keep manual notes safe during Obsidian re-export.',
      tags: ['obsidian', 'export'],
      files: ['src/server/jobs/exportToObsidian.ts'],
      importanceScore: 5,
    },
  },
}
