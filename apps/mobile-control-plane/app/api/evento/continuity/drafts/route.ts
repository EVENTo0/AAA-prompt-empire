import snapshot from '@/data/evento-continuity.v1.json'
import { isAuthorized } from '@/lib/auth'
import { createContinuityDraftHandler } from '@/lib/continuity-drafts.mjs'
import { continuityDraftConfig } from '@/lib/continuity-draft-config.mjs'

export const dynamic = 'force-dynamic'

function handle(request: Request) {
  return createContinuityDraftHandler({ snapshot, isAuthorized, config: continuityDraftConfig(process.env) })(request)
}
export const GET = handle
export const POST = handle
