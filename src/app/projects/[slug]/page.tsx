'use client'

import { useEffect, useRef, useState } from 'react'

type Props = {
  src: string
  className?: string
  priority?: boolean
}

export default function LazyVideo({ src, className, priority = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isVisible, setIsVisible] = useState(priority)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)
      },
      { rootMargin: '200px' } // start loading slightly before visible
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Pause and release memory when offscreen
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (isVisible) {
      video.play().catch(() => {})
    } else {
      video.pause()
      video.removeAttribute('src')
      video.load() // releases the decoded buffer
    }
  }, [isVisible])

  return (
    <div ref={containerRef} className={className}>
      {isVisible && (
        <video
          ref={videoRef}
          src={src}
          className={className}
          autoPlay
          loop
          muted
          playsInline
          preload={priority ? 'auto' : 'none'}
        />
      )}
    </div>
  )
}