import { describe, expect, it } from 'vitest';
import { GET } from '@/app/api/timeline/route';

describe('GET /api/timeline', () => {
  it('returns timeline events and workspace stats', async () => {
    const response = await GET(new Request('http://localhost/api/timeline'));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(payload.items)).toBe(true);
    expect(payload).toHaveProperty('stats');
  });
});
