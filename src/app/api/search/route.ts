import { getBootstrapSnapshot } from '../../../server/bootstrap/pipeline'

function matchesQuery(value: string, query: string): boolean {
  return value.toLowerCase().includes(query.toLowerCase())
}

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get('q')?.trim() ?? ''
  const snapshot = await getBootstrapSnapshot()
  const items = snapshot.entities.filter((entity) => {
    if (query === '') {
      return true
    }

    return matchesQuery(entity.title, query)
      || matchesQuery(entity.slug, query)
      || matchesQuery(entity.canonicalSummary, query)
  })

  return Response.json({
    query,
    items,
  })
}
