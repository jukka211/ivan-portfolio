'use client'

import { useEffect, useState } from 'react'
import './ThemeToggle.css'

export default function ThemeToggle() {
  const [light, setLight] = useState(false)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', light ? 'light' : 'dark')
  }, [light])

  return (
    <button
      onClick={() => setLight((prev) => !prev)}
      aria-label="Toggle theme"
      className="theme-toggle"
    >
      <span className={light ? 'theme-toggle-dim' : 'theme-toggle-full'}>b</span>
      <span>/</span>
      <span className={light ? 'theme-toggle-full' : 'theme-toggle-dim'}>w</span>
    </button>
  )
}