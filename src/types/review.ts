export type ReviewType =
  | 'daily'
  | 'weekly'
  | 'daily-brief'
  | 'daily-review'
  | 'weekly-review';
export type ReviewStatus = 'draft' | 'accepted' | 'dismissed';
export type ReviewScopeKind = 'repo' | 'project' | 'portfolio';

export interface ReviewScope {
  scopeKind: ReviewScopeKind;
  scopeValue: string;
  scopeLabel: string;
}

export interface ReviewThreadSummary {
  threadKey: string;
  label: string;
  projectKey: string;
  eventCount: number;
  lastEventAt: number;
  sourceFamilies: string[];
  supportingEventIds: string[];
  importanceScore: number;
  repoPaths?: string[];
  exemplarTitles?: string[];
  topTags?: string[];
  status?: 'active' | 'stalled' | 'dormant';
}

export interface ReviewThreadState {
  id: string;
  threadKey: string;
  label: string;
  projectKey: string;
  repoPaths: string[];
  firstEventAt: number;
  lastEventAt: number;
  eventCount: number;
  sourceFamilies: string[];
  supportingEventIds: string[];
  exemplarTitles: string[];
  topTags: string[];
  importanceScore: number;
  status: 'active' | 'stalled' | 'dormant';
}

export interface ReviewPatternSummary {
  label: string;
  count: number;
  supportingEventIds: string[];
}

export interface ReviewPacket {
  reviewType: ReviewType;
  scope: ReviewScope;
  eventCount: number;
  projectKeys: string[];
  activeThreads: Array<{
    threadKey: string;
    label: string;
    projectKey: string;
    eventCount: number;
    repoPaths: string[];
    sourceFamilies: string[];
    importanceScore: number;
  }>;
  stalledThreads: Array<{
    threadKey: string;
    label: string;
    projectKey: string;
    repoPaths: string[];
    sourceFamilies: string[];
    importanceScore: number;
  }>;
  repeatedPatterns: Array<{
    label: string;
    count: number;
  }>;
  promotionSuggestions: Array<{
    label: string;
    entityType: 'topic' | 'experiment';
    action: 'promote' | 'update';
    rationale: string;
    score: number;
  }>;
  suggestedNextSteps: string[];
  weeklyOutlook: string;
}

export interface PromotionSuggestion {
  id: string;
  label: string;
  entityType: 'topic' | 'experiment';
  action: 'promote' | 'update';
  rationale: string;
  supportingEventIds: string[];
  relatedEntitySlugs: string[];
  score: number;
}

export interface ReviewContext {
  reviewType: ReviewType;
  slug: string;
  title: string;
  scope: ReviewScope;
  periodStart: number;
  periodEnd: number;
  generatedAt: number;
  eventCount: number;
  projectKeys: string[];
  whatMoved: string[];
  activeThreads: ReviewThreadSummary[];
  stalledThreads: ReviewThreadSummary[];
  repeatedPatterns: ReviewPatternSummary[];
  promotionSuggestions: PromotionSuggestion[];
  suggestedNextSteps: string[];
  weeklyOutlook: string;
  supportingEventIds: string[];
  relatedEntitySlugs: string[];
  packet: ReviewPacket;
}

export interface ReviewLlmSections {
  headline: string;
  overview: string;
  moved: string[];
  stalled: string[];
  repeated: string[];
  promotions: string[];
  nextSteps: string[];
  weeklyOutlook: string;
}

export interface ReviewDraft {
  id: string;
  slug: string;
  reviewType: ReviewType;
  title: string;
  scope: ReviewScope;
  periodStart: number;
  periodEnd: number;
  generatedAt: number;
  updatedAt: number;
  status: ReviewStatus;
  canonicalSummary: string;
  context: ReviewContext;
  supportingEventIds: string[];
  relatedEntitySlugs: string[];
  promotionSuggestions: PromotionSuggestion[];
  suggestedNextSteps: string[];
  managedMarkdown: string;
  obsidianPath: string;
  llmProvider: string | null;
  llmModel: string | null;
}
