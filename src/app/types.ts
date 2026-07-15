import type {SanityImageSource} from '@sanity/image-url'

export type Award = {
  name?: string
  result?: string
  year?: string
}

export type GraphicTool = {
  label?: string
  url?: string
}

export type ServiceItem = {
  label?: string
  url?: string
}

export type SiteSettings = {
  title?: string
  intro?: string
  location?: string
  email?: string
  instagram?: string
  awards?: Award[]
  graphicTools?: GraphicTool[]
  services?: ServiceItem[]
}

export type CoverMedia = {
  mediaType?: 'image' | 'video'
  fitMode?: 'contain' | 'cover'
  background?: 'white' | 'black'
  image?: SanityImageSource
  video?: {
    asset?: {
      url?: string
      originalFilename?: string
      mimeType?: string
    }
  }
}

export type CreditItem = {
  _key?: string
  role?: string
  name?: string
}

export type ProjectCredits = {
  leftColumn1?: CreditItem[] | null
  leftColumn2?: CreditItem[] | null
} | null

export type Project = {
  _id: string
  title?: string
  slug?: string
  type?: string
  year?: string
  excerpt?: string
  coverMedia?: CoverMedia
  credits?: ProjectCredits
}
