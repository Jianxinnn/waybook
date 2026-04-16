import React from 'react'

import { getBootstrapSnapshot } from '../server/bootstrap/pipeline'
import { TodayPanel } from '../components/dashboard/TodayPanel'
import { EntityCard } from '../components/entities/EntityCard'
import { TimelineList, type TimelineItem } from '../components/timeline/TimelineList'

function formatOccurredAtLabel(occurredAt: number): string {
  return new Date(occurredAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export default async function HomePage() {
  const snapshot = await getBootstrapSnapshot()
  const project = snapshot.entities.find((entity) => entity.entityType === 'project')
  const topic = snapshot.entities.find(
    (entity) => entity.entityType === 'topic' && entity.slug === 'obsidian',
  ) ?? snapshot.entities.find((entity) => entity.entityType === 'topic')
  const latestEvent = snapshot.timelineEvents[0]
  const timelineItems: TimelineItem[] = snapshot.timelineEvents.slice(0, 3).map((event) => ({
    id: event.id,
    title: event.title,
    summary: event.summary,
    occurredAtLabel: formatOccurredAtLabel(event.occurredAt),
    projectLabel: event.projectKey,
  }))

  return (
    <main className="min-h-screen px-6 py-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <header className="max-w-3xl space-y-4">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
            Waybook
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            personal research secretary
          </h1>
          <p className="text-base leading-7 text-slate-600 sm:text-lg">
            A lightweight dashboard for keeping active research threads, projects,
            and emerging topics in view.
          </p>
        </header>

        <TodayPanel
          focus={latestEvent?.summary ?? 'Review the seeded research pipeline.'}
          nextStep={project?.canonicalSummary ?? 'Compile the first project entity.'}
          timelineHref="/timeline"
        />

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                Projects In Motion
              </h2>
              <p className="mt-2 text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
                Active work with a clear next move.
              </p>
            </div>
            {project ? (
              <EntityCard
                eyebrow="Project"
                title={project.title}
                summary={project.canonicalSummary}
                href={`/projects/${project.slug}`}
              />
            ) : null}
          </div>

          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                Topics Emerging This Week
              </h2>
              <p className="mt-2 text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
                Signals worth keeping warm.
              </p>
            </div>
            {topic ? (
              <EntityCard
                eyebrow="Topic"
                title={topic.title}
                summary={latestEvent?.summary ?? topic.canonicalSummary}
                href="/timeline"
              />
            ) : null}
          </div>
        </section>

        <TimelineList items={timelineItems} />
      </div>
    </main>
  )
}
