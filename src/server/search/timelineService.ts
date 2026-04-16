import type { ResearchEvent } from '../../types/research'

export function getTimelineEvents(
  events: ResearchEvent[] = [],
): ResearchEvent[] {
  return [...events].sort((left, right) => right.occurredAt - left.occurredAt)
}
