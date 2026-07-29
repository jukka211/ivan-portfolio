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
  VimeoSlide,
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

function isVimeoSlide(slide: ProjectSlide): slide is VimeoSlide {
  return (slide as VimeoSlide).slideType === 'vimeo'
}

// Whether this slide has a <video> (LazyVideo) somewhere in it that the
// active-video-index logic below (see SlideList) needs to consider — a
// single-media Slide, or either column of a TwoColumnImages slide. Vimeo
// slides don't count: their iframe isn't gated by an `active` prop the way
// LazyVideo is (see the Vimeo component's own comment).
function slideHasVideo(slide: ProjectSlide): boolean {
  if (isTwoColumnImageSlide(slide)) {
    return (
      (slide.leftColumn?.mediaType === 'video' && !!slide.leftColumn.video?.asset?.url) ||
      (slide.rightColumn?.mediaType === 'video' && !!slide.rightColumn.video?.asset?.url)
    )
  }
  if (
    isCreditsSlide(slide) ||
    isBigTextSlide(slide) ||
    isTwoColumnTextSlide(slide) ||
    isTechSpecsSlide(slide) ||
    isVimeoSlide(slide)
  ) {
    return false
  }
  const media = slide as MediaSlide
  return media.mediaType === 'video' && !!media.video?.asset?.url
}

// Editors paste Vimeo's whole Share > Embed snippet (the wrapper <div>,
// <iframe>, and player.js <script>) into one Sanity text field rather than
// picking a video URL/ID apart by hand. Only the iframe's own src and title
// are actually needed to render it here, so this just pulls those two
// attributes back out; the wrapper div and script tag are Vimeo's own
// responsive-sizing trick, which this component does itself via CSS instead.
function parseVimeoEmbed(embedCode?: string): {src: string; title?: string} | null {
  if (!embedCode) return null
  const srcMatch = embedCode.match(/<iframe[^>]*\ssrc=["']([^"']+)["']/i)
  if (!srcMatch) return null
  const titleMatch = embedCode.match(/<iframe[^>]*\stitle=["']([^"']+)["']/i)
  return {
    src: srcMatch[1].replace(/&amp;/g, '&'),
    title: titleMatch?.[1],
  }
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
  isVideoActive,
  slideRef,
}: {
  slide: MediaSlide
  shouldRender: boolean
  isVideoActive: boolean
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
  //
  // A video only fires that load event while it's isVideoActive (see
  // below), which for most video slides is most of the time — so the 16:9
  // placeholder below isn't just a brief flash for them the way it is for
  // images, it's the steady-state box whenever this isn't the active one.
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

  const posterUrl = slide.poster ? urlFor(slide.poster).width(1600).quality(80).url() : undefined

  return (
    <div
      ref={setRefs}
      className={styles.slide}
      data-locked={aspectRatio !== null || undefined}
      // Always a real size, never `undefined` — an inactive video (see
      // isVideoActive below) never fires onLoadedMetadata, so without this
      // fallback its box would collapse to the intrinsic size of an empty
      // <video> (a jump for every slide around it) for as long as it stays
      // inactive, not just briefly while shouldRender is catching up.
      style={aspectRatio !== null ? {aspectRatio} : {aspectRatio: 16 / 9}}
    >
      {shouldRender &&
        (slide.mediaType === 'video' && slide.video?.asset?.url ? (
          <>
            <LazyVideo
              src={slide.video.asset.url}
              className={styles.media}
              fitMode={slide.fitMode === 'cover' ? 'cover' : 'contain'}
              poster={posterUrl}
              // This <LazyVideo> only exists in the DOM while shouldRender is
              // already true — that's the lazy-loading. Without an explicit
              // `active`, LazyVideo runs its own independent
              // IntersectionObserver on top of that to decide when to attach
              // `src`, which can string together its own activate/deactivate
              // cycle out of step with this component's mount, leaving
              // onLoadedMetadata reporting an empty/reset video's metadata.
              //
              // isVideoActive (not just shouldRender) gates actual playback:
              // shouldRender's window is deliberately generous (see SlideList)
              // to avoid a layout pop, so several slides can be mounted at
              // once — but letting all of them decode/play a <video>
              // simultaneously is what was crashing mobile Safari/Chrome
              // (too many concurrent video decoders). Only the single
              // slide nearest the viewport center is ever active.
              active={isVideoActive}
              onLoadedMetadata={
                aspectRatio === null
                  ? ({videoWidth, videoHeight}) => {
                      if (videoWidth > 0 && videoHeight > 0) setAspectRatio(videoWidth / videoHeight)
                    }
                  : undefined
              }
            />
            {!isVideoActive && !posterUrl && <div className={styles.videoPlaceholder}>Video loads…</div>}
          </>
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
// single-media case. Wrapped in its own cell (rather than sizing the
// video/image directly as the grid item) so the "Video loads…" placeholder
// below has something to position itself against.
function ColumnMedia({
  media,
  fit,
  active,
}: {
  media?: ColumnMedia
  fit: 'cover' | 'contain'
  active: boolean
}) {
  if (media?.mediaType === 'video' && media.video?.asset?.url) {
    const posterUrl = media.poster ? urlFor(media.poster).width(1200).quality(80).url() : undefined
    return (
      <div className={styles.twoColumnImageCell}>
        <LazyVideo
          src={media.video.asset.url}
          className={styles.twoColumnImage}
          fitMode={fit}
          active={active}
          poster={posterUrl}
        />
        {!active && !posterUrl && <div className={styles.videoPlaceholder}>Video loads…</div>}
      </div>
    )
  }

  if (media?.mediaType === 'image' && media.image) {
    return (
      <div className={styles.twoColumnImageCell}>
        <img
          className={styles.twoColumnImage}
          style={{objectFit: fit}}
          src={urlFor(media.image).width(1200).quality(80).url()}
          alt=""
        />
      </div>
    )
  }

  return null
}

function TwoColumnImages({
  slide,
  shouldRender,
  isVideoActive,
  slideRef,
}: {
  slide: TwoColumnImageSlide
  shouldRender: boolean
  isVideoActive: boolean
  slideRef: (el: HTMLDivElement | null) => void
}) {
  const fit = slide.fitMode === 'contain' ? 'contain' : 'cover'

  return (
    <div ref={slideRef} className={`${styles.slide} ${styles.twoColumnImagesSlide}`}>
      {shouldRender && (
        <div className={styles.twoColumnImages}>
          <ColumnMedia media={slide.leftColumn} fit={fit} active={isVideoActive} />
          <ColumnMedia media={slide.rightColumn} fit={fit} active={isVideoActive} />
        </div>
      )}
    </div>
  )
}

// Vimeo's iframe is a live embed, not a self-hosted <video> — there's no
// source file to lazily attach the way LazyVideo does for the mediaType:
// 'video' case. It's still gated on `shouldRender` (mount/unmount) so a
// project with several Vimeo slides doesn't spin up every player at once,
// but that's the same virtualization every other media slide already gets,
// nothing Vimeo-specific. The box uses a hardcoded 16:9 aspect-ratio (see
// .vimeoSlide) instead of the load-triggered aspect-ratio lock other slides
// use, since Vimeo embeds are always 16:9 and there's no <video>/<img> load
// event here to hang that measurement off of.
function Vimeo({
  slide,
  shouldRender,
  slideRef,
}: {
  slide: VimeoSlide
  shouldRender: boolean
  slideRef: (el: HTMLDivElement | null) => void
}) {
  const embed = parseVimeoEmbed(slide.embedCode)
  if (!embed) return null

  return (
    <div ref={slideRef} className={`${styles.slide} ${styles.vimeoSlide}`}>
      {shouldRender && (
        <iframe
          src={embed.src}
          className={styles.vimeoIframe}
          allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          title={embed.title || 'Vimeo video'}
        />
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
function SlideList({
  slides,
  loading,
  isTouchDevice,
}: {
  slides: ProjectSlide[]
  loading: boolean
  isTouchDevice: boolean
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const slideEls = useRef<(HTMLDivElement | null)[]>([])
  const [renderRange, setRenderRange] = useState<[number, number]>([0, RENDER_WINDOW])
  // Mobile-only: the one video-bearing slide (nearest viewport center, among
  // slides that actually have a video) allowed to actually play — see the
  // isVideoActive comment on <Slide> for why *touch* devices cap this to
  // one, and why it's only updated once scrolling has gone idle (below).
  // Desktop doesn't have the concurrent-decoder crash this works around, so
  // there every video slide within shouldRender's window just plays (see
  // isVideoActive below), same as before that mobile-only fix existed.
  //
  // Deliberately tracked separately from "closest slide of any type" — on
  // first open (scrollTop 0), the slide nearest true viewport center is
  // often a short text/credits slide, not slide 0 itself, so gating on the
  // single overall-closest slide meant no video ever activated at all if it
  // wasn't literally the closest thing on the page. Restricting the search
  // to video-bearing slides guarantees whichever video is most prominent on
  // screen is the one that plays.
  const [activeVideoIndex, setActiveVideoIndex] = useState(0)
  const videoSlideFlags = useMemo(() => slides.map(slideHasVideo), [slides])

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

    const measure = (bufferRatio: number, updateActiveVideoIndex: boolean) => {
      const containerRect = container.getBoundingClientRect()
      const containerCenter = containerRect.top + containerRect.height / 2
      const buffer = containerRect.height * bufferRatio
      const visibleTop = containerRect.top - buffer
      const visibleBottom = containerRect.bottom + buffer

      let closestIndex = 0
      let closestDistance = Infinity
      let closestVideoIndex = 0
      let closestVideoDistance = Infinity
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
        if (videoSlideFlags[index] && distance < closestVideoDistance) {
          closestVideoDistance = distance
          closestVideoIndex = index
        }
        if (rect.bottom > visibleTop && rect.top < visibleBottom) {
          minVisible = Math.min(minVisible, index)
          maxVisible = Math.max(maxVisible, index)
        }
      })

      const from = Math.min(closestIndex - RENDER_WINDOW, minVisible === Infinity ? closestIndex : minVisible)
      const to = Math.max(closestIndex + RENDER_WINDOW, maxVisible === -Infinity ? closestIndex : maxVisible)
      setRenderRange((current) => (current[0] === from && current[1] === to ? current : [from, to]))
      // Deferred to the idle pass only (see handleScroll) — video playback
      // shouldn't hop from slide to slide on every scroll tick while the
      // user is still actively swiping past them.
      if (updateActiveVideoIndex) {
        setActiveVideoIndex((current) => (current === closestVideoIndex ? current : closestVideoIndex))
      }
    }

    // Not rAF-throttled: an extra async hop between a 'scroll' event and the
    // measurement is one more place the DOM can race ahead of the render
    // range. A handful of getBoundingClientRect() calls is cheap enough to
    // run straight off every scroll event.
    let idleTimer: ReturnType<typeof setTimeout>
    const handleScroll = () => {
      measure(SCROLL_BUFFER_RATIO, false)
      clearTimeout(idleTimer)
      idleTimer = setTimeout(() => measure(IDLE_BUFFER_RATIO, true), IDLE_DELAY_MS)
    }

    measure(IDLE_BUFFER_RATIO, true)
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
        // Desktop: every video slide within the render window plays, same as
        // every other media type — no concurrent-decoder crash risk there,
        // so no need to cap it to one. Touch only: single centered video.
        const isVideoActive = isTouchDevice ? index === activeVideoIndex : shouldRender
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
          return (
            <TwoColumnImages
              key={key}
              slide={slide}
              shouldRender={shouldRender}
              isVideoActive={isVideoActive}
              slideRef={slideRef}
            />
          )
        }
        if (isVimeoSlide(slide)) {
          return <Vimeo key={key} slide={slide} shouldRender={shouldRender} slideRef={slideRef} />
        }

        return (
          <Slide
            key={key}
            slide={slide as MediaSlide}
            shouldRender={shouldRender}
            isVideoActive={isVideoActive}
            slideRef={slideRef}
          />
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
  // Space bar toggles this on/off on desktop; on a touch device (no
  // keyboard, no hover) it's the idle stage's default instead — see the
  // isTouchDevice effect below. Moving the mouse, or touch-dragging, hands
  // control straight back to cursor/finger-position scrubbing.
  const [isAutoPlaying, setIsAutoPlaying] = useState(false)
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const stageRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setIsTouchDevice(window.matchMedia('(pointer: coarse)').matches)
  }, [])

  const coverProjects = useMemo(() => projects.filter((project) => project.coverMedia), [projects])

  // Idle stage: cursor/touch X position (as a ratio of the stage width)
  // selects which cover is shown, splitting the stage into one segment per
  // project — left edge is the first cover, right edge the last. Shared by
  // the mouse and touch handlers below.
  const updateHoverIndexFromX = (clientX: number, stage: HTMLDivElement) => {
    const rect = stage.getBoundingClientRect()
    const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1)
    setHoverIndex(Math.min(Math.floor(ratio * coverProjects.length), coverProjects.length - 1))
  }

  const handleStageMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (coverProjects.length <= 1) return
    setIsAutoPlaying(false)
    updateHoverIndexFromX(event.clientX, event.currentTarget)
  }

  // Holding a touch down and dragging along X scrubs exactly like the mouse
  // does. .centerStage is `touch-action: none` (imageSlider.module.css) so
  // the browser doesn't also try to read this as the mobile layout's own
  // horizontal swipe-between-panels gesture (see version3.module.css's
  // `.page` scroll-snap carousel) — this claims the drag for scrubbing
  // instead. A plain tap (no real movement) still fires the click below to
  // open the project, same as it always has.
  const handleStageTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (coverProjects.length <= 1) return
    setIsAutoPlaying(false)
    updateHoverIndexFromX(event.touches[0].clientX, event.currentTarget)
  }

  const handleStageTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (coverProjects.length <= 1) return
    updateHoverIndexFromX(event.touches[0].clientX, event.currentTarget)
  }

  // Releasing the drag hands control back to the ambient slideshow — touch
  // has no equivalent of pressing Space again, so autoplay is what the idle
  // stage defaults back to once the user lets go.
  const handleStageTouchEnd = () => {
    if (isTouchDevice) setIsAutoPlaying(true)
  }

  // The slideshow only makes sense on the idle stage (below) — leaving it,
  // whether by opening a project or just hovering a row, stops it rather
  // than leaving it running silently in the background. On a touch device,
  // returning to the idle stage restarts it automatically, since there's no
  // Space key to turn it back on.
  useEffect(() => {
    if (activeProject || hoveredProject) {
      setIsAutoPlaying(false)
      return
    }
    if (isTouchDevice && coverProjects.length > 1) setIsAutoPlaying(true)
  }, [activeProject, hoveredProject, isTouchDevice, coverProjects.length])

  // Space toggles the idle stage between cursor-scrubbed and auto-advancing
  // through covers, like a slideshow. Ignored while typing anywhere else on
  // the page (e.g. the send-request form) so it doesn't hijack a literal space.
  useEffect(() => {
    if (activeProject || hoveredProject || coverProjects.length <= 1) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space') return
      const target = event.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return
      }
      event.preventDefault()
      setIsAutoPlaying((current) => !current)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeProject, hoveredProject, coverProjects.length])

  // Auto-advance through covers, wrapping back to the first once it reaches
  // the last, for as long as isAutoPlaying stays on.
  useEffect(() => {
    if (!isAutoPlaying || coverProjects.length <= 1) return

    const AUTO_PLAY_INTERVAL_MS = 200
    const id = setInterval(() => {
      setHoverIndex((current) => (current + 1) % coverProjects.length)
    }, AUTO_PLAY_INTERVAL_MS)
    return () => clearInterval(id)
  }, [isAutoPlaying, coverProjects.length])

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
    return <SlideList slides={renderableSlides} loading={slides === null} isTouchDevice={isTouchDevice} />
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
      onTouchStart={handleStageTouchStart}
      onTouchMove={handleStageTouchMove}
      onTouchEnd={handleStageTouchEnd}
      onTouchCancel={handleStageTouchEnd}
      onClick={() => onOpenProject(current.slug)}
    >
      <CoverMedia project={current} />
    </div>
  )
}
