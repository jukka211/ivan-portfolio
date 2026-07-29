import {groq} from 'next-sanity'

export const homePageQuery = groq`
{
  "siteSettings": *[_type == "siteSettings"][0]{
    title,
    intro,
    location,
    email,
    instagram,
    awards,
    graphicTools[]{
      label,
      url
    },
    services[]{
      label,
      url,
      headline,
      details
    }
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
      fitMode,
      background,
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

export const projectCardsQuery = groq`
*[_type == "project" && defined(slug.current)] | order(order asc, _createdAt desc){
  _id,
  title,
  "slug": slug.current,
  type,
  year,
  coverMedia{
    mediaType,
    fitMode,
    background,
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

export const projectSlidesBySlugQuery = groq`
*[_type == "project" && slug.current == $slug][0]{
  slides[]{
    ...,
    _key,
    slideType,
    background,
    title,
    leftColumn1[]{
      _key,
      role,
      name
    },
    leftColumn2[]{
      _key,
      role,
      name
    },
    text,
    specs[]{
      _key,
      label,
      value
    },
    mediaType,
    fitMode,
    image,
    leftColumn{
      mediaType,
      image,
      video{
        asset->{
          url,
          originalFilename,
          mimeType
        }
      },
      poster,
      posterSourceAssetId
    },
    rightColumn{
      mediaType,
      image,
      video{
        asset->{
          url,
          originalFilename,
          mimeType
        }
      },
      poster,
      posterSourceAssetId
    },
    video{
      asset->{
        url,
        originalFilename,
        mimeType
      }
    },
    poster,
    posterSourceAssetId
  }
}
`

export const version3ProjectsQuery = groq`
*[_type == "project" && defined(slug.current)] | order(order asc, _createdAt desc){
  _id,
  title,
  "slug": slug.current,
  type,
  year,
  excerpt,
  coverMedia{
    mediaType,
    fitMode,
    background,
    image,
    video{
      asset->{
        url,
        originalFilename,
        mimeType
      }
    }
  },
  credits{
    leftColumn1[]{
      _key,
      role,
      name
    },
    leftColumn2[]{
      _key,
      role,
      name
    }
  }
}
`

export const workSectionsQuery = groq`
*[_type == "workSection"] | order(order asc, _createdAt asc){
  _id,
  projectTitle,
  projectYear,
  webType,
  client,
  slides[]{
    _key,
    layout,
    cellA{
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
    cellB{
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
    cellC{
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

export const projectBySlugQuery = groq`
*[_type == "project" && slug.current == $slug][0]{
  _id,
  title,
  type,
  year,
  "slug": slug.current,
  coverMedia{
    mediaType,
    fitMode,
    background,
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
    ...,
    _key,
    slideType,
    background,
    title,
    leftColumn1[]{
      _key,
      role,
      name
    },
    leftColumn2[]{
      _key,
      role,
      name
    },
    text,
    specs[]{
      _key,
      label,
      value
    },
    mediaType,
    fitMode,
    image,
    leftColumn{
      mediaType,
      image,
      video{
        asset->{
          url,
          originalFilename,
          mimeType
        }
      },
      poster,
      posterSourceAssetId
    },
    rightColumn{
      mediaType,
      image,
      video{
        asset->{
          url,
          originalFilename,
          mimeType
        }
      },
      poster,
      posterSourceAssetId
    },
    video{
      asset->{
        url,
        originalFilename,
        mimeType
      }
    },
    poster,
    posterSourceAssetId
  }
}
`

// Internal projection consumed only by scripts/poster-lib.mjs (via the
// generate-poster webhook route and the backfill script) — includes the
// video asset's _id, which the public-facing queries above deliberately
// leave out since the browser never needs it.
const posterInputProjection = `
  _id,
  coverMedia{
    mediaType,
    video{asset->{_id, url}},
    poster,
    posterSourceAssetId
  },
  slides[]{
    _key,
    slideType,
    mediaType,
    video{asset->{_id, url}},
    poster,
    posterSourceAssetId,
    leftColumn{
      mediaType,
      video{asset->{_id, url}},
      poster,
      posterSourceAssetId
    },
    rightColumn{
      mediaType,
      video{asset->{_id, url}},
      poster,
      posterSourceAssetId
    }
  }
`

export const projectPosterInputByIdQuery = groq`
*[_type == "project" && _id == $id][0]{
  ${posterInputProjection}
}
`

export const allProjectsPosterInputQuery = groq`
*[_type == "project"]{
  ${posterInputProjection}
}
`

export const legalPageQuery = groq`
*[_type == "legalPage"][0]{
  title,
  columnOne,
  columnTwo
}
`
