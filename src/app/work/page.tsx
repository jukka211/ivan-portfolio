import type {Metadata} from 'next'
import type {SanityImageSource} from '@sanity/image-url'
import {getWorkSections} from '@/sanity/lib/fetch'
import WorkExperience from './WorkExperience'

export const metadata: Metadata = {
  title: 'Work',
  description: 'work.sukhov.xyz',
}

export type WorkSlide = {
  _key?: string
  mediaType?: 'image' | 'video'
  image?: SanityImageSource
  video?: {
    asset?: {
      url?: string
      originalFilename?: string
      mimeType?: string
    }
  }
}

export type WorkSection = {
  _id: string
  projectTitle?: string
  projectYear?: string
  webType?: string
  client?: string
  slides?: WorkSlide[]
}

export default async function WorkPage() {
  const sections = await getWorkSections<WorkSection[]>()

  return <WorkExperience sections={sections ?? []} />
}
