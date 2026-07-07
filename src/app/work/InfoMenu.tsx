'use client'

import {useState} from 'react'
import styles from './InfoMenu.module.css'

export type WorkProjectInfo = {
  project: string
  web: string
  client: string
}

type Panel = 'about' | 'project' | null

const CONTACT = {
  email: 'ivan@sukhov.xyz',
  instagram: 'https://www.instagram.com/sukhov.xyz/',
  web: 'https://sukhov.xyz',
}

const ABOUT = {
  name: 'Ivan Sukhov',
  location: 'Linz / Wien, AT',
  description: 'Markensysteme und Websites vom Konzept bis zum Deployment.',
  rows: [
    {label: 'Services:', lines: ['Web Design', 'Design to Development', 'Brand Identity']},
    {label: 'Stack:', lines: ['React / Next.js', 'Sanity', 'Vercel', 'Figma']},
    {
      label: 'Awards:',
      lines: ['CCA Venus: Silber', 'TDC New York', 'Joseph Binder: Silber'],
      underline: true,
    },
    {label: 'Mode:', lines: ['Projektbasis', 'Remote / Linz, Wien', 'DE, EN, RU']},
  ],
}

export default function InfoMenu({projectInfo}: {projectInfo: WorkProjectInfo | null}) {
  const [openPanel, setOpenPanel] = useState<Panel>(null)

  const toggle = (panel: Exclude<Panel, null>) => {
    setOpenPanel((current) => (current === panel ? null : panel))
  }

  const navButtonClass = (panel: Exclude<Panel, null>) => {
    if (!openPanel || openPanel === panel) return styles.navButton
    return `${styles.navButton} ${styles.navButtonDimmed}`
  }

  return (
    <div className={styles.menu}>
      <div className={`${styles.panel} ${openPanel === 'about' ? styles.panelFull : styles.panelAuto}`}>
        <div className={styles.buttons}>
          <button type="button" className={navButtonClass('about')} onClick={() => toggle('about')}>
            About
          </button>
          <button
            type="button"
            className={navButtonClass('project')}
            onClick={() => toggle('project')}
          >
            Project Info
          </button>
        </div>

        {openPanel === 'project' && projectInfo && (
          <div className={styles.rows}>
            <div className={styles.row}>
              <div className={styles.label}>Project:</div>
              <div className={styles.value}>{projectInfo.project}</div>
            </div>
            <div className={styles.row}>
              <div className={styles.label}>Web.:</div>
              <div className={styles.value}>{projectInfo.web}</div>
            </div>
            <div className={styles.row}>
              <div className={styles.label}>Client:</div>
              <div className={styles.value}>{projectInfo.client}</div>
            </div>
          </div>
        )}

        {openPanel === 'about' && (
          <div className={styles.aboutBody}>
            <div className={styles.rows}>
              <div className={`${styles.row} ${styles.identityRow}`}>
                <div className={styles.identityTop}>
                  <div>{ABOUT.name}</div>
                  <div>{ABOUT.location}</div>
                </div>
                <div className={styles.description}>{ABOUT.description}</div>
              </div>

              {ABOUT.rows.map((row) => (
                <div key={row.label} className={styles.row}>
                  <div className={styles.label}>{row.label}</div>
                  <div className={`${styles.value} ${row.underline ? styles.underline : ''}`}>
                    {row.lines.map((line, index) => (
                      <span key={line}>
                        {line}
                        {index < row.lines.length - 1 && <br />}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.contactRow}>
              <a href={`mailto:${CONTACT.email}`} className={styles.contactButton}>
                Mail
              </a>
              <a
                href={CONTACT.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.contactButton}
              >
                Inst.
              </a>
              <a
                href={CONTACT.web}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.contactButton}
              >
                Web.
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
