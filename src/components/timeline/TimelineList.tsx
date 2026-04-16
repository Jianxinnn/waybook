type TimelineListItem = {
  id: string;
  title: string;
  summary: string;
  eventType: string;
  projectKey: string;
  occurredAt: number;
  sourceFamily: string;
  provenanceTier: string;
  tags: string[];
  files: string[];
};

interface TimelineListProps {
  items: TimelineListItem[];
}

function formatTimestamp(timestamp: number) {
  return new Date(timestamp).toISOString().replace('T', ' ').slice(0, 16);
}

export function TimelineList({ items }: TimelineListProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-stone-300 bg-white/70 p-6 text-sm text-stone-500">
        No timeline events have been collected yet.
      </div>
    );
  }

  return (
    <ol className="space-y-4">
      {items.map((item) => (
        <li key={item.id} className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-3 text-xs font-medium uppercase tracking-[0.2em] text-stone-500">
            <span>{item.eventType}</span>
            <span>{item.projectKey}</span>
            <span>{item.sourceFamily}</span>
            <span>{item.provenanceTier}</span>
          </div>
          <h3 className="mt-3 text-xl font-semibold text-stone-900">{item.title}</h3>
          <p className="mt-2 text-sm leading-6 text-stone-600">{item.summary}</p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-stone-500">
            <span>{formatTimestamp(item.occurredAt)}</span>
            {item.files.slice(0, 3).map((filePath) => (
              <span key={filePath} className="rounded-full bg-stone-100 px-3 py-1">
                {filePath}
              </span>
            ))}
          </div>
        </li>
      ))}
    </ol>
  );
}
