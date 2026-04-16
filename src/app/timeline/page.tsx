import { createWaybookConfig } from '@/lib/config';
import { TimelineList } from '@/components/timeline/TimelineList';
import { buildWorkspaceSnapshot } from '@/server/bootstrap/pipeline';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function TimelinePage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const q = typeof resolvedSearchParams.q === 'string' ? resolvedSearchParams.q : undefined;
  const project =
    typeof resolvedSearchParams.project === 'string' ? resolvedSearchParams.project : undefined;
  const source =
    typeof resolvedSearchParams.source === 'string' ? resolvedSearchParams.source : undefined;
  const snapshot = await buildWorkspaceSnapshot(createWaybookConfig(), {
    filters: { q, project, source }
  });

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-700">Waybook</p>
        <h1 className="mt-3 text-4xl font-semibold text-stone-950">Unified Timeline</h1>
        <p className="mt-3 text-base text-stone-600">
          Search, filter, and inspect normalized research events from all connectors.
        </p>
      </div>
      <TimelineList items={snapshot.items} />
    </main>
  );
}
