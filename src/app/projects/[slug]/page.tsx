import Image from 'next/image'
import Link from 'next/link'
import type {SanityImageSource} from '@sanity/image-url'
import {notFound} from 'next/navigation'
import {getProjectBySlug} from '@/sanity/lib/fetch'
import {urlFor} from '@/sanity/lib/image'
import styles from './page.module.css'

type MediaItem = {
  mediaType?: 'image' | 'video'
  fitMode?: 'contain' | 'cover'
  image?: SanityImageSource
  video?: {
    asset?: {
      url?: string
      originalFilename?: string
      mimeType?: string
    }
  }
}

type Project = {
  title?: string
  type?: string
  year?: string
  slug?: string
  coverMedia?: MediaItem
  slides?: MediaItem[]
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
          const fitMode = slide.fitMode === 'cover' ? 'cover' : 'contain'
          const imageUrl =
            slide.mediaType === 'image' && slide.image
              ? urlFor(slide.image).width(2200).quality(90).url()
              : null

          const videoUrl =
            slide.mediaType === 'video' ? slide.video?.asset?.url : null

          return (
            <article key={index} className={styles.slide}>
              {videoUrl ? (
                <video
                  className={styles.media}
                  style={{objectFit: fitMode}}
                  src={videoUrl}
                  autoPlay
                  muted
                  loop
                  playsInline
                  controls={false}
                  preload={index === 0 ? 'auto' : 'metadata'}
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