import React from 'react'

import { getBootstrapSnapshot } from '../../../server/bootstrap/pipeline'
import { getProjectEntityBySlug } from '../../../server/search/projectService'

interface ProjectPageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params
  const snapshot = await getBootstrapSnapshot()
  const project = getProjectEntityBySlug(snapshot.entities, slug)

  if (!project) {
    return (
      <main className="min-h-screen px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-3xl font-semibold text-slate-950">Project not found</h1>
        </div>
      </main>
    )
  }

  const relatedTopics = snapshot.entities.filter(
    (entity) => entity.entityType === 'topic' && project.outboundEntityIds.includes(entity.id),
  )
  const projectEvents = snapshot.timelineEvents.filter((event) => event.projectKey === slug)

  return (
    <main className="min-h-screen px-6 py-16">
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        <header className="space-y-4">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
            Project
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
            {project.title}
          </h1>
          <p className="text-base leading-7 text-slate-600">{project.canonicalSummary}</p>
        </header>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-950">Recent evidence</h2>
          <ul className="mt-3 space-y-3 text-sm leading-6 text-slate-600">
            {projectEvents.map((event) => (
              <li key={event.id}>
                <span className="font-medium text-slate-950">{event.title}</span>
                <span> — {event.summary}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-950">Topic links</h2>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
            {relatedTopics.map((topic) => (
              <li key={topic.id}>
                <span className="font-medium text-slate-950">{topic.title}</span>
                <span> — {topic.canonicalSummary}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  )
}
