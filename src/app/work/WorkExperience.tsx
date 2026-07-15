'use client'

import {useMemo, useState} from 'react'
import type {SanityImageSource} from '@sanity/image-url'
import {urlFor} from '@/sanity/lib/image'
import IntroSlideshow from './IntroSlideshow'
import InfoMenu, {type WorkProjectInfo} from './InfoMenu'
import SectionSlides from './SectionSlides'
import type {WorkMediaCell, WorkSection, WorkSlide} from './page'
import styles from './work.module.css'

const cellsOf = (slide: WorkSlide): WorkMediaCell[] =>
  [slide.cellA, slide.cellB, slide.cellC].filter((cell): cell is WorkMediaCell => !!cell)

const isImageCell = (cell: WorkMediaCell): cell is WorkMediaCell & {image: SanityImageSource} =>
  cell.mediaType === 'image' && !!cell.image

const toProjectInfo = (section: WorkSection | undefined): WorkProjectInfo | null => {
  if (!section) return null

  const project = [section.projectTitle, section.projectYear && `(${section.projectYear})`]
    .filter(Boolean)
    .join(' ')

  return {
    project,
    web: section.webType ?? '',
    client: section.client ?? '',
  }
}

export default function WorkExperience({sections}: {sections: WorkSection[]}) {
  const introSlides = useMemo(() => {
    return sections
      .flatMap((section) => section.slides ?? [])
      .flatMap(cellsOf)
      .filter(isImageCell)
      .map((cell, index) => ({
        key: `intro-${index}`,
        url: urlFor(cell.image).width(1600).quality(80).url(),
        alt: '',
      }))
  }, [sections])

  const [showIntro, setShowIntro] = useState(introSlides.length > 0)
  const [activeSectionId, setActiveSectionId] = useState<string | null>(sections[0]?._id ?? null)

  const activeIndex = sections.findIndex((section) => section._id === activeSectionId)
  const activeSection = activeIndex === -1 ? sections[0] : sections[activeIndex]

  return (
    <main className={styles.page}>
      {showIntro && (
        <IntroSlideshow slides={introSlides} onDone={() => setShowIntro(false)} />
      )}

      <InfoMenu projectInfo={toProjectInfo(activeSection)} />

      <div className={styles.scroller}>
        {sections.map((section, index) => (
          <SectionSlides
            key={section._id}
            section={section}
            onActive={setActiveSectionId}
            shouldLoad={Math.abs(index - activeIndex) <= 1}
          />
        ))}
      </div>
    </main>
  )
}
