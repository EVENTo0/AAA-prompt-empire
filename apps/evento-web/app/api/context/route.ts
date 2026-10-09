import { businessContext } from '@/lib/business-context'

export const runtime = 'nodejs'
export const dynamic = 'force-static'

/**
 * Structured business context for agents and integrations.
 *
 * Read-only and public: it exposes only information the site already
 * publishes, and never request data, account data or configuration.
 */
export async function GET() {
  return new Response(JSON.stringify(businessContext(), null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      // Safe to read from anywhere: this is public marketing data with no
      // session attached, and nothing here is cookie-authenticated.
      'Access-Control-Allow-Origin': '*',
    },
  })
}
