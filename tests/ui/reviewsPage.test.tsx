import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import ReviewsPage from '@/app/reviews/page';

describe('ReviewsPage', () => {
  it('renders the daily and weekly secretary drafts surface', async () => {
    const html = renderToString(await ReviewsPage({}));

    expect(html).toContain('Review Drafts');
    expect(html).toContain('Daily Brief');
    expect(html).toContain('Weekly Outlook');
    expect(html).toContain('Drafts To Promote');
    expect(html).toContain('Portfolio');
  });
});
