import { notFound } from 'next/navigation';
import { createWaybookConfig } from '@/lib/config';
import { createDatabaseClient } from '@/server/db/client';
import { runIngestJob } from '@/server/jobs/ingestJob';
import { getWikiEntity } from '@/server/search/entityService';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function EntityDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const config = createWaybookConfig();

  await runIngestJob(config);
  const client = createDatabaseClient(config.databasePath);
  const entity = await getWikiEntity(client, slug);

  if (!entity) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-700">
        {entity.entityType}
      </p>
      <h1 className="mt-3 text-4xl font-semibold text-stone-950">{entity.title}</h1>
      <p className="mt-4 text-base leading-7 text-stone-600">{entity.canonicalSummary}</p>
      <pre className="mt-8 overflow-x-auto rounded-3xl border border-stone-200 bg-white p-6 text-sm text-stone-700">
        {entity.managedMarkdown}
      </pre>
    </main>
  );
}
