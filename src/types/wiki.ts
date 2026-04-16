export type WikiEntityType = 'project' | 'experiment' | 'topic';

export interface WikiEntityDraft {
  id: string;
  entityType: WikiEntityType;
  slug: string;
  title: string;
  projectKey: string;
  canonicalSummary: string;
  status: 'active' | 'archived';
  sourceThreadIds: string[];
  supportingEventIds: string[];
  outboundEntityIds: string[];
  managedMarkdown: string;
  obsidianPath: string;
}
