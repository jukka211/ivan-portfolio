import {unstable_cache} from 'next/cache'
import {client} from '@/sanity/lib/client'
import {
  homePageQuery,
  projectBySlugQuery,
  projectCardsQuery,
  projectSlidesBySlugQuery,
  version3ProjectsQuery,
  workSectionsQuery,
} from '@/sanity/lib/queries'

export function getHomePageData<QueryResponse>(): Promise<QueryResponse> {
  return unstable_cache(
    async () => client.fetch<QueryResponse>(homePageQuery),
    ['sanity', 'home-page'],
    {
      tags: ['siteSettings', 'projects'],
    },
  )()
}

export function getWorkSections<QueryResponse>(): Promise<QueryResponse> {
  return unstable_cache(
    async () => client.fetch<QueryResponse>(workSectionsQuery),
    ['sanity', 'work-sections'],
    {
      tags: ['workSections'],
    },
  )()
}

export function getProjectBySlug<QueryResponse>(slug: string): Promise<QueryResponse> {
  return unstable_cache(
    async () => client.fetch<QueryResponse>(projectBySlugQuery, {slug}),
    ['sanity', 'project', slug],
    {
      tags: ['projects'],
    },
  )()
}

// Lightweight project list (no slides) for grids/cards — keeps the initial
// page payload small; full slide media is fetched separately, on demand.
export function getProjectCards<QueryResponse>(): Promise<QueryResponse> {
  return unstable_cache(
    async () => client.fetch<QueryResponse>(projectCardsQuery),
    ['sanity', 'project-cards'],
    {
      tags: ['projects'],
    },
  )()
}

// Slides only, for a single project — fetched on demand (e.g. on click),
// never bundled into the initial page load.
export function getProjectSlidesBySlug<QueryResponse>(slug: string): Promise<QueryResponse> {
  return unstable_cache(
    async () => client.fetch<QueryResponse>(projectSlidesBySlugQuery, {slug}),
    ['sanity', 'project-slides', slug],
    {
      tags: ['projects'],
    },
  )()
}

// Project list with excerpt + credits (no slide media) — for version-3's
// expandable project rows.
export function getVersion3Projects<QueryResponse>(): Promise<QueryResponse> {
  return unstable_cache(
    async () => client.fetch<QueryResponse>(version3ProjectsQuery),
    ['sanity', 'version3-projects'],
    {
      tags: ['projects'],
    },
  )()
}
