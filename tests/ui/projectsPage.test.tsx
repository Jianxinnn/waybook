import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import ProjectsPage from '@/app/projects/page';

describe('ProjectsPage', () => {
  it('renders the projects workspace sections for the current scope', async () => {
    const html = renderToString(await ProjectsPage({}));

    expect(html).toContain('Projects');
    expect(html).toContain('In Motion');
    expect(html).toContain('Portfolio');
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('waybook');
  });

  it('preserves scope on project detail links', async () => {
    const html = renderToString(
      await ProjectsPage({
        searchParams: Promise.resolve({
          scopeKind: 'project',
          scopeValue: 'waybook',
          scopeLabel: 'Waybook'
        })
      })
    );

    expect(html).toContain('/projects/waybook?scopeKind=project&amp;scopeValue=waybook&amp;scopeLabel=Waybook');
  });
});
