import { renderLlmsTxt } from '@/lib/business-context'

export const runtime = 'nodejs'
export const dynamic = 'force-static'

/**
 * `/llms.txt` — business context for language models reading this site.
 *
 * Public by design: it contains only what the site already publishes. It is
 * generated from the same data files the pages render, so the two cannot
 * drift apart.
 */
export async function GET() {
  return new Response(renderLlmsTxt(), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
