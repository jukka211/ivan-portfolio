'use client'

import {useRef, useState} from 'react'
import Link from 'next/link'
import ProjectRow from './ProjectRow'
import ImageSlider from './ImageSlider'
import ServicesPanel from './ServicesPanel'
import styles from './version3.module.css'
import type {Award, Project, ServiceItem, SiteSettings} from './types'

const fallbackAwards: Award[] = [
  {name: 'Creative Club Austria', result: 'Silber', year: '2026'},
  {name: 'Type Directors Club', result: 'Judges Choice', year: '2025'},
  {name: 'Creative Club Austria', result: 'Shortlist', year: '2025'},
  {name: 'Joseph Binder Awards', result: 'Silber', year: '2025'},
]

// Mirrors the `services` field's Studio initialValue — shown until the
// (already-existing) siteSettings document is edited in Studio to add it.
const fallbackServices: ServiceItem[] = [
  {label: 'Brand Identity Systems'},
  {label: 'Web Design, UX Analyse & Strategy'},
  {label: 'Generative Brand Tools'},
]

export default function Version3Page({
  siteSettings,
  projects,
}: {
  siteSettings?: SiteSettings
  projects: Project[]
}) {
  const [openSlug, setOpenSlug] = useState<string | null>(null)
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null)
  // Whether the right pane shows the Services Details panel instead of the
  // image slider — mutually exclusive with an open project (each closes
  // the other so the right pane never has to arbitrate between them).
  const [showServicesDetails, setShowServicesDetails] = useState(false)
  // Which of the Services Details statements is drilled into (null = the
  // top-level list). Owned here, not inside ServicesPanel, so a left-column
  // service row click can always snap it back to the list.
  const [activeServiceIndex, setActiveServiceIndex] = useState<number | null>(null)
  // Which service's own breakdown the top-level list should show — each
  // service row opens its own set of statements, not a shared generic list.
  const [activeServiceLabel, setActiveServiceLabel] = useState<string | null>(null)
  // Pane width (columns vs. image slider) is a separate, explicit choice —
  // only the toggle icon in the right pane's corner resizes them; opening a
  // project row no longer does this on its own.
  const [paneExpanded, setPaneExpanded] = useState(false)

  // Mobile carousel: `.leftPane` (Info/Lists, combined) and `.rightPane`
  // (Gallery) become one-screen-at-a-time snap panels (see
  // version3.module.css's max-width:1100px query). These refs let the nav
  // bar and "open a project" jump between them without any pixel math —
  // scrollIntoView finds their own nearest scrollable ancestor (`.page`)
  // and snaps to it.
  const rightPaneRef = useRef<HTMLDivElement | null>(null)
  const leftPaneRef = useRef<HTMLDivElement | null>(null)
  // Which panel the nav bar should highlight as selected — derived from
  // `.page`'s own scroll position rather than tracked independently, so it
  // stays correct through nav taps, project-open auto-scrolls, and raw
  // swipes alike.
  const [activePanel, setActivePanel] = useState<'gallery' | 'info'>('info')

  const scrollToPanel = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({behavior: 'smooth', inline: 'start', block: 'nearest'})
  }

  const handlePageScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const el = event.currentTarget
    setActivePanel(el.scrollLeft >= el.clientWidth / 2 ? 'gallery' : 'info')
  }

  const email = siteSettings?.email || 'ivan@sukhov.xyz'
  const instagram = siteSettings?.instagram || 'https://www.instagram.com/sukhov.xyz/'
  const awards = siteSettings?.awards?.length ? siteSettings.awards : fallbackAwards
  const services = siteSettings?.services?.length ? siteSettings.services : fallbackServices

  const openProject = projects.find((project) => project.slug === openSlug) ?? null
  const hoveredProject = projects.find((project) => project.slug === hoveredSlug) ?? null

  const toggleProject = (slug?: string) => {
    if (!slug) return
    const opening = openSlug !== slug
    setOpenSlug((current) => (current === slug ? null : slug))
    setShowServicesDetails(false)
    // On mobile, opening a project is the point of the tap — jump straight
    // to the slides instead of leaving the user on a now-expanded list row
    // they'd have to swipe twice to see the result of.
    if (opening && window.matchMedia('(max-width: 1100px)').matches) {
      scrollToPanel(rightPaneRef)
    }
  }

  const openServicesDetails = (label: string) => {
    setShowServicesDetails(true)
    setActiveServiceIndex(null)
    setActiveServiceLabel(label)
    setOpenSlug(null)
  }

  const openSendRequestForm = () => {
    setShowServicesDetails(true)
    setActiveServiceLabel(null)
    setActiveServiceIndex(0)
    setOpenSlug(null)
    if (window.matchMedia('(max-width: 1100px)').matches) {
      scrollToPanel(rightPaneRef)
    }
  }

  return (
    <div className={styles.root}>
      {/* mobile only (see version3.module.css); a fixed sibling of .page so
          it stays put while .page itself scrolls horizontally underneath it. */}
      <nav className={styles.mobileNav}>
        <button
          type="button"
          className={styles.mobileNavItem}
          data-active={activePanel === 'info' ? 'true' : undefined}
          onClick={() => scrollToPanel(leftPaneRef)}
        >
          Info Lists
        </button>
        <button
          type="button"
          className={styles.mobileNavItem}
          data-active={activePanel === 'gallery' ? 'true' : undefined}
          onClick={() => scrollToPanel(rightPaneRef)}
        >
          Gallery
        </button>
      </nav>

      <main
        className={styles.page}
        data-expanded={paneExpanded ? 'true' : undefined}
        onScroll={handlePageScroll}
      >
        <div className={styles.leftPane} ref={leftPaneRef}>
          <div className={styles.infoColumn}>
            <div className={styles.row}>
              <button
                type="button"
                className={`${styles.gutter} ${styles.titleButton}`}
                onClick={() => window.location.reload()}
              >
                {siteSettings?.title || 'Ivan Sukhov'}
              </button>
              <div className={styles.intro}>
                {siteSettings?.intro ||
                  'Brand and Web Designer working across brand strategy, concept development, visual identity, web design, and web development. Based in Linz, Austria. Available for enquiries, collaborations, and selected projects.'}
              </div>
            </div>

            <div className={styles.contactList}>
              <a href={`mailto:${email}`} className={styles.dataRow}>
                <span className={styles.gutter}>Contact</span>
                <span>E-Mail</span>
              </a>
              <a
                href={instagram}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.dataRow}
              >
                <span className={styles.gutter} />
                <span>Instagram</span>
              </a>
              <button type="button" className={styles.dataRow} onClick={openSendRequestForm}>
                <span className={styles.gutter} />
                <span>Send Request</span>
              </button>
            </div>

            <div className={styles.legalList}>
              <Link href="/legal" className={styles.dataRow}>
                <span className={`${styles.gutter} ${styles.legalGutter}`} />
                <span>© {new Date().getFullYear()}, Legal</span>
              </Link>
            </div>
          </div>

          <div className={styles.listColumn}>
            <section className={styles.projects}>
              {projects.map((project, index) => (
                <ProjectRow
                  key={project._id}
                  project={project}
                  sectionLabel={index === 0 ? 'Projects:' : undefined}
                  isOpen={project.slug === openSlug}
                  onToggle={() => toggleProject(project.slug)}
                  onHoverChange={(hovering) =>
                    setHoveredSlug((current) => {
                      if (hovering) return project.slug ?? current
                      return current === project.slug ? null : current
                    })
                  }
                />
              ))}
            </section>

            <section className={styles.awards}>
              {awards.map((award, index) => {
                const row = (
                  <>
                    <span className={styles.gutter}>{index === 0 ? 'Awards:' : ''}</span>
                    <div className={styles.infoGrid}>
                      <span>{award.name}</span>
                      <span className={styles.muted}>{award.result}</span>
                      <span className={styles.muted}>{award.year}</span>
                    </div>
                  </>
                )

                return award.url ? (
                  <a
                    href={award.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.dataRow}
                    key={`${award.name}-${index}`}
                  >
                    {row}
                  </a>
                ) : (
                  <div className={styles.dataRow} key={`${award.name}-${index}`}>
                    {row}
                  </div>
                )
              })}
            </section>

            <section className={styles.services}>
              {services.map((service, index) => (
                <button
                  key={`${service.label}-${index}`}
                  type="button"
                  className={styles.dataRow}
                  onClick={() => openServicesDetails(service.label || '')}
                >
                  <span className={styles.gutter}>{index === 0 ? 'Services:' : ''}</span>
                  <div className={styles.serviceGrid}>
                    <span>{service.label || 'Untitled'}</span>
                    <span className={styles.muted}>Expand</span>
                  </div>
                </button>
              ))}
            </section>
          </div>
        </div>

        <div className={styles.rightPane} ref={rightPaneRef}>
          <button
            type="button"
            className={styles.paneToggle}
            data-expanded={paneExpanded || undefined}
            aria-label={paneExpanded ? 'Collapse gallery pane' : 'Expand gallery pane'}
            aria-pressed={paneExpanded}
            onClick={() => setPaneExpanded((current) => !current)}
          >
            <img src="/Vector.svg" alt="" className={styles.paneToggleIcon} />
          </button>

          {showServicesDetails ? (
            <ServicesPanel
              services={services}
              activeServiceLabel={activeServiceLabel}
              activeIndex={activeServiceIndex}
              onActiveIndexChange={setActiveServiceIndex}
            />
          ) : (
            <ImageSlider
              projects={projects}
              activeProject={openProject}
              hoveredProject={hoveredProject}
              onOpenProject={toggleProject}
            />
          )}
        </div>
      </main>
    </div>
  )
}
