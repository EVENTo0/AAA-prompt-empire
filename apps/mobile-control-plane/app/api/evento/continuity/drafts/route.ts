import snapshot from '@/data/evento-continuity.v1.json'
import { isAuthorized } from '@/lib/auth'
import { createContinuityDraftHandler } from '@/lib/continuity-drafts.mjs'

export const dynamic = 'force-dynamic'

function handle(request: Request) {
  return createContinuityDraftHandler({ snapshot, isAuthorized, config: {
    token: process.env.GITHUB_TOKEN,
    repository: process.env.EVENTO_CONTINUITY_TASK_REPOSITORY,
    writesEnabled: process.env.CONTROL_PLANE_ENABLE_WRITES === 'true',
    draftsEnabled: process.env.EVENTO_CONTINUITY_DRAFTS_ENABLED === 'true',
  } })(request)
}
export const GET = handle
export const POST = handle
