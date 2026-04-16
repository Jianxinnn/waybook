import type { ResearchEvent } from '../../types/research'

export type WikiEntityType = 'project' | 'topic' | 'experiment'
export type WikiEntityStatus = 'draft'

export interface WikiEntityDraft {
  id: string
  entityType: WikiEntityType
  slug: string
  title: string
  canonicalSummary: string
  sourceThreadIds: string[]
  supportingEventIds: string[]
  outboundEntityIds: string[]
  status: WikiEntityStatus
}

const reservedTopicTags = new Set(['claude-mem', 'codex', 'git', 'experiment'])

export function compileEntities(events: ResearchEvent[]): WikiEntityDraft[] {
  const experimentEntities = compileExperimentEntities(events)
  const projectEntities = compileProjectEntities(events, experimentEntities)
  const topicEntities = compileTopicEntities(events)

  return [...projectEntities, ...topicEntities, ...experimentEntities]
}

function compileProjectEntities(
  events: ResearchEvent[],
  experimentEntities: WikiEntityDraft[],
): WikiEntityDraft[] {
  const eventsByProject = new Map<string, ResearchEvent[]>()

  for (const event of events) {
    const currentEvents = eventsByProject.get(event.projectKey) ?? []
    currentEvents.push(event)
    eventsByProject.set(event.projectKey, currentEvents)
  }

  return Array.from(eventsByProject.entries()).map(([projectKey, projectEvents]) => {
    const topicIds = getUniqueValues(
      projectEvents
        .flatMap((event) => event.tags)
        .filter((tag) => !reservedTopicTags.has(tag))
        .map((tag) => `topic:${toSlug(tag)}`),
    )
    const experimentIds = experimentEntities
      .filter((entity) => entity.outboundEntityIds.includes(`project:${projectKey}`))
      .map((entity) => entity.id)

    return {
      id: `project:${projectKey}`,
      entityType: 'project',
      slug: projectKey,
      title: formatTitle(projectKey),
      canonicalSummary: `${projectEvents.length} recorded research events across ${getUniqueValues(projectEvents.map((event) => event.eventType.split('.')[0])).length} source${getUniqueValues(projectEvents.map((event) => event.eventType.split('.')[0])).length === 1 ? '' : 's'}.`,
      sourceThreadIds: getUniqueValues(projectEvents.map((event) => event.threadKey)),
      supportingEventIds: projectEvents.map((event) => event.id),
      outboundEntityIds: [...topicIds, ...experimentIds],
      status: 'draft',
    }
  })
}

function compileTopicEntities(events: ResearchEvent[]): WikiEntityDraft[] {
  const eventsByTopic = new Map<string, ResearchEvent[]>()

  for (const event of events) {
    for (const tag of event.tags) {
      if (reservedTopicTags.has(tag)) {
        continue
      }

      const topicKey = toSlug(tag)
      const currentEvents = eventsByTopic.get(topicKey) ?? []
      currentEvents.push(event)
      eventsByTopic.set(topicKey, currentEvents)
    }
  }

  return Array.from(eventsByTopic.entries()).map(([topicKey, topicEvents]) => ({
    id: `topic:${topicKey}`,
    entityType: 'topic',
    slug: topicKey,
    title: formatTitle(topicKey),
    canonicalSummary: `${topicEvents.length} research event${topicEvents.length === 1 ? '' : 's'} reference ${topicKey}.`,
    sourceThreadIds: getUniqueValues(topicEvents.map((event) => event.threadKey)),
    supportingEventIds: topicEvents.map((event) => event.id),
    outboundEntityIds: getUniqueValues(topicEvents.map((event) => `project:${event.projectKey}`)),
    status: 'draft',
  }))
}

function compileExperimentEntities(events: ResearchEvent[]): WikiEntityDraft[] {
  const experimentEvents = events.filter((event) => event.eventType.startsWith('experiment.'))

  return experimentEvents.map((event) => ({
    id: `experiment:${toSlug(event.title)}`,
    entityType: 'experiment',
    slug: toSlug(event.title),
    title: formatTitle(event.title),
    canonicalSummary: event.summary,
    sourceThreadIds: [event.threadKey],
    supportingEventIds: [event.id],
    outboundEntityIds: [
      `project:${event.projectKey}`,
      ...event.tags
        .filter((tag) => !reservedTopicTags.has(tag))
        .map((tag) => `topic:${toSlug(tag)}`),
    ],
    status: 'draft',
  }))
}

function formatTitle(value: string): string {
  return value
    .split(/[-\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function toSlug(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '-')
}

function getUniqueValues(values: string[]): string[] {
  return Array.from(new Set(values))
}
