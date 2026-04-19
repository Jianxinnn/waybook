import { createElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import RootLayout from '@/app/layout';
import HomePage from '@/app/page';

let pathname = '/';
let searchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  usePathname: () => pathname,
  useSearchParams: () => searchParams
}));

describe('home page', () => {
  it('renders the refreshed workspace shell and marks today as the current page', async () => {
    pathname = '/';
    searchParams = new URLSearchParams();

    const page = await HomePage({});
    const html = renderToString(createElement(RootLayout, null, page));

    expect(html).toContain('Today');
    expect(html).toContain('Timeline');
    expect(html).toContain('Projects');
    expect(html).toContain('Knowledge');
    expect(html).toContain('Reviews');
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('In Motion');
    expect(html).toContain('Since Yesterday');
    expect(html).toContain('Decision Support');
  });

  it('preserves the current scope in workspace navigation and section links', async () => {
    pathname = '/';
    searchParams = new URLSearchParams([
      ['scopeKind', 'project'],
      ['scopeValue', 'waybook'],
      ['scopeLabel', 'Waybook']
    ]);

    const page = await HomePage({
      searchParams: Promise.resolve({
        scopeKind: 'project',
        scopeValue: 'waybook',
        scopeLabel: 'Waybook'
      })
    });
    const html = renderToString(createElement(RootLayout, null, page));

    expect(html).toContain('/projects?scopeKind=project&amp;scopeValue=waybook&amp;scopeLabel=Waybook');
    expect(html).toContain('/timeline?scopeKind=project&amp;scopeValue=waybook&amp;scopeLabel=Waybook');
    expect(html).toContain('/entities?scopeKind=project&amp;scopeValue=waybook&amp;scopeLabel=Waybook');
    expect(html).toContain('/reviews?scopeKind=project&amp;scopeValue=waybook&amp;scopeLabel=Waybook');
  });
});
