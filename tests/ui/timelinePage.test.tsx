import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import TimelinePage from '@/app/timeline/page';

describe('TimelinePage', () => {
  it('renders the refreshed research timeline framing with representative events', async () => {
    const html = renderToString(await TimelinePage({}));

    expect(html).toContain('Research Timeline');
    expect(html).toContain('Evidence from every connector');
    expect(html).toContain('Latest Research Activity');
    expect(html).toContain('Executed the first timeline test run');
    expect(html).toContain('codex');
  });

  it('shows active filter context when query params are present', async () => {
    const html = renderToString(
      await TimelinePage({
        searchParams: Promise.resolve({
          q: 'timeline',
          project: 'waybook',
          source: 'codex'
        })
      })
    );

    expect(html).toContain('Active Filters');
    expect(html).toContain('Search: timeline');
    expect(html).toContain('Project: waybook');
    expect(html).toContain('Source: codex');
    expect(html).toContain('Executed the first timeline test run');
    expect(html).not.toContain('Defined the mixed connector model');
  });

  it('applies scope filtering from query params', async () => {
    const html = renderToString(
      await TimelinePage({
        searchParams: Promise.resolve({
          scopeKind: 'repo',
          scopeValue: '/workspace/waybook',
          scopeLabel: 'Waybook Repo'
        })
      })
    );

    expect(html).toContain('Scope: Waybook Repo');
    expect(html).toContain('Executed the first timeline test run');
  });
});
