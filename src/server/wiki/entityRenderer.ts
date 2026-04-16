import type { ResearchEvent } from '@/types/research';
import type { WikiEntityDraft } from '@/types/wiki';

export function renderEntityMarkdown(entity: WikiEntityDraft, events: ResearchEvent[] = []) {
  const evidenceBlock = events
    .slice(0, 8)
    .map((event) => `- ${event.eventType}: ${event.title}`)
    .join('\n');

  return `---
title: ${entity.title}
slug: ${entity.slug}
entity_type: ${entity.entityType}
project_key: ${entity.projectKey}
status: ${entity.status}
---

## Summary

${entity.canonicalSummary}

## Evidence

${evidenceBlock}
`;
}
