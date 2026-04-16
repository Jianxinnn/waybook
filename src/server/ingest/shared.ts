import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

export async function pathExists(targetPath: string) {
  try {
    await stat(targetPath);
    return true;
  } catch {
    return false;
  }
}

export async function walkFiles(rootPath: string): Promise<string[]> {
  const entries = await readdir(rootPath, { withFileTypes: true });
  const results = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(rootPath, entry.name);
      if (entry.isDirectory()) {
        return walkFiles(entryPath);
      }

      return [entryPath];
    })
  );

  return results.flat();
}

export async function readJsonLines(filePath: string) {
  const contents = await readFile(filePath, 'utf8');

  return contents
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as Record<string, any>);
}

export function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function toProjectKey(repoPath: string) {
  const normalized = repoPath.replace(/\\/g, '/').replace(/\/+$/, '');
  const segments = normalized.split('/').filter(Boolean);

  return slugify(segments.at(-1) ?? 'workspace') || 'workspace';
}

export function extractTextContent(input: unknown): string {
  if (typeof input === 'string') {
    return input;
  }

  if (Array.isArray(input)) {
    return input
      .map((item) => extractTextContent(item))
      .filter(Boolean)
      .join(' ')
      .trim();
  }

  if (input && typeof input === 'object') {
    const record = input as Record<string, unknown>;
    const directText = record.text ?? record.message ?? record.content ?? record.output;
    return extractTextContent(directText);
  }

  return '';
}

export function asStringArray(input: unknown): string[] {
  if (Array.isArray(input)) {
    return input.filter((item): item is string => typeof item === 'string');
  }

  if (typeof input === 'string' && input.length > 0) {
    return [input];
  }

  return [];
}
