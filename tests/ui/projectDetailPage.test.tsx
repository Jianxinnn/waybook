import { describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import ProjectDetailPage from '@/app/projects/[projectKey]/page';

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  }
}));

describe('ProjectDetailPage', () => {
  it('renders the expected project detail sections', async () => {
    const html = renderToString(
      await ProjectDetailPage({
        params: Promise.resolve({ projectKey: 'waybook' })
      })
    );

    expect(html).toContain('Project Detail');
    expect(html).toContain('Recent Evidence');
    expect(html).toContain('Active Threads');
    expect(html).toContain('Stalled Threads');
    expect(html).toContain('Repeated Patterns');
    expect(html).toContain('Waybook');
    expect(html).toContain('Executed the first timeline test run');
  });

  it('preserves scope on project detail page links', async () => {
    const html = renderToString(
      await ProjectDetailPage({
        params: Promise.resolve({ projectKey: 'waybook' }),
        searchParams: Promise.resolve({
          scopeKind: 'project',
          scopeValue: 'waybook',
          scopeLabel: 'Waybook'
        })
      })
    );

    expect(html).toContain('Scope: Waybook');
    expect(html).toContain('/timeline?project=waybook&amp;scopeKind=project&amp;scopeValue=waybook&amp;scopeLabel=Waybook');
  });

  it('throws not found for missing projects', async () => {
    await expect(
      ProjectDetailPage({
        params: Promise.resolve({ projectKey: 'missing-project' })
      })
    ).rejects.toThrow('NEXT_NOT_FOUND');
  });
});
