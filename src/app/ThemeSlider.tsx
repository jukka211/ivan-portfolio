'use client'

import {useEffect, useState, useCallback} from 'react'

function valueToHex(value: number): string {
  const hex = Math.round(value).toString(16).padStart(2, '0')
  return `#${hex}${hex}${hex}`
}

function getTextColor(bgValue: number): string {
  // Use luminance threshold — switch text at ~50% gray
  return bgValue > 140 ? '#000' : '#fff'
}

export default function ThemeSlider() {
  const [value, setValue] = useState(0) // 0 = #000, 255 = #fff

  const updateTheme = useCallback((v: number) => {
    const bg = valueToHex(v)
    const text = getTextColor(v)
    document.documentElement.style.setProperty('--bg', bg)
    document.documentElement.style.setProperty('--text', text)
  }, [])

  useEffect(() => {
    updateTheme(value)
  }, [value, updateTheme])

  return (
    <div
      style={{
        position: 'fixed',
        right: '1rem',
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.35rem',
        userSelect: 'none',
      }}
    >
      <span
        style={{
          fontSize: '0.75rem',
          color: 'var(--text)',
          opacity: 0.5,
          transition: 'color 0.2s',
        }}
      >
        b
      </span>

      <input
        type="range"
        min={0}
        max={255}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        aria-label="Background color"
        style={{
          WebkitAppearance: 'none',
          appearance: 'none' as const,
          writingMode: 'vertical-lr',
          direction: 'rtl',
          width: '2px',
          height: '80px',
          background: 'linear-gradient(to bottom, #000, #fff)',
          borderRadius: '1px',
          outline: 'none',
          cursor: 'pointer',
          margin: 0,
          padding: 0,
          opacity: 0.5,
          transition: 'opacity 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.5')}
      />

      <span
        style={{
          fontSize: '0.75rem',
          color: 'var(--text)',
          opacity: 0.5,
          transition: 'color 0.2s',
        }}
      >
        w
      </span>
    </div>
  )
}