'use client'

import {useEffect, useRef, useState} from 'react'

type LazyVideoProps = {
  src: string
  className?: string
  priority?: boolean
}

export default function LazyVideo({
  src,
  className,
  priority = false,
}: LazyVideoProps) {
  const ref = useRef<HTMLVideoElement | null>(null)
  const [shouldLoad, setShouldLoad] = useState(priority)

  useEffect(() => {
    if (priority || !ref.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: '300px 0px',
        threshold: 0.01,
      },
    )

    observer.observe(ref.current)

    return () => observer.disconnect()
  }, [priority])

  return (
    <video
      ref={ref}
      className={className}
      src={shouldLoad ? src : undefined}
      autoPlay={shouldLoad}
      muted
      loop
      playsInline
      preload={priority ? 'auto' : 'none'}
    />
  )
}