import type { ResearchEvent } from '@/types/research';
import type { WikiEntityDraft } from '@/types/wiki';
import { slugify } from '@/server/ingest/shared';
import { renderEntityMarkdown } from './entityRenderer';

function titleize(value: string) {
  return value
    .split(/[-_]/g)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function buildSummary(events: ResearchEvent[]) {
  return events
    .slice(0, 3)
    .map((event) => `${event.eventType}: ${event.title}`)
    .join(' ');
}

export function compileEntities(events: ResearchEvent[]): WikiEntityDraft[] {
  const entities: WikiEntityDraft[] = [];
  const byProject = new Map<string, ResearchEvent[]>();
  const byExperiment = new Map<string, ResearchEvent[]>();
  const byTopic = new Map<string, ResearchEvent[]>();

  for (const event of events) {
    const projectEvents = byProject.get(event.projectKey) ?? [];
    projectEvents.push(event);
    byProject.set(event.projectKey, projectEvents);

    for (const tag of event.tags) {
      if (tag.startsWith('run:')) {
        const runName = tag.slice(4);
        const experimentEvents = byExperiment.get(runName) ?? [];
        experimentEvents.push(event);
        byExperiment.set(runName, experimentEvents);
      }

      if (!['claude', 'codex', 'git', 'experiment', 'primary', 'derived', 'synthetic'].includes(tag) && !tag.startsWith('run:')) {
        const topicEvents = byTopic.get(tag) ?? [];
        topicEvents.push(event);
        byTopic.set(tag, topicEvents);
      }
    }
  }

  for (const [projectKey, projectEvents] of byProject) {
    const draft: WikiEntityDraft = {
      id: `entity:project:${projectKey}`,
      entityType: 'project',
      slug: projectKey,
      title: titleize(projectKey),
      projectKey,
      canonicalSummary: buildSummary(projectEvents),
      status: 'active',
      sourceThreadIds: [...new Set(projectEvents.map((event) => event.threadKey))],
      supportingEventIds: projectEvents.map((event) => event.id),
      outboundEntityIds: [],
      managedMarkdown: '',
      obsidianPath: `projects/${projectKey}.md`
    };
    draft.managedMarkdown = renderEntityMarkdown(draft, projectEvents);
    entities.push(draft);
  }

  for (const [runName, runEvents] of byExperiment) {
    const projectKey = runEvents[0]?.projectKey ?? 'workspace';
    const draft: WikiEntityDraft = {
      id: `entity:experiment:${runName}`,
      entityType: 'experiment',
      slug: `experiment-${slugify(runName)}`,
      title: titleize(runName),
      projectKey,
      canonicalSummary: buildSummary(runEvents),
      status: 'active',
      sourceThreadIds: [...new Set(runEvents.map((event) => event.threadKey))],
      supportingEventIds: runEvents.map((event) => event.id),
      outboundEntityIds: [],
      managedMarkdown: '',
      obsidianPath: `experiments/${slugify(runName)}.md`
    };
    draft.managedMarkdown = renderEntityMarkdown(draft, runEvents);
    entities.push(draft);
  }

  for (const [topicName, topicEvents] of byTopic) {
    const projectKey = topicEvents[0]?.projectKey ?? 'workspace';
    const draft: WikiEntityDraft = {
      id: `entity:topic:${topicName}`,
      entityType: 'topic',
      slug: `topic-${slugify(topicName)}`,
      title: titleize(topicName),
      projectKey,
      canonicalSummary: buildSummary(topicEvents),
      status: 'active',
      sourceThreadIds: [...new Set(topicEvents.map((event) => event.threadKey))],
      supportingEventIds: topicEvents.map((event) => event.id),
      outboundEntityIds: [],
      managedMarkdown: '',
      obsidianPath: `topics/${slugify(topicName)}.md`
    };
    draft.managedMarkdown = renderEntityMarkdown(draft, topicEvents);
    entities.push(draft);
  }

  return entities;
}
