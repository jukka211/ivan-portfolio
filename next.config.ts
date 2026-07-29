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

  // The generate-poster route spawns the ffmpeg-static binary directly (see
  // src/app/api/generate-poster/route.ts) — Next's own file tracing doesn't
  // pick it up automatically since it's resolved by path at runtime rather
  // than via a plain `require()`.
  outputFileTracingIncludes: {
    '/api/generate-poster': ['./node_modules/ffmpeg-static/ffmpeg'],
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