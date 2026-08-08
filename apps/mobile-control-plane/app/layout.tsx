import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import './globals.css'

export const metadata: Metadata = {
  title: 'AAA+ Empire Control Plane',
  description: 'Phone-first command center for EVENTO and AAA+ Engineering Empire projects.',
  applicationName: 'AAA+ Empire',
  appleWebApp: { capable: true, title: 'AAA+ Empire', statusBarStyle: 'black-translucent' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#071018',
}

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
