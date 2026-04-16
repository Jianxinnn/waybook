import React from 'react'

interface TodayPanelProps {
  focus: string
  nextStep: string
  timelineHref: string
}

export function TodayPanel({
  focus,
  nextStep,
  timelineHref,
}: TodayPanelProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
            Today
          </h2>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
            Keep the current research thread moving.
          </p>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
          Focused
        </span>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-500">Current focus</p>
          <p className="mt-2 text-base text-slate-900">{focus}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-500">Next step</p>
          <p className="mt-2 text-base text-slate-900">{nextStep}</p>
        </div>
      </div>

      <a
        href={timelineHref}
        className="mt-6 inline-flex items-center text-sm font-medium text-slate-900 underline underline-offset-4"
      >
        Review the timeline
      </a>
    </section>
  )
}
