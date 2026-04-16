import { getBootstrapSnapshot } from '../../../server/bootstrap/pipeline'

export async function GET() {
  const snapshot = await getBootstrapSnapshot()

  return Response.json({
    items: snapshot.timelineEvents,
  })
}
