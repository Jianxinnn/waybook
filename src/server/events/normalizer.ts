import type { RawSourceEventInput } from '@/types/source';
import type { ActorKind, ResearchEvent } from '@/types/research';
import { asStringArray, slugify } from '@/server/ingest/shared';

function deriveActorKind(sourceFamily: RawSourceEventInput['sourceFamily']): ActorKind {
  if (sourceFamily === 'git') {
    return 'user';
  }

  if (sourceFamily === 'experiment') {
    return 'system';
  }

  return 'agent';
}

function deriveTitle(input: RawSourceEventInput) {
  const payload = input.payload;

  return String(
    payload.message ??
      payload.title ??
      payload.summary ??
      payload.text ??
      payload.fileName ??
      payload.kind ??
      input.sourceEventId
  );
}

function deriveSummary(input: RawSourceEventInput, title: string) {
  const payload = input.payload;

  return String(
    payload.summary ??
      payload.narrative ??
      payload.text ??
      payload.learned ??
      payload.completed ??
      payload.output ??
      title
  );
}

function deriveFiles(payload: Record<string, unknown>) {
  return [
    ...asStringArray(payload.changedFiles),
    ...asStringArray(payload.files),
    ...asStringArray(payload.filesRead),
    ...asStringArray(payload.filesModified),
    ...asStringArray(payload.filePath)
  ];
}

function deriveTags(input: RawSourceEventInput, payload: Record<string, unknown>) {
  const tags = new Set<string>([input.sourceFamily, input.provenanceTier]);

  for (const tag of asStringArray(payload.tags)) {
    tags.add(slugify(tag));
  }

  const runName = typeof payload.runName === 'string' ? payload.runName : undefined;
  if (runName) {
    tags.add(`run:${slugify(runName)}`);
    tags.add('experiment');
  }

  return [...tags];
}

function deriveThreadKey(input: RawSourceEventInput, payload: Record<string, unknown>) {
  if (typeof payload.runName === 'string') {
    return `experiment:${input.projectKey}:${slugify(payload.runName)}`;
  }

  if (input.threadId) {
    return `${input.sourceFamily}:${input.projectKey}:${slugify(input.threadId)}`;
  }

  if (input.sessionId) {
    return `${input.sourceFamily}:${input.projectKey}:${slugify(input.sessionId)}`;
  }

  return `${input.sourceFamily}:${input.projectKey}:${slugify(input.sourceEventId)}`;
}

function deriveImportanceScore(kind: string, provenanceTier: RawSourceEventInput['provenanceTier']) {
  const base = provenanceTier === 'primary' ? 0.7 : provenanceTier === 'derived' ? 0.6 : 0.45;

  if (kind.includes('summary') || kind.includes('metrics')) {
    return Math.min(base + 0.15, 1);
  }

  if (kind.includes('commit') || kind.includes('tool')) {
    return Math.min(base + 0.1, 1);
  }

  return base;
}

export function normalizeRawSourceEvent(input: RawSourceEventInput): ResearchEvent {
  const payload = input.payload;
  const kind = String(payload.kind ?? 'event');
  const title = deriveTitle(input);
  const summary = deriveSummary(input, title);

  return {
    id: `research:${input.id}`,
    rawEventId: input.id,
    sourceFamily: input.sourceFamily,
    connectorId: input.connectorId,
    provenanceTier: input.provenanceTier,
    eventType: `${input.sourceFamily}.${kind}`,
    title,
    summary,
    projectKey: input.projectKey,
    repoPath: input.repoPath,
    threadKey: deriveThreadKey(input, payload),
    occurredAt: input.occurredAt,
    actorKind: deriveActorKind(input.sourceFamily),
    evidenceRefs: [`${input.connectorId}:${input.sourceEventId}`],
    files: deriveFiles(payload),
    tags: deriveTags(input, payload),
    importanceScore: deriveImportanceScore(kind, input.provenanceTier)
  };
}
