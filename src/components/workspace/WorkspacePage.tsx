import type { ReactNode } from 'react';

interface WorkspacePageProps {
  title: string;
  description?: string;
  eyebrow?: string;
  meta?: ReactNode;
  children: ReactNode;
}

export function WorkspacePage({ title, description, meta, children }: WorkspacePageProps) {
  return (
    <main className="mx-auto w-full max-w-4xl px-6 pb-24 pt-10 md:pt-14">
      <header className="mb-10">
        <h1 className="serif text-4xl font-semibold tracking-tight text-stone-950 md:text-5xl">
          {title}
        </h1>
        {meta ? <div className="mt-2 caption num">{meta}</div> : null}
        {description ? (
          <p className="mt-4 max-w-2xl text-[15px] leading-7 text-stone-600">{description}</p>
        ) : null}
      </header>
      <div className="space-y-14">{children}</div>
    </main>
  );
}

interface WorkspaceSectionProps {
  title?: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
  children: ReactNode;
}

export function WorkspaceSection({
  title,
  description,
  actionHref,
  actionLabel,
  children
}: WorkspaceSectionProps) {
  const hasHeader = title || description || actionHref;
  return (
    <section>
      {hasHeader ? (
        <div className="mb-4 flex items-baseline justify-between gap-4 border-b border-stone-200/70 pb-2">
          <div className="flex items-baseline gap-3">
            {title ? (
              <h2 className="serif text-[17px] font-semibold text-stone-900">{title}</h2>
            ) : null}
            {description ? <p className="caption">{description}</p> : null}
          </div>
          {actionHref && actionLabel ? (
            <a className="caption hover:text-[color:var(--accent)]" href={actionHref}>
              {actionLabel} →
            </a>
          ) : null}
        </div>
      ) : null}
      <div>{children}</div>
    </section>
  );
}
