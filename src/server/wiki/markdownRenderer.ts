import type { WikiEntityDraft } from './entityCompiler'

export function renderEntityMarkdown(entity: WikiEntityDraft): string {
  const supportingEvents = entity.supportingEventIds.length > 0
    ? entity.supportingEventIds.map((eventId) => `- ${eventId}`)
    : ['- None yet']

  return [
    '---',
    `title: ${entity.title}`,
    `entity_type: ${entity.entityType}`,
    `slug: ${entity.slug}`,
    `status: ${entity.status}`,
    '---',
    '',
    '<!-- waybook:managed:start -->',
    `# ${entity.title}`,
    '',
    entity.canonicalSummary,
    '',
    '## Supporting Events',
    ...supportingEvents,
    '<!-- waybook:managed:end -->',
  ].join('\n')
}
