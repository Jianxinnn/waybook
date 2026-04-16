import type { WikiEntityDraft } from '@/types/wiki';

interface EntityCardProps {
  entity: WikiEntityDraft;
}

export function EntityCard({ entity }: EntityCardProps) {
  return (
    <article className="rounded-3xl border border-stone-200 bg-stone-50 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
        {entity.entityType}
      </p>
      <h3 className="mt-2 text-xl font-semibold text-stone-900">{entity.title}</h3>
      <p className="mt-3 text-sm leading-6 text-stone-600">{entity.canonicalSummary}</p>
      <a
        className="mt-4 inline-flex text-sm font-medium text-amber-700"
        href={`/entities/${entity.slug}`}
      >
        Open entity
      </a>
    </article>
  );
}
