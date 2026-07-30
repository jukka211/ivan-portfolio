'use client'

import {useEffect, useRef, useState} from 'react'

type LazyVideoProps = {
  src: string
  className?: string
  priority?: boolean
  fitMode?: 'contain' | 'cover'
  rootMargin?: string
  /** When set, bypasses viewport-based lazy loading and directly controls activation. */
  active?: boolean
  /** Shown natively by the browser whenever there's no active `src` — i.e. exactly the deactivated state below. */
  poster?: string
  /** Fires once the video's real dimensions are known (native `loadedmetadata`). */
  onLoadedMetadata?: (dimensions: {videoWidth: number; videoHeight: number}) => void
  /**
   * Fires on the native `playing` event — the point a real frame is actually
   * on screen, not just requested. `preload="none"` means activation always
   * starts a cold fetch, and mobile browsers tend to clear the visible
   * `poster` as soon as `.load()` runs rather than waiting for that frame —
   * leaving a black gap between the two. Callers use this to keep their own
   * poster image layered on top until this fires, papering over that gap.
   */
  onPlaying?: () => void
  /**
   * On mobile (pointer: coarse), skip lazy loading entirely: load and play
   * immediately, never unload, overriding `active`/`priority`. Desktop is
   * unaffected. Off by default — opt in per call site.
   */
  disableLazyLoadOnMobile?: boolean
}

export default function LazyVideo({
  src,
  className,
  priority = false,
  fitMode = 'cover',
  rootMargin = '150px 0px',
  active,
  poster,
  onLoadedMetadata,
  onPlaying,
  disableLazyLoadOnMobile = false,
}: LazyVideoProps) {
  const ref = useRef<HTMLVideoElement | null>(null)
  const [observedActive, setObservedActive] = useState(priority)
  const [bypassForMobile, setBypassForMobile] = useState(false)

  useEffect(() => {
    if (disableLazyLoadOnMobile) setBypassForMobile(window.matchMedia('(pointer: coarse)').matches)
  }, [disableLazyLoadOnMobile])

  const isActive = bypassForMobile ? true : active ?? observedActive

  useEffect(() => {
    if (bypassForMobile) return
    if (active !== undefined) return

    const el = ref.current
    if (!el) return

    const activate = () => {
      setObservedActive(true)
    }

    const deactivate = () => {
      setObservedActive(false)
      el.pause()
      el.removeAttribute('src')
      el.load()
    }

    if (priority) activate()

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) activate()
        else deactivate()
      },
      {
        rootMargin,
        threshold: 0.25,
      },
    )

    observer.observe(el)

    return () => {
      observer.disconnect()
      deactivate()
    }
  }, [priority, rootMargin, active, bypassForMobile])

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (isActive) {
      el.src = src
      el.load()
      const playPromise = el.play()
      if (playPromise) playPromise.catch(() => {})
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
      style={{objectFit: fitMode}}
      muted
      loop
      playsInline
      poster={poster}
      preload={priority || active || bypassForMobile ? 'auto' : 'none'}
      onPlaying={onPlaying}
      onLoadedMetadata={
        onLoadedMetadata
          ? (event) => {
              const el = event.currentTarget
              onLoadedMetadata({videoWidth: el.videoWidth, videoHeight: el.videoHeight})
            }
          : undefined
      }
    />
  )
}
