'use client'

import {useEffect, useRef, useState} from 'react'
import Image from 'next/image'
import {urlFor} from '@/sanity/lib/image'
import LazyVideo from '@/app/LazyVideo'
import type {WorkMediaCell, WorkSection, WorkSlideLayout} from './page'
import styles from './work.module.css'

const SWIPE_THRESHOLD_PX = 40

const layoutClass: Record<WorkSlideLayout, string> = {
  single: styles.layoutSingle,
  twoColumns: styles.layoutTwoColumns,
  twoRows: styles.layoutTwoRows,
  leftRightStack: styles.layoutLeftRightStack,
  topBottomSplit: styles.layoutTopBottomSplit,
}

function Cell({
  cell,
  cellClassName,
  priority,
  active,
}: {
  cell: WorkMediaCell | undefined
  cellClassName: string
  priority: boolean
  active: boolean
}) {
  if (!cell) return null

  const imageUrl =
    cell.mediaType === 'image' && cell.image
      ? urlFor(cell.image).width(2400).quality(90).url()
      : null
  const videoUrl = cell.mediaType === 'video' ? cell.video?.asset?.url : null

  return (
    <div className={cellClassName}>
      {videoUrl ? (
        <LazyVideo
          src={videoUrl}
          className={styles.media}
          priority={priority}
          fitMode="cover"
          active={active}
        />
      ) : imageUrl ? (
        <Image
          src={imageUrl}
          alt=""
          fill
          className={styles.media}
          style={{objectFit: 'cover'}}
          sizes="100vw"
          priority={priority}
        />
      ) : null}
    </div>
  )
}

export default function SectionSlides({
  section,
  onActive,
  shouldLoad,
}: {
  section: WorkSection
  onActive: (sectionId: string) => void
  shouldLoad: boolean
}) {
  const slides = section.slides ?? []
  const [activeIndex, setActiveIndex] = useState(0)
  const touchStartX = useRef<number | null>(null)
  const sectionRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onActive(section._id)
      },
      {threshold: 0.6},
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [onActive, section._id])

  if (slides.length === 0) return null

  const goTo = (direction: 1 | -1) => {
    setActiveIndex((index) => (index + direction + slides.length) % slides.length)
  }

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (slides.length < 2) return
    const bounds = event.currentTarget.getBoundingClientRect()
    const isLeftHalf = event.clientX - bounds.left < bounds.width / 2
    goTo(isLeftHalf ? -1 : 1)
  }

  const handleTouchStart = (event: React.TouchEvent<HTMLElement>) => {
    touchStartX.current = event.touches[0].clientX
    onActive(section._id)
  }

  const handleTouchEnd = (event: React.TouchEvent<HTMLElement>) => {
    if (touchStartX.current === null || slides.length < 2) return
    const deltaX = event.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(deltaX) > SWIPE_THRESHOLD_PX) {
      goTo(deltaX < 0 ? 1 : -1)
    }
    touchStartX.current = null
  }

  return (
    <section
      ref={sectionRef}
      className={styles.section}
      onClick={handleClick}
      onMouseEnter={() => onActive(section._id)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {slides.map((slide, index) => {
        const isPriority = index === 0

        return (
          <div
            key={slide._key ?? `${section._id}-${index}`}
            className={`${styles.slide} ${index === activeIndex ? styles.slideActive : ''}`}
          >
            <div className={`${styles.slideGrid} ${layoutClass[slide.layout ?? 'single']}`}>
              <Cell
                cell={slide.cellA}
                cellClassName={styles.cellA}
                priority={isPriority}
                active={shouldLoad}
              />
              <Cell
                cell={slide.cellB}
                cellClassName={styles.cellB}
                priority={isPriority}
                active={shouldLoad}
              />
              <Cell
                cell={slide.cellC}
                cellClassName={styles.cellC}
                priority={isPriority}
                active={shouldLoad}
              />
            </div>
          </div>
        )
      })}
    </section>
  )
}
