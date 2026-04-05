import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Jnaninyoga Digital Command Center',
    short_name: 'Jnaninyoga',
    description: 'Digital Command Center for Yoga Studio Management',
    start_url: '/',
    display: 'standalone',
    background_color: '#F9F3F2',
    theme_color: '#8CC9D2',
    icons: [
      {
        src: '/logo.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/logo.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
