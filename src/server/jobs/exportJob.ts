import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { WaybookConfig } from '@/lib/config';
import type { DatabaseClient } from '@/server/db/client';
import { createDatabaseClient } from '@/server/db/client';
import { listReviewDrafts } from '@/server/reviews/reviewStore';
import { loadWikiEntities } from '@/server/wiki/entityStore';

export interface ExportJobResult {
  filesWritten: string[];
}

export async function runExportJob(
  config: WaybookConfig,
  existingClient?: DatabaseClient
): Promise<ExportJobResult> {
  const client = existingClient ?? createDatabaseClient(config.databasePath);
  const entities = await loadWikiEntities(client);
  const reviews = await listReviewDrafts(client);
  const filesWritten: string[] = [];

  const reviewRoot = path.join(config.exportRoot, 'reviews');
  try {
    const existingReviewFiles = await readdir(reviewRoot);
    const legacyReviewFiles = existingReviewFiles.filter((fileName) =>
      /^(daily|weekly)-\d{4}-\d{2}-\d{2}\.md$/.test(fileName)
    );

    await Promise.all(
      legacyReviewFiles.map((fileName) => rm(path.join(reviewRoot, fileName), { force: true }))
    );
  } catch {
    // Ignore missing review directories.
  }

  for (const entity of entities) {
    const outputPath = path.join(config.exportRoot, entity.obsidianPath);
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, entity.managedMarkdown, 'utf8');
    filesWritten.push(outputPath);
  }

  for (const review of reviews) {
    const outputPath = path.join(config.exportRoot, review.obsidianPath);
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, review.managedMarkdown, 'utf8');
    filesWritten.push(outputPath);
  }

  return { filesWritten };
}
