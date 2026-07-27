'use client'

import {useEffect, useMemo, useRef, useState} from 'react'
import {urlFor} from '@/sanity/lib/image'
import LazyVideo from '@/app/LazyVideo'
import type {
  BigTextSlide,
  ColumnMedia,
  CreditsSlide,
  MediaSlide,
  ProjectSlide,
  TechSpecsSlide,
  TwoColumnImageSlide,
  TwoColumnTextSlide,
} from '@/app/version-2/types'
import type {Project} from './types'
import styles from './imageSlider.module.css'

function isCreditsSlide(slide: ProjectSlide): slide is CreditsSlide {
  return (slide as CreditsSlide).slideType === 'credits'
}

function isBigTextSlide(slide: ProjectSlide): slide is BigTextSlide {
  return (slide as BigTextSlide).slideType === 'bigText'
}

function isTwoColumnTextSlide(slide: ProjectSlide): slide is TwoColumnTextSlide {
  return (slide as TwoColumnTextSlide).slideType === 'twoColumnText'
}

function isTechSpecsSlide(slide: ProjectSlide): slide is TechSpecsSlide {
  return (slide as TechSpecsSlide).slideType === 'techSpecs'
}

function isTwoColumnImageSlide(slide: ProjectSlide): slide is TwoColumnImageSlide {
  return (slide as TwoColumnImageSlide).slideType === 'twoColumnImage'
}

// The previous/current/next slide (relative to whichever slide is centered
// in the scroll viewport) always mount their <img>/<video> — that's the
// floor. But index distance alone isn't a good proxy for "off screen": short
// slides mean "two away" can still be visibly on screen, and popping those
// out mid-scroll is exactly the jump this is trying to avoid.
//
// An earlier version tried to patch this with a second, independent
// IntersectionObserver per slide — but that runs on its own async callback
// cadence, racing against the scroll-driven index calculation below, so a
// slide could briefly fall out of both checks at once and still visibly pop.
// Computing everything in the same synchronous pass (below) removes that
// race entirely: every slide whose box actually overlaps the viewport (plus
// a buffer) is included in the render range, full stop.
const RENDER_WINDOW = 1

function Slide({
  slide,
  shouldRender,
  slideRef,
}: {
  slide: MediaSlide
  shouldRender: boolean
  slideRef: (el: HTMLDivElement | null) => void
}) {
  // A width/height *ratio*, not a raw pixel height — locked in once and
  // never touched again, so a slide's box is exactly the same size whether
  // its media is mounted or not. That's what actually stops the jump: it's
  // not about timing the unmount precisely, it's that resizing the box in
  // response to mount/unmount is what caused a jump in the first place.
  // Unmounted slides just show empty/black at that same fixed size instead.
  // Ratio (not a fixed pixel height) also means it still adapts correctly
  // if the pane is later resized.
  //
  // Locked from the media's own load-completion event (img onLoad /
  // video onLoadedMetadata) rather than a ResizeObserver on the container:
  // an <img> can report an intermediate box size while still progressively
  // decoding, and locking in that premature size would freeze the slide at
  // the wrong ratio for good. The load event is the real "final size known"
  // signal.
  const [aspectRatio, setAspectRatio] = useState<number | null>(null)

  const setRefs = (el: HTMLDivElement | null) => {
    slideRef(el)
  }

  // A ref callback, not just onLoad: for an already browser-cached image,
  // the `load` event can fire before React finishes attaching the onLoad
  // handler (a well-known React/DOM race), silently dropping it. The ref
  // callback runs synchronously at mount/DOM-attach time, so checking
  // `.complete` here catches the "was already loaded" case onLoad alone
  // would miss; onLoad still covers the normal not-yet-loaded case.
  const checkImageAspectRatio = (el: HTMLImageElement | null) => {
    if (el && el.complete && el.naturalWidth > 0 && el.naturalHeight > 0) {
      setAspectRatio((current) => current ?? el.naturalWidth / el.naturalHeight)
    }
  }

  return (
    <div
      ref={setRefs}
      className={styles.slide}
      data-locked={aspectRatio !== null || undefined}
      style={aspectRatio !== null ? {aspectRatio} : shouldRender ? undefined : {aspectRatio: 16 / 9}}
    >
      {shouldRender &&
        (slide.mediaType === 'video' && slide.video?.asset?.url ? (
          <LazyVideo
            src={slide.video.asset.url}
            className={styles.media}
            fitMode={slide.fitMode === 'cover' ? 'cover' : 'contain'}
            // This <LazyVideo> only exists in the DOM while shouldRender is
            // already true — that's the lazy-loading. Without an explicit
            // `active`, LazyVideo runs its own independent
            // IntersectionObserver on top of that to decide when to attach
            // `src`, which can string together its own activate/deactivate
            // cycle out of step with this component's mount, leaving
            // onLoadedMetadata reporting an empty/reset video's metadata.
            active
            onLoadedMetadata={
              aspectRatio === null
                ? ({videoWidth, videoHeight}) => {
                    if (videoWidth > 0 && videoHeight > 0) setAspectRatio(videoWidth / videoHeight)
                  }
                : undefined
            }
          />
        ) : slide.mediaType === 'image' && slide.image ? (
          <img
            ref={checkImageAspectRatio}
            className={styles.media}
            style={{objectFit: slide.fitMode === 'cover' ? 'cover' : 'contain'}}
            src={urlFor(slide.image).width(1600).quality(80).url()}
            alt=""
            // Not loading="lazy": this <img> only exists in the DOM while
            // the render-window logic above has already decided it should
            // (that's the lazy-loading), so the browser's own independent
            // "is it near the viewport yet" heuristic just adds an
            // uncoordinated second delay on top — one that can push the
            // fetch (and the onLoad below) past the point this slide gets
            // virtualized out again, so the aspect-ratio lock never lands.
            onLoad={(event) => checkImageAspectRatio(event.currentTarget)}
          />
        ) : null)}
    </div>
  )
}

function BigText({slide, slideRef}: {slide: BigTextSlide; slideRef: (el: HTMLDivElement | null) => void}) {
  return (
    <div ref={slideRef} className={`${styles.slide} ${styles.bigTextSlide}`}>
      <div className={styles.bigText}>{slide.text}</div>
    </div>
  )
}

function TwoColumnText({
  slide,
  slideRef,
}: {
  slide: TwoColumnTextSlide
  slideRef: (el: HTMLDivElement | null) => void
}) {
  return (
    <div ref={slideRef} className={styles.slide}>
      <div className={styles.twoColumnText}>
        <div className={styles.columnTitle}>{slide.title}</div>
        <div className={styles.columnBody}>{slide.text}</div>
      </div>
    </div>
  )
}

function TechSpecs({slide, slideRef}: {slide: TechSpecsSlide; slideRef: (el: HTMLDivElement | null) => void}) {
  return (
    <div ref={slideRef} className={styles.slide}>
      <div className={styles.techSpecs}>
        <div className={styles.columnTitle}>{slide.title}</div>
        <div className={styles.techSpecsRows}>
          {slide.specs?.map((spec, index) => (
            <div className={styles.techSpecsRow} key={spec._key ?? index}>
              <span className={styles.techSpecsLabel}>{spec.label}</span>
              <span>{spec.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// One column's own media — image or video, same dispatch as <Slide>'s
// single-media case. No aspect-ratio tracking needed here: the slide's box
// height is a fixed 90vh (see .twoColumnImagesSlide), so unlike <Slide> its
// size never depends on which media happens to be mounted.
function ColumnMedia({media, fit}: {media?: ColumnMedia; fit: 'cover' | 'contain'}) {
  if (media?.mediaType === 'video' && media.video?.asset?.url) {
    return <LazyVideo src={media.video.asset.url} className={styles.twoColumnImage} fitMode={fit} active />
  }

  if (media?.mediaType === 'image' && media.image) {
    return (
      <img
        className={styles.twoColumnImage}
        style={{objectFit: fit}}
        src={urlFor(media.image).width(1200).quality(80).url()}
        alt=""
      />
    )
  }

  return null
}

function TwoColumnImages({
  slide,
  shouldRender,
  slideRef,
}: {
  slide: TwoColumnImageSlide
  shouldRender: boolean
  slideRef: (el: HTMLDivElement | null) => void
}) {
  const fit = slide.fitMode === 'contain' ? 'contain' : 'cover'

  return (
    <div ref={slideRef} className={`${styles.slide} ${styles.twoColumnImagesSlide}`}>
      {shouldRender && (
        <div className={styles.twoColumnImages}>
          <ColumnMedia media={slide.leftColumn} fit={fit} />
          <ColumnMedia media={slide.rightColumn} fit={fit} />
        </div>
      )}
    </div>
  )
}

// Computes one contiguous render range per scroll/resize: the closest slide
// to the container's center (±RENDER_WINDOW) union'd with whatever slides'
// boxes actually overlap the viewport plus a half-viewport buffer on each
// side. Slide heights vary (each sized by its own media's aspect ratio), so
// this is measured directly off the DOM rather than computed from a fixed
// row height.
function SlideList({slides, loading}: {slides: ProjectSlide[]; loading: boolean}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const slideEls = useRef<(HTMLDivElement | null)[]>([])
  const [renderRange, setRenderRange] = useState<[number, number]>([0, RENDER_WINDOW])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Right after a 'scroll' event fires, getBoundingClientRect() can
    // transiently read a few hundred pixels behind the actual scroll
    // position (a browser/compositor timing quirk, not a bug here —
    // confirmed via direct DOM-node identity checks: the ref and a fresh
    // querySelectorAll always point at the same element, just with
    // momentarily different geometry). A tight buffer lets that gap briefly
    // exclude an on-screen slide, popping it out mid-scroll. A full-viewport
    // buffer absorbs it reliably — but holding that buffer permanently
    // mounts far more than necessary once the scroll has actually settled.
    // So: generous buffer immediately on every scroll event (no jump while
    // moving), then a tighter one once scrolling has been idle for a bit
    // (reclaims memory at rest, when the timing quirk isn't in play).
    const SCROLL_BUFFER_RATIO = 1
    const IDLE_BUFFER_RATIO = 0.5
    const IDLE_DELAY_MS = 300

    const measure = (bufferRatio: number) => {
      const containerRect = container.getBoundingClientRect()
      const containerCenter = containerRect.top + containerRect.height / 2
      const buffer = containerRect.height * bufferRatio
      const visibleTop = containerRect.top - buffer
      const visibleBottom = containerRect.bottom + buffer

      let closestIndex = 0
      let closestDistance = Infinity
      let minVisible = Infinity
      let maxVisible = -Infinity

      slideEls.current.forEach((el, index) => {
        if (!el) return
        const rect = el.getBoundingClientRect()
        const center = rect.top + rect.height / 2
        const distance = Math.abs(center - containerCenter)
        if (distance < closestDistance) {
          closestDistance = distance
          closestIndex = index
        }
        if (rect.bottom > visibleTop && rect.top < visibleBottom) {
          minVisible = Math.min(minVisible, index)
          maxVisible = Math.max(maxVisible, index)
        }
      })

      const from = Math.min(closestIndex - RENDER_WINDOW, minVisible === Infinity ? closestIndex : minVisible)
      const to = Math.max(closestIndex + RENDER_WINDOW, maxVisible === -Infinity ? closestIndex : maxVisible)
      setRenderRange((current) => (current[0] === from && current[1] === to ? current : [from, to]))
    }

    // Not rAF-throttled: an extra async hop between a 'scroll' event and the
    // measurement is one more place the DOM can race ahead of the render
    // range. A handful of getBoundingClientRect() calls is cheap enough to
    // run straight off every scroll event.
    let idleTimer: ReturnType<typeof setTimeout>
    const handleScroll = () => {
      measure(SCROLL_BUFFER_RATIO)
      clearTimeout(idleTimer)
      idleTimer = setTimeout(() => measure(IDLE_BUFFER_RATIO), IDLE_DELAY_MS)
    }

    measure(IDLE_BUFFER_RATIO)
    container.addEventListener('scroll', handleScroll, {passive: true})
    const resizeObserver = new ResizeObserver(handleScroll)
    resizeObserver.observe(container)
    return () => {
      container.removeEventListener('scroll', handleScroll)
      resizeObserver.disconnect()
      clearTimeout(idleTimer)
    }
  }, [slides.length])

  if (slides.length === 0) {
    return (
      <div className={styles.scrollSlider}>
        <div className={styles.placeholder}>{loading ? 'Loading…' : 'No additional slides'}</div>
      </div>
    )
  }

  return (
    <div className={styles.scrollSlider} ref={containerRef}>
      {slides.map((slide, index) => {
        const shouldRender = index >= renderRange[0] && index <= renderRange[1]
        const slideRef = (el: HTMLDivElement | null) => {
          slideEls.current[index] = el
        }
        const key = slide._key ?? index

        if (isBigTextSlide(slide)) {
          return <BigText key={key} slide={slide} slideRef={slideRef} />
        }
        if (isTwoColumnTextSlide(slide)) {
          return <TwoColumnText key={key} slide={slide} slideRef={slideRef} />
        }
        if (isTechSpecsSlide(slide)) {
          return <TechSpecs key={key} slide={slide} slideRef={slideRef} />
        }
        if (isTwoColumnImageSlide(slide)) {
          return <TwoColumnImages key={key} slide={slide} shouldRender={shouldRender} slideRef={slideRef} />
        }

        return (
          <Slide key={key} slide={slide as MediaSlide} shouldRender={shouldRender} slideRef={slideRef} />
        )
      })}
    </div>
  )
}

function CoverMedia({project}: {project: Project}) {
  const cover = project.coverMedia
  if (!cover) return null

  const fit = cover.fitMode === 'cover' ? 'cover' : 'contain'

  if (cover.mediaType === 'video' && cover.video?.asset?.url) {
    return <LazyVideo src={cover.video.asset.url} className={styles.centerMedia} fitMode={fit} />
  }

  if (cover.mediaType === 'image' && cover.image) {
    return (
      <img
        className={styles.centerMedia}
        style={{objectFit: fit}}
        src={urlFor(cover.image).width(1600).quality(80).url()}
        alt=""
      />
    )
  }

  return null
}

export default function ImageSlider({
  projects,
  activeProject,
  hoveredProject,
  onOpenProject,
}: {
  projects: Project[]
  activeProject: Project | null
  hoveredProject: Project | null
  onOpenProject: (slug?: string) => void
}) {
  const [slides, setSlides] = useState<ProjectSlide[] | null>(null)
  const cache = useRef(new Map<string, ProjectSlide[]>())
  const [hoverIndex, setHoverIndex] = useState(0)
  const stageRef = useRef<HTMLDivElement | null>(null)

  const coverProjects = useMemo(() => projects.filter((project) => project.coverMedia), [projects])

  // Idle stage: cursor X position (as a ratio of the stage width) selects
  // which cover is shown, splitting the stage into one segment per project —
  // left edge is the first cover, right edge the last.
  const handleStageMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (coverProjects.length <= 1) return
    const rect = event.currentTarget.getBoundingClientRect()
    const ratio = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1)
    setHoverIndex(Math.min(Math.floor(ratio * coverProjects.length), coverProjects.length - 1))
  }

  useEffect(() => {
    const slug = activeProject?.slug
    if (!slug) return

    const cached = cache.current.get(slug)
    if (cached) {
      setSlides(cached)
      return
    }

    const controller = new AbortController()
    setSlides(null)

    fetch(`/api/projects/${encodeURIComponent(slug)}/slides`, {signal: controller.signal})
      .then((res) => res.json())
      .then((data: {slides?: ProjectSlide[]}) => {
        const result = data.slides ?? []
        cache.current.set(slug, result)
        setSlides(result)
      })
      .catch(() => {})

    return () => controller.abort()
  }, [activeProject?.slug])

  // ----- a project row is open: scrollable list of that project's slides -----
  if (activeProject) {
    const renderableSlides = (slides ?? []).filter((slide) => !isCreditsSlide(slide))
    return <SlideList slides={renderableSlides} loading={slides === null} />
  }

  // ----- hovering a row (nothing open): show that project's cover, centered, static -----
  if (hoveredProject) {
    return (
      <div className={styles.centerStage} onClick={() => onOpenProject(hoveredProject.slug)}>
        <CoverMedia project={hoveredProject} />
      </div>
    )
  }

  // ----- idle: cursor X position picks the cover; click opens that project -----
  if (coverProjects.length === 0) return <div className={styles.centerStage} />

  const current = coverProjects[Math.min(hoverIndex, coverProjects.length - 1)]

  return (
    <div
      ref={stageRef}
      className={styles.centerStage}
      onMouseMove={handleStageMouseMove}
      onClick={() => onOpenProject(current.slug)}
    >
      <CoverMedia project={current} />
    </div>
  )
}
