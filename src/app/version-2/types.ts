import type {SanityImageSource} from '@sanity/image-url'

export type MediaFit = 'contain' | 'cover'
export type SlideBackground = 'white' | 'black'

export type VideoAsset = {
  asset?: {
    url?: string
    originalFilename?: string
    mimeType?: string
  }
}

export type CoverMedia = {
  mediaType?: 'image' | 'video'
  fitMode?: MediaFit
  background?: SlideBackground
  image?: SanityImageSource
  video?: VideoAsset
}

export type ProjectCard = {
  _id: string
  title?: string
  slug?: string
  type?: string
  year?: string
  coverMedia?: CoverMedia
}

export type MediaSlide = {
  _key?: string
  slideType?: undefined
  mediaType?: 'image' | 'video'
  fitMode?: MediaFit
  background?: SlideBackground
  image?: SanityImageSource
  video?: VideoAsset
}

export type CreditItem = {
  _key?: string
  role?: string
  name?: string
}

export type CreditsSlide = {
  _key?: string
  slideType: 'credits'
  background?: SlideBackground
  leftColumn1?: CreditItem[] | null
  leftColumn2?: CreditItem[] | null
  text?: string
}

export type ProjectSlide = MediaSlide | CreditsSlide
