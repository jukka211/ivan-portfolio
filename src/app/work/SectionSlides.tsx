'use client'

import {useEffect, useRef, useState} from 'react'
import Image from 'next/image'
import {urlFor} from '@/sanity/lib/image'
import LazyVideo from '@/app/LazyVideo'
import type {WorkSection} from './page'
import styles from './work.module.css'

const SWIPE_THRESHOLD_PX = 40

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
        const imageUrl =
          slide.mediaType === 'image' && slide.image
            ? urlFor(slide.image).width(2400).quality(90).url()
            : null
        const videoUrl = slide.mediaType === 'video' ? slide.video?.asset?.url : null

        return (
          <div
            key={slide._key ?? `${section._id}-${index}`}
            className={`${styles.slide} ${index === activeIndex ? styles.slideActive : ''}`}
          >
            {videoUrl ? (
              <LazyVideo
                src={videoUrl}
                className={styles.media}
                priority={index === 0}
                fitMode="cover"
                active={shouldLoad}
              />
            ) : imageUrl ? (
              <Image
                src={imageUrl}
                alt=""
                fill
                className={styles.media}
                style={{objectFit: 'cover'}}
                sizes="100vw"
                priority={index === 0}
              />
            ) : null}
          </div>
        )
      })}
    </section>
  )
}
