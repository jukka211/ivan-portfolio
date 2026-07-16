'use client'

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
    'Screen and exhibition pieces built on the same system',
  ],
}

// TODO: no copy yet for "Web Design, UX Analyse & Strategy" — falls back to
// this placeholder list until real content is provided.
const FALLBACK_SERVICE_DETAILS = [
  'Custom, non-template design and art direction',
  'Front-end development in Next.js / TypeScript.',
  'Headless CMS architecture (Sanity).',
  'Motion and interaction design, implemented.',
  'Performance-focused, accessibility-aware.',
]

const INTRO_TEXT_1 =
  "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy."
const INTRO_TEXT_2 =
  'Dummy text ever since 1966, when designers at Letraset and James Mosley, the librarian at St Bride Printing Library in London.'
const FOOTER_TEXT =
  "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since 1966, when designers at Letraset and James Mosley, the librarian at St Bride Printing Library in London."

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

  if (activeIndex !== null) {
    // The Detail Open title stays the general "Services:" list — not the
    // specific statement clicked into — regardless of which row opened it.
    const title = `Services: ${services.map((service) => service.label).filter(Boolean).join(',')}`

    return (
      <div className={styles.detailOpen}>
        <button type="button" className={styles.headline} onClick={() => onActiveIndexChange(null)}>
          {title}
        </button>

        <form
          className={styles.form}
          onSubmit={(event) => {
            event.preventDefault()
            // TODO: wire up to Resend once the email-sending API is in place.
          }}
        >
          <div className={styles.formIntro}>
            <p>{INTRO_TEXT_1}</p>
            <p>{INTRO_TEXT_2}</p>
          </div>

          <textarea
            className={styles.textarea}
            placeholder="Your Request"
            aria-label="Your Request"
            rows={4}
          />

          <div className={styles.formRow}>
            <input
              className={styles.input}
              type="text"
              placeholder="Full Name"
              aria-label="Full Name"
            />
            <input className={styles.input} type="email" placeholder="E-Mail" aria-label="E-Mail" />
            <button type="submit" className={styles.send}>
              Send
            </button>
          </div>
        </form>

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
