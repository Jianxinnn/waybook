import { sourceRegistry } from '../ingest/sourceRegistry'

export async function ingestAllSources() {
  const collected = await Promise.all(
    sourceRegistry.map((collector) => collector.collect()),
  )

  return collected.flat()
}
