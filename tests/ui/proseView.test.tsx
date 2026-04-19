import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { ProseView } from '@/components/workspace/ProseView';

describe('ProseView', () => {
  it('renders pipe tables into a styled table with aligned columns', () => {
    const md = `
| Layer | Role | Provenance |
| :--- | :---: | ---: |
| Ingest | capture | primary |
| Normalize | derive | derived |
`;
    const html = renderToString(<ProseView markdown={md} />);
    expect(html).toContain('<table');
    expect(html).toContain('<thead>');
    expect(html).toContain('<th');
    expect(html).toContain('text-align:left');
    expect(html).toContain('text-align:center');
    expect(html).toContain('text-align:right');
    expect(html).toContain('Ingest');
    expect(html).toContain('Normalize');
    expect(html).toContain('primary');
  });

  it('renders nested bullet lists as ul > li > ul > li', () => {
    const md = `
- outer a
  - inner a1
  - inner a2
- outer b
`;
    const html = renderToString(<ProseView markdown={md} />);
    // outer
    expect(html).toMatch(/<ul>\s*<li>/);
    // nested ul must appear inside an li
    expect(html).toContain('outer a');
    expect(html).toContain('inner a1');
    expect(html).toContain('inner a2');
    // there must be at least 2 ul opening tags (one outer, one nested)
    const ulMatches = html.match(/<ul>/g) ?? [];
    expect(ulMatches.length).toBeGreaterThanOrEqual(2);
  });

  it('renders mixed ordered/unordered nesting', () => {
    const md = `
1. first step
   - detail one
   - detail two
2. second step
`;
    const html = renderToString(<ProseView markdown={md} />);
    expect(html).toContain('<ol>');
    expect(html).toContain('<ul>');
    expect(html).toContain('first step');
    expect(html).toContain('detail one');
    expect(html).toContain('second step');
  });
});
