import type {Metadata} from 'next'
import {getProjectCards} from '@/sanity/lib/fetch'
import GridStage from './GridStage'
import type {ProjectCard} from './types'

export const metadata: Metadata = {
  title: 'Version 2',
  description: 'version-2.sukhov.xyz',
}

export default async function VersionTwoPage() {
  const projects = await getProjectCards<ProjectCard[]>()

  return <GridStage projects={projects ?? []} />
}
