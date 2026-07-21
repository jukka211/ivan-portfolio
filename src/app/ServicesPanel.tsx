'use client'

import {useState} from 'react'
import styles from './servicesPanel.module.css'
import type {ServiceItem} from './types'

// Mirrors each service's own `details` field (Sanity Studio: Services / List
// of Services) — used only as a fallback for services edited before that
// field existed. Keyed by the service's own label, so each service row opens
// its own breakdown instead of one shared generic list.
const SERVICE_DETAILS: Record<string, string[]> = {
  'Brand Identity Systems': [
    'Positioning, naming direction, and verbal tone',
    'Logo, typographic system, and colour architecture',
    'Grid and layout systems for print and screen',
    'Brand book Digital Platform',
    'Rollout across web, print, and social templates',
  ],
  'Generative Brand Tools': [
    'Custom tools that let teams produce on-brand assets themselves',
    'Generative pattern, poster, and identity systems (p5.js / Canvas)',
    'Design-to-production automation for catalogues and large data sets',
  ],
}

// TODO: no copy yet for "Web Design, UX Analyse & Strategy" — falls back to
// this placeholder list until real content is provided.
const FALLBACK_SERVICE_DETAILS = [
  'Custom, non-template design and art direction',
  'Front-end development in Next.js / TypeScript.',
  'Headless CMS architecture (Sanity).',
  'Motion and interaction design, implemented.',
]

const FOOTER_TEXT =
  "I reply to every enquiry within two working days. Your details are used only to answer you — not stored beyond that, not passed on."

// Matches the recipient hardcoded in /api/send-request — shown only as a
// fallback contact if that request itself fails to send.
const TO_EMAIL = 'ivan@sukhov.xyz'

export default function ServicesPanel({
  services,
  activeServiceLabel,
  activeIndex,
  onActiveIndexChange,
}: {
  services: ServiceItem[]
  activeServiceLabel: string | null
  activeIndex: number | null
  onActiveIndexChange: (index: number | null) => void
}) {
  const activeService = services.find((service) => service.label === activeServiceLabel)
  const details =
    (activeService?.details?.length ? activeService.details : null) ||
    (activeServiceLabel && SERVICE_DETAILS[activeServiceLabel]) ||
    FALLBACK_SERVICE_DETAILS

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  if (activeIndex !== null) {
    return (
      <div className={styles.detailOpen}>
        <p className={styles.headline}>
          Tell me what you're working on. A rough idea is enough to start from — budget, timeline and
          scope can be worked out together.
        </p>

        <form
          className={styles.form}
          onSubmit={async (event) => {
            event.preventDefault()
            setStatus('sending')

            try {
              const res = await fetch('/api/send-request', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({name, email, message}),
              })
              if (!res.ok) throw new Error()
              setStatus('sent')
              setName('')
              setEmail('')
              setMessage('')
            } catch {
              setStatus('error')
            }
          }}
        >
          <textarea
            className={styles.textarea}
            placeholder="Your Request"
            aria-label="Your Request"
            rows={4}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            required
          />

          <div className={styles.formRow}>
            <input
              className={styles.input}
              type="text"
              placeholder="Full Name"
              aria-label="Full Name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <input
              className={styles.input}
              type="email"
              placeholder="E-Mail"
              aria-label="E-Mail"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <button type="submit" className={styles.send} disabled={status === 'sending' || status === 'sent'}>
              {status === 'sending' ? 'Sending…' : status === 'sent' ? 'Sent' : 'Send'}
            </button>
          </div>
        </form>

        {status === 'error' && (
          <p className={styles.footerText}>
            Something went wrong sending that — please try again or email me directly at {TO_EMAIL}.
          </p>
        )}

        <p className={styles.footerText}>{FOOTER_TEXT}</p>
      </div>
    )
  }

  return (
    <div className={styles.list}>
      {details.map((detail, index) => (
        <button
          key={detail}
          type="button"
          className={styles.row}
          onClick={() => onActiveIndexChange(index)}
        >
          <span className={styles.rowText}>{detail}</span>
          <span className={styles.rowHoverText}>Send request</span>
        </button>
      ))}
    </div>
  )
}
