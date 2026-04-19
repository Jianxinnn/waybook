import { describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import PulsePage from '@/app/pulse/page';

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  }
}));

describe('PulsePage', () => {
  it('renders the three stacked sections with meta counters', async () => {
    const html = renderToString(
      await PulsePage({
        searchParams: Promise.resolve({})
      })
    );

    expect(html).toContain('Pulse');
    expect(html).toContain('Today');
    expect(html).toContain('Week Heatmap');
    expect(html).toContain('Month Arc');
    // arc cards labels
    expect(html).toContain('Shipped');
    expect(html).toContain('Stalled');
    expect(html).toContain('New projects');
    expect(html).toContain('Repeated patterns');
  });

  it('renders the Chinese masthead and section labels when lang=zh', async () => {
    const html = renderToString(
      await PulsePage({
        searchParams: Promise.resolve({ lang: 'zh' })
      })
    );

    expect(html).toContain('脉搏');
    expect(html).toContain('今日');
    expect(html).toContain('本周热力');
    expect(html).toContain('本月走向');
  });

  it('preserves scope on internal links', async () => {
    const html = renderToString(
      await PulsePage({
        searchParams: Promise.resolve({
          scopeKind: 'project',
          scopeValue: 'waybook',
          scopeLabel: 'Waybook'
        })
      })
    );

    // any project link should carry scope params
    expect(html).toContain('scopeKind=project');
    expect(html).toContain('scopeValue=waybook');
  });
});
