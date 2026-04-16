export interface ThreadAssignmentInput {
  projectKey: string
  title: string
}

export function assignThreadKey({
  projectKey,
  title,
}: ThreadAssignmentInput): string {
  const normalizedTitle = title.trim().toLowerCase().replace(/\s+/g, ' ')
  const threadSuffix = normalizedTitle || 'untitled'

  return `${projectKey}:${threadSuffix}`
}
