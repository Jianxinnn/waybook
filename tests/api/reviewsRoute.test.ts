import { describe, expect, it } from 'vitest';
import { GET, POST } from '@/app/api/reviews/route';

describe('reviews api', () => {
  it('lists current review drafts', async () => {
    const response = await GET(
      new Request(
        'http://localhost/api/reviews?reviewType=daily-brief&scopeKind=portfolio&scopeValue=portfolio'
      )
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(payload.items)).toBe(true);
    expect(payload.currentScope.scopeKind).toBe('portfolio');
    expect(Array.isArray(payload.availableScopes)).toBe(true);
  });

  it('generates current secretary drafts on demand', async () => {
    const response = await POST(
      new Request(
        'http://localhost/api/reviews?reviewType=daily-brief&scopeKind=portfolio&scopeValue=portfolio',
        { method: 'POST' }
      )
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(payload.generated)).toBe(true);
    expect(payload.generated.length).toBeGreaterThan(0);
  });
});
