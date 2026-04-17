import {withSentryConfig} from '@sentry/nextjs'
import type {NextConfig} from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
      },
    ],
  },

  async rewrites() {
    return [
      {
        source: '/stretch-a-z',
        destination: '/stretch-a-z/index.html',
      },
      {
        source: '/over-flexible-system',
        destination: '/over-flexible-system/index.html',
      },
    ]
  },
}

export default withSentryConfig(nextConfig, {
  org: '0-ox',
  project: 'javascript-nextjs',
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: '/monitoring',

  bundleSizeOptimizations: {
    excludeDebugStatements: true,
  },

  automaticVercelMonitors: true,
})