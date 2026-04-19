import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { ProgressTree } from '@/components/projects/ProgressTree';
import type { ProjectProgressTree } from '@/server/workspace/projectTree';

const NOW = new Date('2026-04-18T12:00:00Z').getTime();
const DAY = 86_400_000;

function makeTree(overrides: Partial<ProjectProgressTree> = {}): ProjectProgressTree {
  return {
    projectKey: 'waybook',
    axisStart: NOW - 10 * DAY,
    axisEnd: NOW - 1 * DAY,
    counts: { total: 2, inProgress: 1, waiting: 0, dormant: 0, completed: 1 },
    threads: [
      {
        threadKey: 'project:waybook:alpha',
        label: 'Alpha thread — pulse surface',
        projectKey: 'waybook',
        status: 'completed',
        firstEventAt: NOW - 10 * DAY,
        lastEventAt: NOW - 2 * DAY,
        eventCount: 4,
        importanceScore: 0.8,
        keyEvents: [
          {
            id: 'e1',
            title: 'Alpha kickoff',
            at: NOW - 10 * DAY,
            importance: 0.4,
            sourceFamily: 'git',
            role: 'first'
          },
          {
            id: 'e2',
            title: 'Alpha landmark — big jump',
            at: NOW - 6 * DAY,
            importance: 0.95,
            sourceFamily: 'codex',
            role: 'peak'
          },
          {
            id: 'e3',
            title: 'Merged into main',
            at: NOW - 2 * DAY,
            importance: 0.7,
            sourceFamily: 'git',
            role: 'last'
          }
        ],
        linkedEntities: [
          { slug: 'pulse-surface', title: 'Pulse surface', entityType: 'topic' }
        ]
      },
      {
        threadKey: 'project:waybook:beta',
        label: 'Beta follow-up',
        projectKey: 'waybook',
        status: 'in-progress',
        firstEventAt: NOW - 4 * DAY,
        lastEventAt: NOW - 1 * DAY,
        eventCount: 2,
        importanceScore: 0.6,
        keyEvents: [
          {
            id: 'b1',
            title: 'Beta start',
            at: NOW - 4 * DAY,
            importance: 0.5,
            sourceFamily: 'claude',
            role: 'first'
          }
        ],
        linkedEntities: []
      }
    ],
    ...overrides
  };
}

describe('ProgressTree', () => {
  it('renders the heading, status counts, and anchor rows', () => {
    const html = renderToString(<ProgressTree tree={makeTree()} lang="en" />);
    expect(html).toContain('Project Lifeline');
    expect(html).toContain('1 moving');
    expect(html).toContain('Alpha landmark');
    expect(html).toContain('Merged into main');
    expect(html).toContain('first');
    expect(html).toContain('peak');
    expect(html).toContain('last');
    // linked entity pill
    expect(html).toContain('Pulse surface');
  });

  it('renders Chinese labels', () => {
    const html = renderToString(<ProgressTree tree={makeTree()} lang="zh" />);
    expect(html).toContain('项目生命线');
    expect(html).toContain('推进');
    expect(html).toContain('完成');
    expect(html).toContain('起点');
    expect(html).toContain('峰值');
  });

  it('shows the empty fallback when the tree has no threads', () => {
    const empty = makeTree({
      threads: [],
      counts: { total: 0, inProgress: 0, waiting: 0, dormant: 0, completed: 0 }
    });
    const html = renderToString(<ProgressTree tree={empty} lang="en" />);
    expect(html).toContain('No thread data yet');
  });
});
