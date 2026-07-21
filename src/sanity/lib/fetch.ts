import {unstable_cache} from 'next/cache'
import {client} from '@/sanity/lib/client'
import {
  homePageQuery,
  legalPageQuery,
  projectBySlugQuery,
  projectCardsQuery,
  projectSlidesBySlugQuery,
  version3ProjectsQuery,
  workSectionsQuery,
} from '@/sanity/lib/queries'

// unstable_cache's tag-based invalidation only fires when the Sanity
// webhook (see /api/revalidate) reaches this deployment — it's configured
// against the deployed URL, never localhost. Without that webhook, dev mode
// has no way to invalidate a stale entry, so every Studio edit would
// otherwise need the cache directory cleared and the server restarted by
// hand. Skip the cache below production so local dev always reads live.
const isDev = process.env.NODE_ENV !== 'production'

export function getHomePageData<QueryResponse>(): Promise<QueryResponse> {
  const fetcher = () => client.fetch<QueryResponse>(homePageQuery)
  if (isDev) return fetcher()
  return unstable_cache(fetcher, ['sanity', 'home-page'], {tags: ['siteSettings', 'projects']})()
}

export function getWorkSections<QueryResponse>(): Promise<QueryResponse> {
  const fetcher = () => client.fetch<QueryResponse>(workSectionsQuery)
  if (isDev) return fetcher()
  return unstable_cache(fetcher, ['sanity', 'work-sections'], {tags: ['workSections']})()
}

export function getProjectBySlug<QueryResponse>(slug: string): Promise<QueryResponse> {
  const fetcher = () => client.fetch<QueryResponse>(projectBySlugQuery, {slug})
  if (isDev) return fetcher()
  return unstable_cache(fetcher, ['sanity', 'project', slug], {tags: ['projects']})()
}

// Lightweight project list (no slides) for grids/cards — keeps the initial
// page payload small; full slide media is fetched separately, on demand.
export function getProjectCards<QueryResponse>(): Promise<QueryResponse> {
  const fetcher = () => client.fetch<QueryResponse>(projectCardsQuery)
  if (isDev) return fetcher()
  return unstable_cache(fetcher, ['sanity', 'project-cards'], {tags: ['projects']})()
}

// Slides only, for a single project — fetched on demand (e.g. on click),
// never bundled into the initial page load.
export function getProjectSlidesBySlug<QueryResponse>(slug: string): Promise<QueryResponse> {
  const fetcher = () => client.fetch<QueryResponse>(projectSlidesBySlugQuery, {slug})
  if (isDev) return fetcher()
  return unstable_cache(fetcher, ['sanity', 'project-slides', slug], {tags: ['projects']})()
}

// Project list with excerpt + credits (no slide media) — for version-3's
// expandable project rows.
export function getVersion3Projects<QueryResponse>(): Promise<QueryResponse> {
  const fetcher = () => client.fetch<QueryResponse>(version3ProjectsQuery)
  if (isDev) return fetcher()
  return unstable_cache(fetcher, ['sanity', 'version3-projects'], {tags: ['projects']})()
}

export function getLegalPage<QueryResponse>(): Promise<QueryResponse> {
  const fetcher = () => client.fetch<QueryResponse>(legalPageQuery)
  if (isDev) return fetcher()
  return unstable_cache(fetcher, ['sanity', 'legal-page'], {tags: ['legalPage']})()
}
