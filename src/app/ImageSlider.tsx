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

  // Whether the active video has actually painted a frame yet (native
  // `playing` event) — see the poster <img> overlay below for why this is
  // tracked separately from isVideoActive rather than trusting the video's
  // own `poster` attribute to cover the gap.
  const [hasPainted, setHasPainted] = useState(false)

  useEffect(() => {
    if (!isVideoActive) setHasPainted(false)
  }, [isVideoActive])

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
              onPlaying={() => setHasPainted(true)}
              onLoadedMetadata={
                aspectRatio === null
                  ? ({videoWidth, videoHeight}) => {
                      if (videoWidth > 0 && videoHeight > 0) setAspectRatio(videoWidth / videoHeight)
                    }
                  : undefined
              }
            />
            {!isVideoActive && !posterUrl && <div className={styles.videoPlaceholder}>Video loads…</div>}
            {isVideoActive && !hasPainted && posterUrl && (
              <img
                src={posterUrl}
                alt=""
                className={styles.posterOverlay}
                style={{objectFit: slide.fitMode === 'cover' ? 'cover' : 'contain'}}
              />
            )}
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
  // See the matching hasPainted comment on <Slide> — same gap, same fix.
  // Declared unconditionally (not inside the video branch below) since
  // hooks can't follow this component's early returns.
  const [hasPainted, setHasPainted] = useState(false)

  useEffect(() => {
    if (!active) setHasPainted(false)
  }, [active])

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
          onPlaying={() => setHasPainted(true)}
        />
        {!active && !posterUrl && <div className={styles.videoPlaceholder}>Video loads…</div>}
        {active && !hasPainted && posterUrl && (
          <img src={posterUrl} alt="" className={styles.posterOverlay} style={{objectFit: fit}} />
        )}
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

// `active` gates LazyVideo's playback directly so only the intended slide(s)
// actually decode/play, the same one-video-at-a-time rule SlideList enforces
// for the same reason (concurrent decoders crash mobile Safari/Chrome).
// CoverScroller below mounts several covers at once (the active one plus its
// window neighbors, so scrolling to a fresh cover never shows a blank slide)
// on both desktop and touch, gating playback to just the exact active one —
// see CoverScroller's own `active` comment.
function CoverMedia({project, active}: {project: Project; active: boolean}) {
  const cover = project.coverMedia
  if (!cover) return null

  // Always 'contain', not driven by the project's own fitMode field — a
  // cover should always show in full, never cropped, centered within its
  // slide.
  const fit = 'contain'

  if (cover.mediaType === 'video' && cover.video?.asset?.url) {
    return <LazyVideo src={cover.video.asset.url} className={styles.centerMedia} fitMode={fit} active={active} />
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

// [1] [2] [3] … one per cover, active one lit up (var(--fg), white) against
// the rest dimmed (var(--muted), gray) — shared by both idle stages (desktop
// cursor-scrub and the mobile swipe carousel) so there's one definition of
// what the indicator looks like. `horizontal` switches it from the desktop
// default (right edge, spanning the full pane height, numbers stacked
// upright with space between them) to the mobile layout (bottom edge,
// horizontally centered) — a prop straight from which stage is rendering
// it, not a width media query, since isTouchDevice (which picks the stage)
// and viewport width can disagree (a touch laptop/tablet in landscape, say).
function CoverIndicator({
  count,
  activeIndex,
  horizontal,
}: {
  count: number
  activeIndex: number
  horizontal?: boolean
}) {
  if (count <= 1) return null

  const className = horizontal
    ? `${styles.coverIndicator} ${styles.coverIndicatorHorizontal}`
    : styles.coverIndicator

  return (
    <div className={className}>
      {Array.from({length: count}, (_, i) => (
        <span key={i} className={styles.coverIndicatorItem} data-active={i === activeIndex || undefined}>
          [{i + 1}]
        </span>
      ))}
    </div>
  )
}

// Only the active cover plus one neighbor on each side ever mount real media
// — same windowing idea as SlideList's RENDER_WINDOW, just for a
// one-cover-per-screen carousel instead of a scrolling multi-slide list.
// Anything further away renders an empty (but identically sized) slide,
// picking up its media once a scroll brings it within the window.
const COVER_RENDER_WINDOW = 1

// Vertical scroll-snap carousel — one project cover per full-height "page"
// of the stage, shared by desktop and touch alike: native scrolling (wheel,
// trackpad, touch-drag) already unifies both input types, so unlike the old
// desktop cursor-scrub vs. mobile swipe-carousel split, there's no separate
// gesture code to write per platform here. .coverSlide's `scroll-snap-stop:
// always` (see imageSlider.module.css) is what makes a fast scroll or flick
// still land on every cover in turn instead of skipping past several
// uncounted.
//
// Opening a project is a plain onClick per slide — no tap-vs-drag
// disambiguation needed the way the old touch carousel required, because a
// *native* scroll (unlike a hand-rolled touchstart/move/end drag) never
// fires a click on its own; the browser already only dispatches one for an
// actual tap.
function CoverScroller({
  coverProjects,
  onOpenProject,
  onActiveChange,
  isTouchDevice,
  scrollToSlug,
}: {
  coverProjects: Project[]
  onOpenProject: (slug?: string) => void
  // Reports whichever cover is currently active on every change, and
  // undefined once this carousel unmounts (an open project or
  // coverProjects itself going empty — see onIdleCoverChange on ImageSlider
  // below). Left undefined entirely by the touch call site.
  onActiveChange?: (slug?: string) => void
  isTouchDevice: boolean
  // Desktop only: hovering a listColumn row (see ImageSlider below) — this
  // carousel scroll-snaps to that project's cover instead of anything
  // swapping in a separate static view, so hovering feels like the same
  // scrolling a user could do by hand.
  scrollToSlug?: string
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  // Every slide is exactly one container-height tall (scroll-snap keeps it
  // that way), so the active index is just scrollTop divided by that height
  // — no need for SlideList's per-slide getBoundingClientRect scan, which
  // exists there specifically to handle *varying* slide heights.
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const measure = () => {
      const slideHeight = container.clientHeight || 1
      const index = Math.round(container.scrollTop / slideHeight)
      const clamped = Math.min(Math.max(index, 0), coverProjects.length - 1)
      setActiveIndex((current) => (current === clamped ? current : clamped))
    }

    measure()
    container.addEventListener('scroll', measure, {passive: true})
    const resizeObserver = new ResizeObserver(measure)
    resizeObserver.observe(container)
    return () => {
      container.removeEventListener('scroll', measure)
      resizeObserver.disconnect()
    }
  }, [coverProjects.length])

  useEffect(() => {
    onActiveChange?.(coverProjects[activeIndex]?.slug)
  }, [onActiveChange, coverProjects, activeIndex])

  useEffect(() => {
    return () => onActiveChange?.(undefined)
  }, [onActiveChange])

  // Same native smooth-scroll a user scrolling by hand would trigger — the
  // scroll listener above (`measure`) picks up the resulting activeIndex on
  // its own as the scroll animates, same as any other scroll.
  useEffect(() => {
    if (!scrollToSlug) return
    const container = containerRef.current
    if (!container) return
    const index = coverProjects.findIndex((project) => project.slug === scrollToSlug)
    if (index === -1) return
    container.scrollTo({top: index * (container.clientHeight || 1), behavior: 'smooth'})
  }, [scrollToSlug, coverProjects])

  return (
    <div className={styles.coverStage}>
      <div className={styles.coverScroller} ref={containerRef}>
        {coverProjects.map((project, index) => {
          const withinWindow = Math.abs(index - activeIndex) <= COVER_RENDER_WINDOW
          return (
            <div className={styles.coverSlide} key={project._id} onClick={() => onOpenProject(project.slug)}>
              {withinWindow && <CoverMedia project={project} active={index === activeIndex} />}
            </div>
          )
        })}
      </div>
      <CoverIndicator count={coverProjects.length} activeIndex={activeIndex} horizontal={isTouchDevice} />
    </div>
  )
}

export default function ImageSlider({
  projects,
  activeProject,
  hoveredProject,
  onOpenProject,
  onIdleCoverChange,
}: {
  projects: Project[]
  activeProject: Project | null
  hoveredProject: Project | null
  onOpenProject: (slug?: string) => void
  // Desktop only: fires with whichever cover the idle stage is currently
  // showing, or undefined once nothing is — an open project, a touch device
  // (its own carousel, unrelated to this), or coverProjects itself going
  // empty. Lets the caller mirror that selection onto the corresponding row
  // in listColumn without ImageSlider needing to know anything about rows.
  onIdleCoverChange?: (slug?: string) => void
}) {
  const [slides, setSlides] = useState<ProjectSlide[] | null>(null)
  const cache = useRef(new Map<string, ProjectSlide[]>())
  const [isTouchDevice, setIsTouchDevice] = useState(false)

  useEffect(() => {
    setIsTouchDevice(window.matchMedia('(pointer: coarse)').matches)
  }, [])

  const coverProjects = useMemo(() => projects.filter((project) => project.coverMedia), [projects])

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

  // ----- idle: vertical scroll-snap carousel — see CoverScroller above.
  // Hovering a listColumn row (hoveredProject) doesn't swap in a separate
  // static view — it just scroll-snaps this same carousel to that project's
  // cover, via CoverScroller's own scrollToSlug prop. -----
  if (coverProjects.length === 0) return <div className={styles.centerStage} />

  return (
    <CoverScroller
      coverProjects={coverProjects}
      onOpenProject={onOpenProject}
      onActiveChange={isTouchDevice ? undefined : onIdleCoverChange}
      isTouchDevice={isTouchDevice}
      scrollToSlug={hoveredProject?.slug}
    />
  )
}
