'use client'

import {type Sketch} from '@p5-wrapper/react'
import {NextReactP5Wrapper} from '@p5-wrapper/next'
import {useEffect, useRef, useState} from 'react'
import styles from './page.module.css'

type Props = {
  text: string
  linkText?: string
  linkUrl?: string
  linkPosition?: number // character index where the link starts
}

const ascii =
  `︵︶︷︸﹇﹈•․‥…‧‰′″‴‹›‽⁋"#$%&'()*+,-./:;<=>?@{|}¡¢£¤¥¦§©ª«¬­®¯°µ¶¹º»¼`.split('')

type Char = {
  original: string
  current: string
  x: number
  y: number
  w: number
  h: number
  isLink: boolean
}

const sketch: Sketch = (p5) => {
  let chars: Char[] = []
  let copy = ''
  let linkStart = -1
  let linkEnd = -1
  let linkUrl = ''
  let containerWidth = 400
  let containerHeight = 200
  let theme: 'light' | 'dark' = 'light'

  const getTextSize = () => p5.constrain(containerWidth * 0.055, 14, 22)

  const buildChars = () => {
    chars = copy.split('').map((ch, i) => ({
      original: ch,
      current: ch,
      x: 0,
      y: 0,
      w: 0,
      h: 0,
      isLink: i >= linkStart && i < linkEnd,
    }))
  }

  const layoutChars = () => {
    const x = 0
    const y = 0
    const maxW = containerWidth
    const size = getTextSize()
    p5.textSize(size)
    const lineH = size * 1.4
    let cx = x
    let cy = y

    // Word-wrap aware layout: measure whole words and break before overflow.
    let i = 0
    while (i < chars.length) {
      // find next word boundary
      let j = i
      while (j < chars.length && chars[j].original !== ' ') j++

      let wordW = 0
      for (let k = i; k < j; k++) wordW += p5.textWidth(chars[k].current)

      if (cx > x && cx + wordW > x + maxW) {
        cx = x
        cy += lineH
      }

      for (let k = i; k < j; k++) {
        const w = p5.textWidth(chars[k].current)
        chars[k].x = cx
        chars[k].y = cy
        chars[k].w = w
        chars[k].h = lineH
        cx += w
      }

      if (j < chars.length) {
        const spaceW = p5.textWidth(' ')
        chars[j].x = cx
        chars[j].y = cy
        chars[j].w = spaceW
        chars[j].h = lineH
        cx += spaceW
      }
      i = j + 1
    }

    // Total height used
    return cy + lineH
  }

  const changeCharacterAt = (px: number, py: number) => {
    for (let i = 0; i < chars.length; i++) {
      const c = chars[i]
      if (px >= c.x && px <= c.x + c.w && py >= c.y && py <= c.y + c.h) {
        // If clicking the link, open it instead of scrambling
        if (c.isLink && linkUrl) {
          window.open(linkUrl, '_blank', 'noopener,noreferrer')
          return
        }
        if (/[a-zA-Z]/.test(c.original)) {
          c.current = ascii[Math.floor(p5.random(ascii.length))]
        }
        break
      }
    }
  }

  p5.setup = () => {
    p5.createCanvas(containerWidth, containerHeight)
    p5.pixelDensity(2)
    p5.textFont('inherit')
    p5.noStroke()
    p5.textAlign(p5.LEFT, p5.TOP)
  }

  p5.updateWithProps = (props) => {
    const next = props as unknown as {
      text: string
      linkStart: number
      linkEnd: number
      linkUrl: string
      width: number
      height: number
      theme: 'light' | 'dark'
    }
    let needsRebuild = false
    if (next.text && next.text !== copy) {
      copy = next.text
      needsRebuild = true
    }
    if (next.linkStart !== linkStart || next.linkEnd !== linkEnd) {
      linkStart = next.linkStart
      linkEnd = next.linkEnd
      needsRebuild = true
    }
    if (next.linkUrl !== undefined) linkUrl = next.linkUrl
    if (next.theme) theme = next.theme
    if (needsRebuild && copy) buildChars()
    if (next.width && next.height) {
      const wChanged = next.width !== containerWidth
      const hChanged = next.height !== containerHeight
      containerWidth = next.width
      containerHeight = next.height
      if (wChanged || hChanged) p5.resizeCanvas(containerWidth, containerHeight)
    }
  }

  p5.draw = () => {
    p5.clear()
    if (!chars.length) return

    const fg = theme === 'dark' ? 255 : 0
    layoutChars()
    p5.textSize(getTextSize())

    for (const c of chars) {
      if (c.isLink) {
        p5.fill(fg)
        p5.text(c.current, c.x, c.y)
        // underline for link
        const underlineY = c.y + getTextSize() + 2
        p5.stroke(fg)
        p5.strokeWeight(1)
        p5.line(c.x, underlineY, c.x + c.w, underlineY)
        p5.noStroke()
      } else {
        p5.fill(fg)
        p5.text(c.current, c.x, c.y)
      }
    }
  }

  p5.mousePressed = () => {
    if (
      p5.mouseX >= 0 &&
      p5.mouseX <= containerWidth &&
      p5.mouseY >= 0 &&
      p5.mouseY <= containerHeight
    ) {
      changeCharacterAt(p5.mouseX, p5.mouseY)
    }
  }

  p5.touchStarted = () => {
    if (p5.touches.length > 0) {
      const t = p5.touches[0] as {x: number; y: number}
      changeCharacterAt(t.x, t.y)
    }
    return false
  }
}

export default function IntroAnimation({
  text,
  linkText,
  linkUrl,
  linkPosition,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({width: 400, height: 300})
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  // Track container size
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const {width, height} = entry.contentRect
        setSize({width: Math.floor(width), height: Math.floor(height)})
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Track theme (adjust selector to match how your ThemeToggle sets it)
  useEffect(() => {
    const readTheme = () => {
      const isDark =
        document.documentElement.dataset.theme === 'dark' ||
        document.documentElement.classList.contains('dark') ||
        window.matchMedia('(prefers-color-scheme: dark)').matches
      setTheme(isDark ? 'dark' : 'light')
    }
    readTheme()
    const mo = new MutationObserver(readTheme)
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class'],
    })
    return () => mo.disconnect()
  }, [])

  // Compute link span
  const linkStart =
    linkText && linkPosition !== undefined ? linkPosition : -1
  const linkEnd =
    linkText && linkPosition !== undefined ? linkPosition + linkText.length : -1

    return (
        <div ref={containerRef} className={styles.introCanvas}>
          <NextReactP5Wrapper
            sketch={sketch}
            text={text}
            linkStart={linkStart}
            linkEnd={linkEnd}
            linkUrl={linkUrl || ''}
            width={size.width}
            height={size.height}
            theme={theme}
          />
        </div>
      )
}