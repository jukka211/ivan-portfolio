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
  const [isActive, setIsActive] = useState(priority)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const activate = () => {
      setIsActive(true)
    }

    const deactivate = () => {
      setIsActive(false)

      if (el) {
        el.pause()
        el.removeAttribute('src')
        el.load()
      }
    }

    if (priority) {
      activate()
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          activate()
        } else {
          deactivate()
        }
      },
      {
        rootMargin: '150px 0px',
        threshold: 0.25,
      },
    )

    observer.observe(el)

    return () => {
      observer.disconnect()
      deactivate()
    }
  }, [priority])

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (isActive) {
      el.src = src
      el.load()

      const playPromise = el.play()
      if (playPromise) {
        playPromise.catch(() => {})
      }
    } else {
      el.pause()
      el.removeAttribute('src')
      el.load()
    }
  }, [isActive, src])

  return (
    <video
      ref={ref}
      className={className}
      muted
      loop
      playsInline
      preload={priority ? 'auto' : 'none'}
    />
  )
}