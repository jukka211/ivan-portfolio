'use client'

import {useState} from 'react'
import styles from './servicesPanel.module.css'
import type {ServiceItem} from './types'

// Shown when the selected service has no `headline` set in Sanity Studio
// (Services / Panel Headline), and for the generic "Send Request" entry
// point, which has no service context at all.
const DEFAULT_HEADLINE =
  "Tell me what you're working on. A rough idea is enough to start from — budget, timeline and scope can be worked out together."

const FOOTER_TEXT =
  "I reply to every enquiry within two working days. Your details are used only to answer you — not stored beyond that, not passed on."

// Matches the recipient hardcoded in /api/send-request — shown only as a
// fallback contact if that request itself fails to send.
const TO_EMAIL = 'ivan@sukhov.xyz'

export default function ServicesPanel({
  services,
  activeServiceLabel,
}: {
  services: ServiceItem[]
  activeServiceLabel: string | null
}) {
  const activeService = services.find((service) => service.label === activeServiceLabel)
  const headline = activeService?.headline?.trim() || DEFAULT_HEADLINE

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  return (
    <div className={styles.detailOpen}>
      <p className={styles.headline}>{headline}</p>

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
