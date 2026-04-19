import { buildWorkspaceHref, type Lang } from '@/lib/i18n';
import type { ReviewScope } from '@/types/review';
import type { WikiEntityDraft } from '@/types/wiki';

interface EntityCardProps {
  entity: WikiEntityDraft;
  scope?: ReviewScope | null;
  lang?: Lang;
}

export function EntityCard({ entity, scope = null, lang = 'en' }: EntityCardProps) {
  const href = buildWorkspaceHref(`/entities/${entity.slug}`, scope, lang);
  return (
    <a
      href={href}
      className="block border-b border-stone-200/60 py-3 hover:bg-stone-100/50"
    >
      <div className="flex items-baseline gap-3">
        <span className="serif min-w-0 flex-1 truncate text-[15px] text-stone-900">
          {entity.title}
        </span>
        <span className="caption flex-none">{entity.projectKey}</span>
      </div>
      <p className="mt-0.5 truncate text-[13px] leading-5 text-stone-500">
        {entity.canonicalSummary}
      </p>
    </a>
  );
}
