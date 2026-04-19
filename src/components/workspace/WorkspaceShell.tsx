'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import type { ReactNode } from 'react';
import { readScopeQuery, withScopeQuery } from '@/lib/scopeQuery';
import { dict, resolveLang, withLangQuery, type Lang } from '@/lib/i18n';

interface WorkspaceShellProps {
  children: ReactNode;
}

function isCurrentPath(pathname: string, href: string) {
  if (href === '/') {
    return pathname === '/';
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function WorkspaceShell({ children }: WorkspaceShellProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentScope = readScopeQuery(searchParams);
  const lang = resolveLang(searchParams);
  const t = dict[lang];

  const nav = [
    { href: '/', label: t.shell.nav.today },
    { href: '/pulse', label: t.shell.nav.pulse },
    { href: '/projects', label: t.shell.nav.projects },
    { href: '/timeline', label: t.shell.nav.timeline },
    { href: '/entities', label: t.shell.nav.knowledge },
    { href: '/reviews', label: t.shell.nav.reviews }
  ];

  const buildHref = (href: string) => withLangQuery(withScopeQuery(href, currentScope), lang);
  const toggleHref = (target: Lang) =>
    withLangQuery(withScopeQuery(pathname || '/', currentScope), target);

  return (
    <div className="min-h-screen">
      <header className="border-b border-stone-200/70">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-6 px-6 py-5">
          <Link href={buildHref('/')} className="serif text-lg font-semibold tracking-tight">
            Waybook
          </Link>
          <nav aria-label="Main" className="flex items-center gap-5 text-sm">
            {nav.map((item) => {
              const active = isCurrentPath(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={buildHref(item.href)}
                  aria-current={active ? 'page' : undefined}
                  className={
                    active
                      ? 'text-stone-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--accent)]'
                      : 'text-stone-500 transition hover:text-stone-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--accent)]'
                  }
                >
                  {item.label}
                </Link>
              );
            })}
            <span className="h-4 w-px bg-stone-300" aria-hidden />
            <LangToggle lang={lang} toggleHref={toggleHref} labels={t.shell.langToggle} />
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}

interface LangToggleProps {
  lang: Lang;
  toggleHref: (target: Lang) => string;
  labels: { en: string; zh: string };
}

function LangToggle({ lang, toggleHref, labels }: LangToggleProps) {
  return (
    <span
      role="group"
      aria-label="Language"
      className="inline-flex items-center gap-1 text-xs tabular-nums"
    >
      <Link
        href={toggleHref('en')}
        aria-current={lang === 'en' ? 'true' : undefined}
        className={lang === 'en' ? 'text-stone-950' : 'text-stone-400 hover:text-stone-700'}
      >
        {labels.en}
      </Link>
      <span className="text-stone-300">/</span>
      <Link
        href={toggleHref('zh')}
        aria-current={lang === 'zh' ? 'true' : undefined}
        className={lang === 'zh' ? 'text-stone-950' : 'text-stone-400 hover:text-stone-700'}
      >
        {labels.zh}
      </Link>
    </span>
  );
}
