import { describe, expect, it } from 'vitest';
import { normalizeRawSourceEvent } from '@/server/events/normalizer';

describe('normalizeRawSourceEvent', () => {
  it('maps a git raw event into a timeline-ready research event', () => {
    const event = normalizeRawSourceEvent({
      id: 'raw-git-1',
      sourceFamily: 'git',
      connectorId: 'git-log',
      provenanceTier: 'primary',
      sourceEventId: 'commit-1',
      projectKey: 'waybook',
      repoPath: '/repo/waybook',
      capturedAt: 1_710_000_100_000,
      occurredAt: 1_710_000_000_000,
      payload: {
        kind: 'commit',
        message: 'feat: add timeline service',
        changedFiles: ['src/server/search/timelineService.ts']
      }
    });

    expect(event.eventType).toBe('git.commit');
    expect(event.title).toBe('feat: add timeline service');
    expect(event.actorKind).toBe('user');
    expect(event.tags).toEqual(expect.arrayContaining(['git', 'primary']));
    expect(event.files).toContain('src/server/search/timelineService.ts');
  });
});
