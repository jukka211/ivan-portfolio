import {createClient, type SanityClient} from 'next-sanity'
import {apiVersion, dataset, projectId} from '@/sanity/env'

// Editor-scoped token: uploads generated poster images and patches them onto
// the source document. Only used by the generate-poster webhook route and
// the backfill script — never imported into anything client-facing.
//
// Built lazily (not at module scope) — Next's build evaluates every route
// module while collecting page data, so throwing here at import time would
// fail `next build` on any machine without the token set (CI, a fresh
// clone), not just at request time.
export function createWriteClient(): SanityClient {
  const token = process.env.SANITY_API_WRITE_TOKEN

  if (!token) {
    throw new Error('Missing SANITY_API_WRITE_TOKEN environment variable.')
  }

  return createClient({projectId, dataset, apiVersion, token, useCdn: false})
}
