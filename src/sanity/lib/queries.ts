import {groq} from 'next-sanity'

export const homePageQuery = groq`
{
  "siteSettings": *[_type == "siteSettings"][0]{
    title,
    intro,
    location,
    email,
    phone,
    instagram,
    awards
  },
  "projects": *[_type == "project"] | order(order asc, _createdAt desc){
    _id,
    title,
    "slug": slug.current,
    type,
    year,
    excerpt,
    featured,
    coverMedia{
      mediaType,
      image,
      video{
        asset->{
          url,
          originalFilename,
          mimeType
        }
      }
    }
  }
}
`

export const projectSlugsQuery = groq`
*[_type == "project" && defined(slug.current)][]{
  "slug": slug.current
}
`

export const projectBySlugQuery = groq`
*[_type == "project" && slug.current == $slug][0]{
  _id,
  title,
  type,
  year,
  "slug": slug.current,
  coverMedia{
    mediaType,
    image,
    video{
      asset->{
        url,
        originalFilename,
        mimeType
      }
    }
  },
  slides[]{
    mediaType,
    image,
    video{
      asset->{
        url,
        originalFilename,
        mimeType
      }
    }
  }
}
`