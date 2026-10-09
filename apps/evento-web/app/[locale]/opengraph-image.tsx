import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { company } from '@/lib/content'
import { isLocale, pick, type Locale } from '@/lib/i18n'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'EVENTO Project Development'

/**
 * Social card, generated per locale.
 *
 * The renderer has no system fonts, so the faces are loaded from disk —
 * otherwise Arabic renders as empty boxes.
 *
 * These are WOFF, not the WOFF2 the site serves: the image renderer rejects
 * WOFF2 outright ("Unsupported OpenType signature wOF2"). They live outside
 * `public/` so visitors never download a second copy of every face.
 */
async function face(file: string) {
  return readFile(join(process.cwd(), 'assets', 'og-fonts', file))
}

export default async function OpengraphImage({ params }: { params: Promise<{ locale: string }> }) {
  const raw = (await params).locale
  const locale: Locale = isLocale(raw) ? raw : 'ar'
  const rtl = locale === 'ar'

  const [body, bold, mono] = await Promise.all([
    face(rtl ? 'plex-arabic-400.woff' : 'plex-latin-400.woff'),
    face(rtl ? 'plex-arabic-700.woff' : 'plex-latin-700.woff'),
    face('plex-mono-400.woff'),
  ])

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#06090f',
          padding: '72px',
          direction: rtl ? 'rtl' : 'ltr',
          fontFamily: 'Plex',
        }}
      >
        {/* The same hairline that rules the site's hero. */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '660px',
            height: '4px',
            background: '#35e0ae',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '6px',
              background: '#35e0ae',
              color: '#06090f',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              fontFamily: 'Ledger',
            }}
          >
            EV
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ color: '#e8edf4', fontSize: '28px', fontWeight: 700 }}>{company.shortName}</div>
            <div style={{ color: '#91a0b3', fontSize: '18px' }}>
              {rtl ? 'لتطوير المشاريع' : 'Project Development'}
            </div>
          </div>
        </div>

        <div
          style={{
            color: '#e8edf4',
            fontSize: '60px',
            fontWeight: 700,
            lineHeight: 1.25,
            maxWidth: '900px',
            display: 'flex',
          }}
        >
          {pick(company.tagline, locale)}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            color: '#35e0ae',
            fontSize: '22px',
            fontFamily: 'Ledger',
            direction: 'ltr',
          }}
        >
          {company.domain}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Plex', data: body, weight: 400, style: 'normal' },
        { name: 'Plex', data: bold, weight: 700, style: 'normal' },
        { name: 'Ledger', data: mono, weight: 400, style: 'normal' },
      ],
    },
  )
}
