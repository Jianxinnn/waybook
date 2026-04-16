import React from 'react'

interface EntityCardProps {
  eyebrow: string
  title: string
  summary: string
  href: string
}

export function EntityCard({ eyebrow, title, summary, href }: EntityCardProps) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
        {eyebrow}
      </p>
      <h3 className="mt-3 text-xl font-semibold tracking-tight text-slate-950">
        {title}
      </h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">{summary}</p>
      <a
        href={href}
        className="mt-4 inline-flex items-center text-sm font-medium text-slate-900 underline underline-offset-4"
      >
        Open
      </a>
    </article>
  )
}
