import { jsonResponse } from '@/lib/http'
import { accountsEnabled } from '@/lib/supabase'
import { stageIds } from '@/lib/content'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Capability probe for deployment checks. It reports whether optional
 * integrations are wired, never their values, and never proves that an
 * integration works — only that it is configured.
 */
export async function GET() {
  return jsonResponse({
    status: 'ok',
    accountsConfigured: accountsEnabled(),
    intakeConfigured: accountsEnabled(),
    stages: stageIds,
  })
}
