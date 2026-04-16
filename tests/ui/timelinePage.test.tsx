import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { TimelineList } from '@/components/timeline/TimelineList';

describe('TimelineList', () => {
  it('renders events with source and project metadata', () => {
    const html = renderToString(
      <TimelineList
        items={[
          {
            id: 'event-1',
            title: 'feat: add timeline service',
            summary: 'Adds the timeline query service.',
            eventType: 'git.commit',
            projectKey: 'waybook',
            occurredAt: 1_710_000_000_000,
            sourceFamily: 'git',
            provenanceTier: 'primary',
            tags: ['git', 'primary'],
            files: ['src/server/search/timelineService.ts']
          }
        ]}
      />
    );

    expect(html).toContain('feat: add timeline service');
    expect(html).toContain('waybook');
    expect(html).toContain('git.commit');
  });
});
