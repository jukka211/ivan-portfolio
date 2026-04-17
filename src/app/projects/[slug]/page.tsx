// src/app/projects/[slug]/page.tsx
import Image from 'next/image'
import Link from 'next/link'
import type {SanityImageSource} from '@sanity/image-url'
import {notFound} from 'next/navigation'
import {getProjectBySlug} from '@/sanity/lib/fetch'
import {urlFor} from '@/sanity/lib/image'
import LazyVideo from '@/app/LazyVideo'
import creditsStyles from './credits-slide.module.css'
import styles from './page.module.css'

type CreditItem = {
  _key?: string
  role?: string
  name?: string
}

type SlideBackground = 'white' | 'black'

type MediaItem = {
  _key?: string
  slideType?: undefined
  mediaType?: 'image' | 'video'
  fitMode?: 'contain' | 'cover'
  background?: SlideBackground
  image?: SanityImageSource
  video?: {
    asset?: {
      url?: string
      originalFilename?: string
      mimeType?: string
    }
  }
}

type CreditsSlide = {
  _key?: string
  slideType: 'credits'
  background?: SlideBackground
  leftColumn1?: CreditItem[]
  leftColumn2?: CreditItem[]
  text?: string
}

type ProjectSlide = MediaItem | CreditsSlide

type Project = {
  title?: string
  type?: string
  year?: string
  slug?: string
  coverMedia?: MediaItem
  slides?: ProjectSlide[]
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{slug: string}>
}) {
  const {slug} = await params
  const project = await getProjectBySlug<Project | null>(slug)

  if (!project) notFound()

  const slides =
    project.slides && project.slides.length > 0
      ? project.slides
      : project.coverMedia
        ? [project.coverMedia]
        : []

  return (
    <main className={styles.page}>
      <section className={styles.slider}>
        {slides.map((slide, index) => {
          const isBlackBackground = slide.background === 'black'

          if (slide.slideType === 'credits') {
            return (
              <article
                key={slide._key ?? `credits-${index}`}
                className={`${creditsStyles.creditsSlide} ${
                  isBlackBackground ? creditsStyles.dark : creditsStyles.light
                }`}
              >
                <div className={creditsStyles.left}>
                  <div className={creditsStyles.columns}>
                    <div className={creditsStyles.column}>
                      {slide.leftColumn1?.map((item, itemIndex) => (
                        <div
                          key={item._key ?? `left-1-${itemIndex}`}
                          className={creditsStyles.creditRow}
                        >
                          <div className={creditsStyles.role}>{item.role}</div>
                          <div className={creditsStyles.name}>{item.name}</div>
                        </div>
                      ))}
                    </div>

                    <div className={creditsStyles.column}>
                      {slide.leftColumn2?.map((item, itemIndex) => (
                        <div
                          key={item._key ?? `left-2-${itemIndex}`}
                          className={creditsStyles.creditRow}
                        >
                          <div className={creditsStyles.role}>{item.role}</div>
                          <div className={creditsStyles.name}>{item.name}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className={creditsStyles.right}>
                  <div className={creditsStyles.text}>{slide.text}</div>
                </div>
              </article>
            )
          }

          const fitMode = slide.fitMode === 'cover' ? 'cover' : 'contain'

          const imageUrl =
            slide.mediaType === 'image' && slide.image
              ? urlFor(slide.image).width(2200).quality(90).url()
              : null

          const videoUrl =
            slide.mediaType === 'video' ? slide.video?.asset?.url : null

          return (
            <article
              key={slide._key ?? `slide-${index}`}
              className={`${styles.slide} ${
                isBlackBackground ? styles.slideBlack : styles.slideWhite
              }`}
            >
              {videoUrl ? (
                <LazyVideo
                  src={videoUrl}
                  className={styles.media}
                  priority={index === 0}
                  fitMode={fitMode}
                />
              ) : imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={project.title || 'Project slide'}
                  fill
                  className={styles.media}
                  style={{objectFit: fitMode}}
                  sizes="100vw"
                  priority={index === 0}
                />
              ) : null}
            </article>
          )
        })}
      </section>

      <div className={styles.bottomBar}>
        <div className={styles.meta}>{project.title || ''}</div>
        <div className={styles.meta}>{project.type || ''}</div>
        <div className={styles.meta}>{project.year || ''}</div>
        <Link href="/" className={styles.backLink}>
          Back
        </Link>
      </div>
    </main>
  )
}