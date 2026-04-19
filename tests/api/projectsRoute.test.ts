import { describe, expect, it } from 'vitest';
import { GET } from '@/app/api/projects/route';

describe('GET /api/projects', () => {
  it('returns project summaries with thread intelligence for the requested scope', async () => {
    const response = await GET(
      new Request('http://localhost/api/projects?scopeKind=project&scopeValue=waybook&scopeLabel=Waybook')
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.currentScope).toEqual({
      scopeKind: 'project',
      scopeValue: 'waybook',
      scopeLabel: 'Waybook'
    });
    expect(Array.isArray(payload.items)).toBe(true);
    expect(payload.items).toEqual([
      expect.objectContaining({
        projectKey: 'waybook',
        activeThreadCount: expect.any(Number),
        stalledThreadCount: expect.any(Number),
        repeatedPatternCount: expect.any(Number)
      })
    ]);
  });
});
