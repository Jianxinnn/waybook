import type { ReactNode } from 'react';

interface DetailPageProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
}

/**
 * Editorial two-column detail layout. The main column holds prose; the aside
 * is a narrow meta rail (project, status, counts, links). On narrow screens
 * the aside falls below the headline as a horizontal key/value row.
 */
export function DetailPage({ eyebrow, title, lead, aside, children }: DetailPageProps) {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 pb-24 pt-10 md:pt-14">
      <header className="mb-10">
        {eyebrow ? <div className="mb-4">{eyebrow}</div> : null}
        <h1 className="serif text-4xl font-semibold tracking-tight text-stone-950 md:text-[44px]">
          {title}
        </h1>
        {lead ? <div className="lead mt-5 max-w-2xl">{lead}</div> : null}
      </header>
      <div className="grid gap-12 md:grid-cols-[minmax(0,1fr)_220px]">
        <div className="min-w-0 space-y-12">{children}</div>
        {aside ? (
          <aside className="order-first md:order-none md:sticky md:top-10 md:self-start">
            <div className="border-t border-stone-200/70 pt-4 md:border-t-0 md:border-l md:border-stone-200/70 md:pl-6 md:pt-0">
              {aside}
            </div>
          </aside>
        ) : null}
      </div>
    </main>
  );
}

interface DetailSectionProps {
  title?: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
}

export function DetailSection({ title, hint, children }: DetailSectionProps) {
  return (
    <section>
      {title || hint ? (
        <div className="mb-4 flex items-baseline justify-between gap-4 border-b border-stone-200/70 pb-2">
          {title ? (
            <h2 className="serif text-[17px] font-semibold text-stone-900">{title}</h2>
          ) : (
            <span />
          )}
          {hint ? <span className="caption">{hint}</span> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
