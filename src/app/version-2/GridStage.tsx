'use client'

import {useEffect, useRef} from 'react'
import {gsap} from 'gsap'
import {Flip} from 'gsap/Flip'
import {urlFor} from '@/sanity/lib/image'
import styles from './grid.module.css'
import type {CreditItem, CreditsSlide, MediaSlide, ProjectCard, ProjectSlide} from './types'

/* -----------------------------------------------------------------------
   Ported from grid-modes.html. Each layout is a tree of splits (row/col).
   A cell is a leaf carrying its own weight, so SIZE belongs to the cell,
   not to a fixed slot. Dragging reorders siblings — the dragged cell keeps
   its shape, the rest slide over. Kept as a single imperative DOM/GSAP
   routine (rather than React state) so the drag + Flip choreography stays
   byte-for-byte the same as the reference file.
----------------------------------------------------------------------- */

type CellNode = {t: 'cell'; id: string; f: number}
type SplitNode = {t: 'row' | 'col'; f: number; c: TreeNode[]}
type TreeNode = CellNode | SplitNode

const cellNode = (id: string, f = 1): CellNode => ({t: 'cell', id, f})
const row = (f: number, c: TreeNode[]): SplitNode => ({t: 'row', f, c})
const col = (f: number, c: TreeNode[]): SplitNode => ({t: 'col', f, c})

const LAYOUTS: Record<'a' | 'b' | 'c', () => TreeNode> = {
  a: () =>
    row(1, [col(1, [row(1, [cellNode('1'), cellNode('2')]), cellNode('3')]), cellNode('4')]),
  b: () => col(1, [row(1, [cellNode('1'), cellNode('2'), cellNode('3', 2)]), cellNode('4')]),
  c: () => col(1, [row(1, [cellNode('1'), cellNode('2')]), row(1, [cellNode('3'), cellNode('4')])]),
}

const MODES: Array<'a' | 'b' | 'c'> = ['a', 'b', 'c']
const EASE = 'power3.out'
const CLICK_THRESHOLD_PX = 6

export default function GridStage({projects}: {projects: ProjectCard[]}) {
  const stageRef = useRef<HTMLDivElement | null>(null)
  const switchRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    const stage = stageRef.current
    const switchButton = switchRef.current
    if (!stage) return

    gsap.registerPlugin(Flip)

    const disposers: Array<() => void> = []

    /* ---------------- persistent cell elements ---------------- */

    const ids = ['1', '2', '3', '4'] as const
    const els: Record<string, HTMLDivElement> = {}
    for (const id of ids) {
      const el = document.createElement('div')
      el.className = styles.cell
      el.dataset.id = id
      els[id] = el
    }
    const all = Object.values(els)

    buildInfoCell(els['1'])
    buildToolsCell(els['2'])
    buildWorkScrollCell(els['3'], projects, disposers)
    showCellFourPlaceholder(els['4'], 'Select a work')

    const trees: Record<'a' | 'b' | 'c', TreeNode> = {
      a: LAYOUTS.a(),
      b: LAYOUTS.b(),
      c: LAYOUTS.c(),
    }
    let mode = 0
    let dragging: string | null = null

    /* ---------------- render ---------------- */

    function build(node: TreeNode): HTMLElement {
      if (node.t === 'cell') {
        const el =
          node.id === dragging
            ? Object.assign(document.createElement('div'), {className: styles.ghost})
            : els[node.id]
        el.style.flex = `${node.f} 1 0`
        return el
      }
      const box = document.createElement('div')
      box.className = `${styles.split} ${node.t === 'row' ? styles.row : styles.col}`
      box.style.flex = `${node.f} 1 0`
      node.c.forEach((child) => box.appendChild(build(child)))
      return box
    }

    /* A reorder can land mid-flight, interrupting the previous Flip. Kill it
       and wipe whatever inline transform it left behind BEFORE measuring the
       new state — otherwise cells inherit stale positioning and jump. */
    function calm(targets: Element[]) {
      Flip.killFlipsOf(targets)
      gsap.killTweensOf(targets)
      gsap.set(targets, {clearProps: 'transform,position,top,left,width,height'})
    }

    /* keeps the work-scroll cards (cell 3) the same width as cells 1 & 2,
       scoped to this stage rather than the document root, so nothing leaks
       onto other routes. */
    function syncCardWidth() {
      stage!.style.setProperty('--card-w', `${els['1'].offsetWidth}px`)
    }

    function render({animate = true, duration = 0.4}: {animate?: boolean; duration?: number} = {}) {
      const moving = all.filter((el) => el.isConnected && el !== els[dragging ?? ''])

      let state: Flip.FlipState | null = null
      if (animate && moving.length) {
        calm(moving)
        state = Flip.getState(moving)
      }

      stage!.replaceChildren(build(trees[MODES[mode]]))
      syncCardWidth()

      if (state) Flip.from(state, {duration, ease: EASE})
    }

    const handleResize = () => syncCardWidth()
    window.addEventListener('resize', handleResize)
    disposers.push(() => window.removeEventListener('resize', handleResize))

    /* ---------------- tree surgery ---------------- */

    function findPath(node: TreeNode, id: string, acc: TreeNode[] = []): TreeNode[] | null {
      const next = [...acc, node]
      if (node.t === 'cell') return node.id === id ? next : null
      for (const child of node.c) {
        const hit = findPath(child, id, next)
        if (hit) return hit
      }
      return null
    }

    /* If the two cells aren't siblings, move the dragged cell's branch at the
       deepest level where they ARE — the only rearrangement that shifts
       things without resizing anyone. */
    function reorder(dragId: string, dropId: string) {
      const root = trees[MODES[mode]]
      const pa = findPath(root, dragId)
      const pb = findPath(root, dropId)
      if (!pa || !pb) return false

      let depth = 0
      while (pa[depth + 1] && pa[depth + 1] === pb[depth + 1]) depth++

      const parent = pa[depth] as SplitNode
      const a = pa[depth + 1]
      const b = pb[depth + 1]
      if (!a || !b || a === b) return false

      const from = parent.c.indexOf(a)
      const to = parent.c.indexOf(b)

      parent.c.splice(from, 1)
      const at = parent.c.indexOf(b)
      parent.c.splice(to > from ? at + 1 : at, 0, a)
      return true
    }

    /* ---------------- drag ---------------- */

    let origin: {left: number; top: number} | null = null
    let offset: {x: number; y: number} | null = null
    let lastTarget: HTMLElement | null = null
    let xTo: gsap.QuickToFunc | null = null
    let yTo: gsap.QuickToFunc | null = null

    // click-vs-drag detection for work-cards nested inside cell 3
    let pointerDownTarget: EventTarget | null = null
    let pointerDownAt = {x: 0, y: 0}
    let lastPointerPos = {x: 0, y: 0}

    const cellUnder = (x: number, y: number) => {
      const el = document.elementFromPoint(x, y)
      const hit = el?.closest<HTMLElement>(`.${styles.cell}`) ?? null
      return hit && hit.dataset.id !== dragging ? hit : null
    }

    const handlePointerDown = (e: PointerEvent) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>(`.${styles.cell}`)
      if (!el) return

      pointerDownTarget = e.target
      pointerDownAt = {x: e.clientX, y: e.clientY}
      lastPointerPos = {...pointerDownAt}

      const r = el.getBoundingClientRect()
      dragging = el.dataset.id ?? null
      origin = {left: r.left, top: r.top}
      offset = {x: e.clientX - r.left, y: e.clientY - r.top}
      lastTarget = null

      calm([el])
      gsap.set(el, {
        position: 'fixed',
        left: r.left,
        top: r.top,
        width: r.width,
        height: r.height,
        x: 0,
        y: 0,
      })
      el.classList.add(styles.isDragging)
      document.body.appendChild(el)
      el.setPointerCapture(e.pointerId)

      xTo = gsap.quickTo(el, 'x', {duration: 0.12, ease: 'power2.out'})
      yTo = gsap.quickTo(el, 'y', {duration: 0.12, ease: 'power2.out'})

      /* No animation here. The ghost takes exactly the space the cell just
         left, so nothing actually moves — the first real movement is the
         first reorder. */
      render({animate: false})
    }

    const handlePointerMove = (e: PointerEvent) => {
      lastPointerPos = {x: e.clientX, y: e.clientY}
      if (!dragging || !offset || !origin || !xTo || !yTo) return

      xTo(e.clientX - offset.x - origin.left)
      yTo(e.clientY - offset.y - origin.top)

      /* Commit on ENTER, not on midline: every cell under the pointer is a
         valid drop. `lastTarget` is the only guard. */
      const target = cellUnder(e.clientX, e.clientY)
      if (!target) {
        lastTarget = null
        return
      }
      if (target === lastTarget) return

      lastTarget = target
      if (reorder(dragging, target.dataset.id as string)) render({duration: 0.35})
    }

    const drop = () => {
      if (!dragging) return
      const el = els[dragging]

      gsap.killTweensOf(el)
      const state = Flip.getState(el) // where it floats right now

      el.classList.remove(styles.isDragging)
      gsap.set(el, {clearProps: 'all'})
      dragging = null
      lastTarget = null
      render({animate: false}) // it lands back in the tree…

      Flip.from(state, {duration: 0.35, ease: EASE}) // …and glides into the slot

      const moved =
        Math.hypot(lastPointerPos.x - pointerDownAt.x, lastPointerPos.y - pointerDownAt.y) >
        CLICK_THRESHOLD_PX

      if (!moved && pointerDownTarget instanceof Element) {
        const card = pointerDownTarget.closest<HTMLElement>(`.${styles.workCard}`)
        if (card) void openProject(card)
      }
    }

    stage.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('pointermove', handlePointerMove)
    document.addEventListener('pointerup', drop)
    document.addEventListener('pointercancel', drop)
    disposers.push(() => {
      stage.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('pointermove', handlePointerMove)
      document.removeEventListener('pointerup', drop)
      document.removeEventListener('pointercancel', drop)
    })

    /* ---------------- layout switch ---------------- */

    const handleSwitchClick = () => {
      mode = (mode + 1) % MODES.length
      render({duration: 0.55})
    }
    switchButton?.addEventListener('click', handleSwitchClick)
    disposers.push(() => switchButton?.removeEventListener('click', handleSwitchClick))

    const handleKeyDown = (e: KeyboardEvent) => {
      const n = Number(e.key)
      if (n >= 1 && n <= MODES.length) {
        mode = n - 1
        render({duration: 0.55})
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    disposers.push(() => document.removeEventListener('keydown', handleKeyDown))

    /* ---------------- cell 4: clicked project's other slides ----------------
       Nothing is fetched until a work-card is actually clicked. Only that
       one project's slides are requested (a small JSON payload — Sanity
       asset refs, not image bytes), and the resulting <img>/<video>
       elements load lazily as they scroll into view. Repeat clicks on an
       already-opened project reuse the in-memory cache instead of
       re-fetching. */

    const slidesCache = new Map<string, ProjectSlide[]>()
    let activeSlug: string | null = null
    let activeController: AbortController | null = null
    let selectedMediaEl: HTMLElement | null = null
    let selectedCaptionEl: HTMLElement | null = null

    function showPlaceholder(text: string) {
      showCellFourPlaceholder(els['4'], text)
    }

    function showSlides(slides: ProjectSlide[]) {
      renderCellFourSlides(els['4'], slides, disposers)
    }

    // marks the clicked card's cover as selected and scrolls it flush to the
    // left edge of the work-scroll row, so it's clear which card's slides
    // are showing in cell 4.
    function selectCard(cardEl: HTMLElement | null) {
      selectedMediaEl?.classList.remove(styles.workCardMediaSelected)
      selectedMediaEl = cardEl?.querySelector<HTMLElement>(`.${styles.workCardMedia}`) ?? null
      selectedMediaEl?.classList.add(styles.workCardMediaSelected)

      selectedCaptionEl?.classList.remove(styles.workCardCaptionSelected)
      selectedCaptionEl = cardEl?.querySelector<HTMLElement>(`.${styles.workCardCaption}`) ?? null
      selectedCaptionEl?.classList.add(styles.workCardCaptionSelected)

      cardEl?.scrollIntoView({behavior: 'smooth', inline: 'start', block: 'nearest'})
    }

    async function openProject(cardEl: HTMLElement) {
      const slug = cardEl.dataset.slug
      if (!slug) return

      if (activeSlug === slug) {
        activeSlug = null
        activeController?.abort()
        showPlaceholder('Select a work')
        selectCard(null)
        return
      }

      activeSlug = slug
      activeController?.abort()
      selectCard(cardEl)

      const cached = slidesCache.get(slug)
      if (cached) {
        showSlides(cached)
        return
      }

      showPlaceholder('Loading…')
      const controller = new AbortController()
      activeController = controller

      try {
        const res = await fetch(`/api/projects/${encodeURIComponent(slug)}/slides`, {
          signal: controller.signal,
        })
        const data = (await res.json()) as {slides?: ProjectSlide[]}
        if (activeSlug !== slug) return
        const slides = data.slides ?? []
        slidesCache.set(slug, slides)
        showSlides(slides)
      } catch {
        if (controller.signal.aborted) return
        if (activeSlug === slug) showPlaceholder("Couldn't load this project")
      }
    }

    render({animate: false})

    return () => {
      disposers.forEach((dispose) => dispose())
      activeController?.abort()

      all.forEach((el) => {
        gsap.killTweensOf(el)
        Flip.killFlipsOf(el)
        if (el.parentElement === document.body) document.body.removeChild(el)
      })
    }
  }, [projects])

  return (
    <div className={styles.page}>
      <div className={styles.stage} ref={stageRef} />
      <div className={styles.bar}>
        <button className={styles.switch} type="button" ref={switchRef}>
          Switch layout
        </button>
      </div>
    </div>
  )
}

/* ---------------- static cell content (identical to the reference file) ---------------- */

function buildInfoRow(label: string, rows: Array<[string, string, string]>) {
  const group = document.createElement('div')
  group.className = styles.infoGroup

  const labelEl = document.createElement('div')
  labelEl.className = styles.infoLabel
  labelEl.textContent = label

  const list = document.createElement('div')
  list.className = styles.infoList

  rows.forEach(([a, b, c]) => {
    const item = document.createElement('div')
    item.className = styles.infoItem
    ;[a, b, c].forEach((text) => {
      const span = document.createElement('span')
      span.textContent = text
      item.appendChild(span)
    })
    list.appendChild(item)
  })

  group.append(labelEl, list)
  return group
}

function buildInfoCell(container: HTMLDivElement) {
  const panel = document.createElement('div')
  panel.className = styles.infoPanel

  const topRow = document.createElement('div')
  topRow.className = styles.infoRow

  const name = document.createElement('div')
  name.className = styles.infoName
  name.textContent = 'Ivan Sukhov'

  const topDetails = document.createElement('div')
  topDetails.className = styles.infoTopDetails

  const desc = document.createElement('div')
  desc.className = styles.infoDesc
  desc.textContent =
    'Brand and Web Designer working across brand strategy, concept development, visual identity, web design, and web development. Based in Linz, Austria. Available for enquiries, collaborations, and selected projects.'

  const links = document.createElement('div')
  links.className = styles.infoLinks

  const igLink = document.createElement('a')
  igLink.className = styles.infoLink
  igLink.href = 'https://instagram.com/'
  igLink.target = '_blank'
  igLink.rel = 'noopener'
  igLink.textContent = 'Instagram'

  const mailLink = document.createElement('a')
  mailLink.className = styles.infoLink
  mailLink.href = 'mailto:hello@ivansukhov.com'
  mailLink.textContent = 'E-Mail'

  links.append(igLink, mailLink)
  topDetails.append(desc, links)
  topRow.append(name, topDetails)

  const bottomRow = document.createElement('div')
  bottomRow.className = `${styles.infoRow} ${styles.infoRowBottom}`

  bottomRow.append(
    buildInfoRow('Awards:', [
      ['Joseph Binder Awards', 'Silber', '2025'],
      ['Type Directors Club', 'Judges Choice', '2025'],
      ['Creative Club Austria', 'Shortlist', '2025'],
    ]),
    buildInfoRow('Services:', [
      ['Branding', 'Digital Experience', '2025'],
      ['Web', 'Sanity, Next.js', '2025'],
      ['Tools', 'Brand Tools', '2025'],
    ]),
  )

  panel.append(topRow, bottomRow)
  container.replaceChildren(panel)
}

function buildToolsCell(container: HTMLDivElement) {
  const grid = document.createElement('div')
  grid.className = styles.toolsGrid

  ;['OFS Tool', 'A-Z Stretch', '', ''].forEach((label) => {
    const item = document.createElement('div')
    item.className = styles.toolItem
    item.textContent = label
    grid.appendChild(item)
  })

  container.replaceChildren(grid)
}

/* ---------------- cell 3: real project covers from Sanity ---------------- */

function observeLazyVideo(video: HTMLVideoElement, src: string, disposers: Array<() => void>) {
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        if (!video.src) {
          video.src = src
          video.load()
        }
        video.play().catch(() => {})
      } else {
        video.pause()
      }
    },
    {threshold: 0.2},
  )
  observer.observe(video)
  disposers.push(() => observer.disconnect())
}

function buildWorkCard(project: ProjectCard, disposers: Array<() => void>) {
  const card = document.createElement('div')
  card.className = styles.workCard
  card.dataset.slug = project.slug

  const imgWrap = document.createElement('div')
  imgWrap.className = styles.workCardImg

  const cover = project.coverMedia
  if (cover?.mediaType === 'video' && cover.video?.asset?.url) {
    const video = document.createElement('video')
    video.className = styles.workCardMedia
    video.muted = true
    video.loop = true
    video.playsInline = true
    video.preload = 'none'
    imgWrap.appendChild(video)
    observeLazyVideo(video, cover.video.asset.url, disposers)
  } else if (cover?.mediaType === 'image' && cover.image) {
    const img = document.createElement('img')
    img.className = styles.workCardMedia
    img.loading = 'lazy'
    img.decoding = 'async'
    img.alt = ''
    img.src = urlFor(cover.image).width(900).quality(78).url()
    imgWrap.appendChild(img)
  }

  const caption = document.createElement('div')
  caption.className = styles.workCardCaption

  const name = document.createElement('span')
  name.className = styles.workCardName
  name.textContent = project.title ?? 'Untitled'

  const meta = document.createElement('span')
  meta.className = styles.workCardMeta
  ;[project.type ?? '', project.year ?? ''].forEach((text) => {
    const span = document.createElement('span')
    span.textContent = text
    meta.appendChild(span)
  })

  caption.append(name, meta)
  card.append(imgWrap, caption)
  return card
}

function buildWorkScrollCell(
  container: HTMLDivElement,
  projects: ProjectCard[],
  disposers: Array<() => void>,
) {
  const scroll = document.createElement('div')
  scroll.className = styles.workScroll

  projects.forEach((project) => {
    if (!project.slug) return
    scroll.appendChild(buildWorkCard(project, disposers))
  })

  container.replaceChildren(scroll)
}

/* ---------------- cell 4: the clicked project's other slides ---------------- */

function showCellFourPlaceholder(container: HTMLDivElement, text: string) {
  const wrap = document.createElement('div')
  wrap.className = `${styles.projectSlides} ${styles.slidePlaceholder}`
  wrap.textContent = text
  container.replaceChildren(wrap)
}

function isCreditsSlide(slide: ProjectSlide): slide is CreditsSlide {
  return (slide as CreditsSlide).slideType === 'credits'
}

// This demo route only knows how to build media/credits slide elements — the
// newer text/spec/two-image slide types (see version-2/types.ts) are simply
// skipped here rather than reimplemented for this unrelated, non-live page.
function isMediaSlide(slide: ProjectSlide): slide is MediaSlide {
  return (slide as MediaSlide).slideType === undefined
}

function buildCreditsColumn(items?: CreditItem[] | null) {
  const column = document.createElement('div')
  column.className = styles.creditsColumn

  ;(items ?? []).forEach((item) => {
    const rowEl = document.createElement('div')
    rowEl.className = styles.creditRow

    const role = document.createElement('span')
    role.className = styles.creditRole
    role.textContent = item.role ?? ''

    const name = document.createElement('span')
    name.className = styles.creditName
    name.textContent = item.name ?? ''

    rowEl.append(role, name)
    column.appendChild(rowEl)
  })

  return column
}

function buildCreditsSlideEl(slide: CreditsSlide) {
  const wrap = document.createElement('div')
  wrap.className = `${styles.creditsSlide} ${slide.background === 'white' ? styles.slideWhite : styles.slideBlack}`

  const columns = document.createElement('div')
  columns.className = styles.creditsColumns
  columns.append(buildCreditsColumn(slide.leftColumn1), buildCreditsColumn(slide.leftColumn2))
  wrap.appendChild(columns)

  if (slide.text) {
    const text = document.createElement('div')
    text.className = styles.creditsText
    text.textContent = slide.text
    wrap.appendChild(text)
  }

  return wrap
}

function buildMediaSlideEl(slide: MediaSlide, disposers: Array<() => void>) {
  const wrap = document.createElement('div')
  wrap.className = `${styles.projectSlide} ${slide.background === 'white' ? styles.slideWhite : styles.slideBlack}`

  const fitMode = slide.fitMode === 'cover' ? 'cover' : 'contain'
  const videoUrl = slide.mediaType === 'video' ? slide.video?.asset?.url : null

  if (videoUrl) {
    const video = document.createElement('video')
    video.className = styles.slideMedia
    video.style.objectFit = fitMode
    video.muted = true
    video.loop = true
    video.playsInline = true
    video.preload = 'none'
    wrap.appendChild(video)
    observeLazyVideo(video, videoUrl, disposers)
  } else if (slide.mediaType === 'image' && slide.image) {
    const img = document.createElement('img')
    img.className = styles.slideMedia
    img.style.objectFit = fitMode
    img.loading = 'lazy'
    img.decoding = 'async'
    img.alt = ''
    img.src = urlFor(slide.image).width(1600).quality(80).url()
    wrap.appendChild(img)
  }

  return wrap
}

function renderCellFourSlides(
  container: HTMLDivElement,
  slides: ProjectSlide[],
  disposers: Array<() => void>,
) {
  const wrap = document.createElement('div')
  wrap.className = styles.projectSlides

  if (slides.length === 0) {
    wrap.classList.add(styles.slidePlaceholder)
    wrap.textContent = 'No additional slides'
  } else {
    slides.forEach((slide) => {
      if (isCreditsSlide(slide)) {
        wrap.appendChild(buildCreditsSlideEl(slide))
      } else if (isMediaSlide(slide)) {
        wrap.appendChild(buildMediaSlideEl(slide, disposers))
      }
    })
  }

  container.replaceChildren(wrap)
}
