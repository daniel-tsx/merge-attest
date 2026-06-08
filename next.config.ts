import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'mergeattest.com' }],
        destination: 'https://www.mergeattest.com/:path*',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
