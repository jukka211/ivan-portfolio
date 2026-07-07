'use client'

import {useEffect, useState} from 'react'
import styles from './IntroSlideshow.module.css'

type Slide = {
  key: string
  url: string
  alt: string
}

const SLIDE_DURATION_MS = 200

export default function IntroSlideshow({
  slides,
  onDone,
}: {
  slides: Slide[]
  onDone: () => void
}) {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (slides.length === 0) {
      onDone()
      return
    }

    const timer = setTimeout(() => {
      if (activeIndex < slides.length - 1) {
        setActiveIndex((index) => index + 1)
      } else {
        onDone()
      }
    }, SLIDE_DURATION_MS)

    return () => clearTimeout(timer)
  }, [activeIndex, slides.length, onDone])

  if (slides.length === 0) return null

  return (
    <div className={styles.intro} onClick={onDone} role="presentation">
      {slides.map((slide, index) => (
        <div
          key={slide.key}
          className={`${styles.slide} ${index === activeIndex ? styles.active : ''}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={slide.url} alt={slide.alt} />
        </div>
      ))}
    </div>
  )
}
