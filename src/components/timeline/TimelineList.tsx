import React from 'react'

export interface TimelineItem {
  id: string
  title: string
  summary: string
  occurredAtLabel: string
  projectLabel: string
}

interface TimelineListProps {
  heading?: string
  items: TimelineItem[]
}

export function TimelineList({
  heading = 'Recent research activity',
  items,
}: TimelineListProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
            Timeline
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            {heading}
          </h2>
        </div>
      </div>

      <ul className="mt-6 space-y-4">
        {items.map((item) => (
          <li key={item.id} className="rounded-2xl border border-slate-200 p-4">
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
              <span>{item.occurredAtLabel}</span>
              <span aria-hidden="true">•</span>
              <span>{item.projectLabel}</span>
            </div>
            <h3 className="mt-2 text-lg font-semibold text-slate-950">{item.title}</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">{item.summary}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
