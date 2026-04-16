import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import HomePage from '@/app/page';

describe('home page', () => {
  it('renders the workspace heading and connector provenance summary', async () => {
    const html = renderToString(await HomePage({}));

    expect(html).toContain('Waybook');
    expect(html).toContain('Research Memory Backbone');
    expect(html).toContain('Connector Provenance');
    expect(html).toContain('Daily Brief');
    expect(html).toContain('Weekly Outlook');
    expect(html).toContain('Portfolio');
  });
});
