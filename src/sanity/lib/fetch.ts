import {unstable_cache} from 'next/cache'
import {client} from '@/sanity/lib/client'
import {homePageQuery, projectBySlugQuery} from '@/sanity/lib/queries'

export function getHomePageData<QueryResponse>(): Promise<QueryResponse> {
  return unstable_cache(
    async () => client.fetch<QueryResponse>(homePageQuery),
    ['sanity', 'home-page'],
    {
      tags: ['siteSettings', 'projects'],
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
