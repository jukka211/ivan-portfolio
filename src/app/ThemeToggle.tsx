// app/ThemeToggle.tsx
'use client'

import {useEffect, useState} from 'react'

export default function ThemeToggle() {
  const [light, setLight] = useState(false)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', light ? 'light' : 'dark')
  }, [light])

  return (
<button
  onClick={() => setLight((prev) => !prev)}
  aria-label="Toggle theme"
  style={{
    position: 'fixed',
    right: '1rem',
    top: '49%',
    zIndex: 9999,
    background: 'none',
    border: 'none',
    color: 'var(--text)',
    cursor: 'pointer',
    fontSize: '0.9375rem',
    lineHeight: '1',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0',
    padding: '0',
    transition: 'opacity 0.2s',
  }}
>
  <span style={{opacity: light ? 0.35 : 1, transition: 'opacity 0.2s'}}>b</span>
  <span>/</span>
  <span style={{opacity: light ? 1 : 0.35, transition: 'opacity 0.2s'}}>w</span>
</button>
  )
}