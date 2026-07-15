import {getHomePageData, getVersion3Projects} from '@/sanity/lib/fetch'
import Version3Page from './Version3Page'
import type {Project, SiteSettings} from './types'

type HomePageData = {
  siteSettings?: SiteSettings
}

export default async function HomePage() {
  const [homeData, projects] = await Promise.all([
    getHomePageData<HomePageData>(),
    getVersion3Projects<Project[]>(),
  ])

  return <Version3Page siteSettings={homeData?.siteSettings} projects={projects ?? []} />
}
