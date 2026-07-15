import Image from 'next/image'
import Link from 'next/link'
import type {SanityImageSource} from '@sanity/image-url'
import {getHomePageData} from '@/sanity/lib/fetch'
import {urlFor} from '@/sanity/lib/image'
import styles from './page.module.css'
import LazyVideo from '@/app/LazyVideo'
import ThemeToggle from '@/app/ThemeToggle'

type Award = {
  name?: string
  result?: string
  year?: string
}

type GraphicTool = {
  label?: string
  url?: string
}

type SiteSettings = {
  title?: string
  intro?: string
  location?: string
  email?: string
  instagram?: string
  awards?: Award[]
  graphicTools?: GraphicTool[]
}

type CoverMedia = {
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

type Project = {
  _id: string
  title?: string
  slug?: string
  type?: string
  year?: string
  excerpt?: string
  featured?: boolean
  coverMedia?: CoverMedia
}

type HomePageData = {
  siteSettings?: SiteSettings
  projects?: Project[]
}

const fallbackAwards: Award[] = [
  {name: 'Joseph Binder Awards', result: 'Silber', year: '2025'},
  {name: 'Type Directors Club', result: 'Judges Choice', year: '2025'},
  {name: 'Creative Club Austria', result: 'Shortlist', year: '2025'},
]

const fallbackGraphicTools: GraphicTool[] = [
  {label: 'Stretch A-Z'},
  {label: 'OFS'},
]

export default async function HomePage() {
  const data = await getHomePageData<HomePageData>()
  const site = data?.siteSettings
  const projects = data?.projects ?? []
  const awards = site?.awards?.length ? site.awards : fallbackAwards
  const graphicTools =
    site?.graphicTools?.length ? site.graphicTools : fallbackGraphicTools

  const email = site?.email || 'ivan@sukhov.xyz'
  const instagram = site?.instagram || 'https://www.instagram.com/sukhov.xyz/'

  return (
    <main className={styles.page}>
      <ThemeToggle />
      <div className={styles.layout}>
        <section className={styles.leftColumn}>
          <div className={styles.projectList}>
            {projects.map((project, index) => {
              const imageUrl =
                project.coverMedia?.mediaType === 'image' && project.coverMedia.image
                  ? urlFor(project.coverMedia.image).width(2400).quality(90).url()
                  : null

              const videoUrl =
                project.coverMedia?.mediaType === 'video'
                  ? project.coverMedia.video?.asset?.url
                  : null

              return (
                <Link
                  key={project._id}
                  href={project.slug ? `/projects/${project.slug}` : '#'}
                  className={styles.projectCardLink}
                >
                  <article className={styles.projectCard}>
                    <div className={styles.projectImageWrap}>
                      {videoUrl ? (
                        <LazyVideo
                          src={videoUrl}
                          className={styles.projectVideo}
                          priority={index === 0}
                        />
                      ) : imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={project.title || 'Project cover'}
                          fill
                          className={styles.projectImage}
                          sizes="(max-width: 1024px) 100vw, 67vw"
                          priority={index === 0}
                        />
                      ) : (
                        <div className={styles.projectImageFallback}>No media yet</div>
                      )}
                    </div>

                    <div className={styles.projectMeta}>
                      <div>{project.title || 'Untitled project'}</div>
                      <div className={styles.projectMetaMuted}>
                        {project.type || 'Project'}
                      </div>
                      <div className={styles.projectMetaMuted}>{project.year || ''}</div>
                    </div>
                  </article>
                </Link>
              )
            })}
          </div>
        </section>

        <aside className={styles.rightColumn}>
          <div className={styles.sidebarInner}>
            <div className={styles.sidebarTop}>
              <div className={styles.topBar}>
                <div>Ivan Sukhov</div>
                <div>
                  <a href={`mailto:${email}`} className={styles.inlineLink}>
                    E-Mail
                  </a>
                  ,{' '}
                  <a
                    href={instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.inlineLink}
                  >
                    Instagram
                  </a>{' '}
                  &copy; 2025
                </div>
              </div>

              <div className={styles.intro}>
                {site?.intro ? (
                  site.intro
                ) : (
                  <span>
                    Brand and Web Designer working across brand strategy, concept
                    development, visual identity, web design, and web development.{' '}
                    Cofounder of{' '}
                    <a
                      href="https://o-g-o.studio"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.inlineLink}
                    >
                      o-g-o.studio
                    </a>
                    . Based in Linz, Austria. Available for enquiries, collaborations.
                  </span>
                )}
              </div>
            </div>

            <div className={styles.bottomInfo}>
              <div className={styles.awardsWrap}>
                <div className={styles.sectionLabel}>Awards:</div>

                <div className={styles.awardsContent}>
                  <div className={styles.awardsNames}>
                    {awards.map((award, index) => (
                      <div key={`name-${award.name}-${index}`}>{award.name}</div>
                    ))}
                  </div>

                  <div className={styles.awardsResults}>
                    {awards.map((award, index) => (
                      <div key={`result-${award.name}-${index}`}>{award.result}</div>
                    ))}
                  </div>

                  <div className={styles.awardsYears}>
                    {awards.map((award, index) => (
                      <div key={`year-${award.name}-${index}`}>{award.year}</div>
                    ))}
                  </div>
                </div>
              </div>

              <div className={styles.contactBlock}>
                <div className={styles.sectionLabel}>Graphic Tools:</div>

                <div className={styles.contactLinks}>
                  {graphicTools.map((tool, index) =>
                    tool.url ? (
                      <a
                        key={`${tool.label}-${index}`}
                        href={tool.url}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.contactLink}
                      >
                        {tool.label || 'Untitled tool'}
                      </a>
                    ) : (
                      <span key={`${tool.label}-${index}`}>
                        {tool.label || 'Untitled tool'}
                      </span>
                    ),
                  )}
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  )
}