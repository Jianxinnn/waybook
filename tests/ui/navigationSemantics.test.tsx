import { describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { ScopeTabs } from '@/components/reviews/ScopeTabs';
import { WorkspaceShell } from '@/components/workspace/WorkspaceShell';

let pathname = '/reviews';
let searchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  usePathname: () => pathname,
  useSearchParams: () => searchParams
}));

describe('WorkspaceShell', () => {
  it('marks the current navigation item and exposes visible focus affordances', () => {
    pathname = '/reviews';
    searchParams = new URLSearchParams();

    const html = renderToString(
      <WorkspaceShell>
        <main>Child content</main>
      </WorkspaceShell>
    );

    expect(html).toContain('aria-current="page"');
    expect(html).toContain('Reviews');
    expect(html).toContain('focus-visible:outline');
  });

  it('preserves scope params in top-level navigation links', () => {
    pathname = '/reviews';
    searchParams = new URLSearchParams([
      ['scopeKind', 'repo'],
      ['scopeValue', '/workspace/waybook'],
      ['scopeLabel', 'Waybook Repo']
    ]);

    const html = renderToString(
      <WorkspaceShell>
        <main>Child content</main>
      </WorkspaceShell>
    );

    expect(html).toContain('/?scopeKind=repo&amp;scopeValue=%2Fworkspace%2Fwaybook&amp;scopeLabel=Waybook+Repo');
    expect(html).toContain('/projects?scopeKind=repo&amp;scopeValue=%2Fworkspace%2Fwaybook&amp;scopeLabel=Waybook+Repo');
    expect(html).toContain('/timeline?scopeKind=repo&amp;scopeValue=%2Fworkspace%2Fwaybook&amp;scopeLabel=Waybook+Repo');
    expect(html).toContain('/entities?scopeKind=repo&amp;scopeValue=%2Fworkspace%2Fwaybook&amp;scopeLabel=Waybook+Repo');
    expect(html).toContain('/reviews?scopeKind=repo&amp;scopeValue=%2Fworkspace%2Fwaybook&amp;scopeLabel=Waybook+Repo');
  });
});

describe('ScopeTabs', () => {
  it('marks the current scope link as current', () => {
    const html = renderToString(
      <ScopeTabs
        basePath="/reviews"
        currentScope={{ scopeKind: 'project', scopeValue: 'waybook', scopeLabel: 'Waybook' }}
        scopes={[
          { scopeKind: 'portfolio', scopeValue: 'portfolio', scopeLabel: 'Portfolio' },
          { scopeKind: 'project', scopeValue: 'waybook', scopeLabel: 'Waybook' }
        ]}
      />
    );

    expect(html).toContain('aria-current="page"');
    expect(html).toContain('scopeLabel=Waybook');
    expect(html).toContain('focus-visible:outline');
  });
});
