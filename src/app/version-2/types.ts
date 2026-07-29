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
  poster?: SanityImageSource
  posterSourceAssetId?: string
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
  poster?: SanityImageSource
  posterSourceAssetId?: string
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

export type BigTextSlide = {
  _key?: string
  slideType: 'bigText'
  text?: string
}

export type TwoColumnTextSlide = {
  _key?: string
  slideType: 'twoColumnText'
  title?: string
  text?: string
}

export type SpecItem = {
  _key?: string
  label?: string
  value?: string
}

export type TechSpecsSlide = {
  _key?: string
  slideType: 'techSpecs'
  title?: string
  specs?: SpecItem[] | null
}

export type ColumnMedia = {
  mediaType?: 'image' | 'video'
  image?: SanityImageSource
  video?: VideoAsset
  poster?: SanityImageSource
  posterSourceAssetId?: string
}

export type TwoColumnImageSlide = {
  _key?: string
  slideType: 'twoColumnImage'
  fitMode?: MediaFit
  leftColumn?: ColumnMedia
  rightColumn?: ColumnMedia
}

export type VimeoSlide = {
  _key?: string
  slideType: 'vimeo'
  embedCode?: string
}

export type ProjectSlide =
  | MediaSlide
  | CreditsSlide
  | BigTextSlide
  | TwoColumnTextSlide
  | TechSpecsSlide
  | TwoColumnImageSlide
  | VimeoSlide
