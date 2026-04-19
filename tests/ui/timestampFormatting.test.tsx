import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { ProjectSummaryCard } from '@/components/projects/ProjectSummaryCard';
import { TimelineList } from '@/components/timeline/TimelineList';

describe('timestamp formatting', () => {
  it('renders readable research timestamps instead of ISO-like strings', () => {
    const html = renderToString(
      <div>
        <ProjectSummaryCard
          summary={{
            projectKey: 'waybook',
            eventCount: 3,
            entityCount: 2,
            lastEventAt: Date.parse('2024-04-16T05:55:00Z'),
            highlights: ['Executed the first timeline test run']
          }}
        />
        <TimelineList
          items={[
            {
              id: 'event-1',
              title: 'Executed the first timeline test run',
              summary: 'Validated the timeline route.',
              eventType: 'codex.tool-use',
              projectKey: 'waybook',
              occurredAt: Date.parse('2024-04-16T05:55:00Z'),
              sourceFamily: 'codex',
              provenanceTier: 'synthetic',
              tags: ['timeline'],
              files: []
            }
          ]}
        />
      </div>
    );

    expect(html).not.toContain('2024-04-16 05:55');
    expect(html).toMatch(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{1,2}, 2024/);
  });
});
