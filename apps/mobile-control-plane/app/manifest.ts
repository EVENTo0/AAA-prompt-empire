import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AAA+ Empire Mobile Control Plane',
    short_name: 'AAA+ Empire',
    description: 'EVENTO project and engineering operations command center.',
    start_url: '/',
    display: 'standalone',
    background_color: '#071018',
    theme_color: '#071018',
    orientation: 'portrait-primary',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/icon-maskable.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
    ],
  }
}
