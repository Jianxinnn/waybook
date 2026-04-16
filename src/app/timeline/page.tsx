import React from 'react'

import { getBootstrapSnapshot } from '../../server/bootstrap/pipeline'
import { TimelineList, type TimelineItem } from '../../components/timeline/TimelineList'

function formatOccurredAtLabel(occurredAt: number): string {
  return new Date(occurredAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export default async function TimelinePage() {
  const snapshot = await getBootstrapSnapshot()
  const timelineItems: TimelineItem[] = snapshot.timelineEvents.map((event) => ({
    id: event.id,
    title: event.title,
    summary: event.summary,
    occurredAtLabel: formatOccurredAtLabel(event.occurredAt),
    projectLabel: event.projectKey,
  }))

  return (
    <main className="min-h-screen px-6 py-16">
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        <header className="space-y-4">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
            Timeline
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
            Recent research activity
          </h1>
          <p className="text-base leading-7 text-slate-600">
            A simple chronological view of work in progress, rendered from the seeded M1 pipeline.
          </p>
        </header>

        <TimelineList heading="Recent research activity" items={timelineItems} />
      </div>
    </main>
  )
}
