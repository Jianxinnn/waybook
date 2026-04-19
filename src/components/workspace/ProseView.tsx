import type { ReactNode } from 'react';

/**
 * A small markdown renderer scoped to the subset our pipeline actually emits:
 * YAML frontmatter, ATX headings, paragraphs, (nested) unordered/ordered lists,
 * bold, italic, inline code, links, horizontal rules, blockquotes, fenced code,
 * and pipe tables.
 *
 * Rendered into the `.prose` class so typography comes from globals.css.
 */
export function ProseView({ markdown }: { markdown: string }) {
  const stripped = stripFrontmatter(markdown ?? '');
  const blocks = parseBlocks(stripped);
  return (
    <div className="prose">
      {blocks.map((block, idx) => renderBlock(block, idx))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

function stripFrontmatter(input: string): string {
  if (!input.startsWith('---')) return input;
  const end = input.indexOf('\n---', 3);
  if (end === -1) return input;
  const rest = input.slice(end + 4);
  return rest.startsWith('\n') ? rest.slice(1) : rest;
}

interface ListItem {
  text: string;
  children: ListNode[];
}
interface ListNode {
  ordered: boolean;
  items: ListItem[];
}

type Block =
  | { kind: 'heading'; level: 1 | 2 | 3 | 4; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'list'; node: ListNode }
  | { kind: 'blockquote'; lines: string[] }
  | { kind: 'code'; lang: string; text: string }
  | { kind: 'table'; headers: string[]; aligns: Array<'left' | 'right' | 'center' | null>; rows: string[][] }
  | { kind: 'hr' };

const LIST_RE = /^(\s*)([-*]|\d+\.)\s+(.*)$/;

function detectIndent(line: string): number {
  const m = /^(\s*)/.exec(line);
  if (!m) return 0;
  // tabs count as 4 spaces for depth detection
  return m[1].replace(/\t/g, '    ').length;
}

function parseBlocks(source: string): Block[] {
  const lines = source.split('\n');
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === '') {
      i += 1;
      continue;
    }
    // fenced code
    if (/^```/.test(line.trim())) {
      const lang = line.trim().slice(3).trim();
      const acc: string[] = [];
      i += 1;
      while (i < lines.length && !/^```/.test(lines[i].trim())) {
        acc.push(lines[i]);
        i += 1;
      }
      i += 1; // consume closing fence
      blocks.push({ kind: 'code', lang, text: acc.join('\n') });
      continue;
    }
    // horizontal rule
    if (/^(\s*[-_*]\s*){3,}\s*$/.test(line)) {
      blocks.push({ kind: 'hr' });
      i += 1;
      continue;
    }
    // pipe table — needs current line + next line matching delimiter row
    if (isTableHeader(line) && i + 1 < lines.length && isTableDelimiter(lines[i + 1])) {
      const { table, consumed } = parseTable(lines, i);
      blocks.push(table);
      i += consumed;
      continue;
    }
    // heading
    const h = /^(#{1,4})\s+(.*)$/.exec(line);
    if (h) {
      const level = h[1].length as 1 | 2 | 3 | 4;
      blocks.push({ kind: 'heading', level, text: h[2].trim() });
      i += 1;
      continue;
    }
    // blockquote
    if (/^>\s?/.test(line)) {
      const acc: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        acc.push(lines[i].replace(/^>\s?/, ''));
        i += 1;
      }
      blocks.push({ kind: 'blockquote', lines: acc });
      continue;
    }
    // nested list
    if (LIST_RE.test(line)) {
      const { node, consumed } = parseList(lines, i);
      blocks.push({ kind: 'list', node });
      i += consumed;
      continue;
    }
    // paragraph (collect consecutive non-empty, non-special lines)
    const acc: string[] = [line];
    i += 1;
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !LIST_RE.test(lines[i]) &&
      !/^(#{1,4})\s+/.test(lines[i]) &&
      !/^>\s?/.test(lines[i]) &&
      !/^```/.test(lines[i].trim()) &&
      !(isTableHeader(lines[i]) && i + 1 < lines.length && isTableDelimiter(lines[i + 1]))
    ) {
      acc.push(lines[i]);
      i += 1;
    }
    blocks.push({ kind: 'paragraph', text: acc.join(' ') });
  }
  return blocks;
}

function parseList(lines: string[], start: number): { node: ListNode; consumed: number } {
  // Root-level indent baseline is whatever the first line uses.
  const baseIndent = detectIndent(lines[start]!);
  const root: ListNode = { ordered: /^\s*\d+\.\s/.test(lines[start]!), items: [] };
  let i = start;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === '') {
      // blank breaks only if the next non-blank line isn't a continuation
      const next = lines[i + 1];
      if (!next || (!LIST_RE.test(next) && detectIndent(next) < baseIndent + 2)) {
        break;
      }
      i += 1;
      continue;
    }
    if (!LIST_RE.test(line)) break;
    const indent = detectIndent(line);
    if (indent < baseIndent) break;
    const match = LIST_RE.exec(line)!;
    const marker = match[2];
    const text = match[3];
    const ordered = /\d/.test(marker);
    if (indent === baseIndent) {
      if (ordered !== root.ordered && root.items.length === 0) {
        root.ordered = ordered;
      }
      root.items.push({ text, children: [] });
      i += 1;
      continue;
    }
    // deeper indent — recurse into the last item's children
    if (root.items.length === 0) break;
    const { node, consumed } = parseList(lines, i);
    root.items[root.items.length - 1]!.children.push(node);
    i += consumed;
  }
  return { node: root, consumed: i - start };
}

function isTableHeader(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed.includes('|')) return false;
  if (trimmed.startsWith('|---') || /^\|?\s*-/.test(trimmed)) return false;
  return /\|/.test(trimmed);
}

function isTableDelimiter(line: string): boolean {
  const trimmed = line.trim().replace(/^\||\|$/g, '');
  if (!trimmed) return false;
  return trimmed.split('|').every((cell) => /^\s*:?-{3,}:?\s*$/.test(cell));
}

function splitRow(line: string): string[] {
  const trimmed = line.trim().replace(/^\||\|$/g, '');
  return trimmed.split('|').map((c) => c.trim());
}

function parseTable(lines: string[], start: number): { table: Extract<Block, { kind: 'table' }>; consumed: number } {
  const headers = splitRow(lines[start]!);
  const delimCells = splitRow(lines[start + 1]!);
  const aligns: Array<'left' | 'right' | 'center' | null> = delimCells.map((cell) => {
    const c = cell.trim();
    const left = c.startsWith(':');
    const right = c.endsWith(':');
    if (left && right) return 'center';
    if (right) return 'right';
    if (left) return 'left';
    return null;
  });
  const rows: string[][] = [];
  let i = start + 2;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === '' || !line.includes('|')) break;
    rows.push(splitRow(line));
    i += 1;
  }
  return {
    table: { kind: 'table', headers, aligns, rows },
    consumed: i - start
  };
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

function renderBlock(block: Block, key: number): ReactNode {
  switch (block.kind) {
    case 'heading': {
      const content = renderInline(block.text);
      switch (block.level) {
        case 1:
          return <h1 key={key}>{content}</h1>;
        case 2:
          return <h2 key={key}>{content}</h2>;
        case 3:
          return <h3 key={key}>{content}</h3>;
        default:
          return <h4 key={key}>{content}</h4>;
      }
    }
    case 'paragraph':
      return <p key={key}>{renderInline(block.text)}</p>;
    case 'list':
      return <ListView key={key} node={block.node} />;
    case 'blockquote':
      return (
        <blockquote key={key}>
          {block.lines.map((l, idx) => (
            <p key={idx}>{renderInline(l)}</p>
          ))}
        </blockquote>
      );
    case 'code':
      return (
        <pre key={key}>
          <code>{block.text}</code>
        </pre>
      );
    case 'table':
      return (
        <div key={key} className="prose-table-wrap">
          <table>
            <thead>
              <tr>
                {block.headers.map((h, idx) => (
                  <th key={idx} style={alignStyle(block.aligns[idx])}>
                    {renderInline(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rIdx) => (
                <tr key={rIdx}>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} style={alignStyle(block.aligns[cIdx] ?? null)}>
                      {renderInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'hr':
      return <hr key={key} />;
    default:
      return null;
  }
}

function alignStyle(align: 'left' | 'right' | 'center' | null) {
  if (!align) return undefined;
  return { textAlign: align };
}

function ListView({ node }: { node: ListNode }) {
  const items = (
    <>
      {node.items.map((item, idx) => (
        <li key={idx}>
          {renderInline(item.text)}
          {item.children.map((child, cIdx) => (
            <ListView key={cIdx} node={child} />
          ))}
        </li>
      ))}
    </>
  );
  return node.ordered ? <ol>{items}</ol> : <ul>{items}</ul>;
}

// Inline parsing: `code`, **bold**, *italic*, [label](href)
function renderInline(text: string): ReactNode {
  const tokens: ReactNode[] = [];
  let remainder = text;
  let key = 0;

  const patterns: Array<{
    re: RegExp;
    build: (m: RegExpExecArray) => ReactNode;
  }> = [
    {
      re: /`([^`]+)`/,
      build: (m) => <code key={key++}>{m[1]}</code>
    },
    {
      re: /\*\*([^*]+)\*\*/,
      build: (m) => <strong key={key++}>{m[1]}</strong>
    },
    {
      re: /__([^_]+)__/,
      build: (m) => <strong key={key++}>{m[1]}</strong>
    },
    {
      re: /\*([^*]+)\*/,
      build: (m) => <em key={key++}>{m[1]}</em>
    },
    {
      re: /\[([^\]]+)\]\(([^)]+)\)/,
      build: (m) => (
        <a key={key++} href={m[2]} rel="noopener noreferrer">
          {m[1]}
        </a>
      )
    }
  ];

  while (remainder.length > 0) {
    let earliest: { idx: number; len: number; node: ReactNode } | null = null;
    for (const { re, build } of patterns) {
      const m = re.exec(remainder);
      if (!m) continue;
      if (!earliest || m.index < earliest.idx) {
        earliest = { idx: m.index, len: m[0].length, node: build(m) };
      }
    }
    if (!earliest) {
      tokens.push(remainder);
      break;
    }
    if (earliest.idx > 0) {
      tokens.push(remainder.slice(0, earliest.idx));
    }
    tokens.push(earliest.node);
    remainder = remainder.slice(earliest.idx + earliest.len);
  }

  return tokens;
}
