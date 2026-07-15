import {getProjectSlidesBySlug} from '@/sanity/lib/fetch'
import type {ProjectSlide} from '@/app/version-2/types'

type SlidesResult = {
  slides?: ProjectSlide[]
} | null

export async function GET(_request: Request, {params}: {params: Promise<{slug: string}>}) {
  const {slug} = await params
  const data = await getProjectSlidesBySlug<SlidesResult>(slug)

  return Response.json({slides: data?.slides ?? []})
}
