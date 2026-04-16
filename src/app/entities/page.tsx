import { createWaybookConfig } from '@/lib/config';
import { EntityCard } from '@/components/entities/EntityCard';
import { buildWorkspaceSnapshot } from '@/server/bootstrap/pipeline';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function EntitiesPage() {
  const snapshot = await buildWorkspaceSnapshot(createWaybookConfig());

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-700">Waybook</p>
        <h1 className="mt-3 text-4xl font-semibold text-stone-950">Compiled Entities</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {snapshot.entities.map((entity) => (
          <EntityCard key={entity.id} entity={entity} />
        ))}
      </div>
    </main>
  );
}
