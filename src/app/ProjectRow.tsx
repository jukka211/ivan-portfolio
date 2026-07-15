'use client'

import shared from './version3.module.css'
import styles from './projectRow.module.css'
import type {CreditItem, Project} from './types'

function CreditColumn({items}: {items?: CreditItem[] | null}) {
  if (!items?.length) return null

  return (
    <div className={styles.creditColumn}>
      {items.map((item, index) => (
        <div className={styles.creditItem} key={item._key ?? index}>
          <span className={shared.muted}>{item.role}</span>
          <span>{item.name}</span>
        </div>
      ))}
    </div>
  )
}

export default function ProjectRow({
  project,
  sectionLabel,
  isOpen,
  onToggle,
  onHoverChange,
}: {
  project: Project
  sectionLabel?: string
  isOpen: boolean
  onToggle: () => void
  onHoverChange: (hovering: boolean) => void
}) {
  const hasCredits = !!(project.credits?.leftColumn1?.length || project.credits?.leftColumn2?.length)

  return (
    <div
      className={styles.row}
      data-open={isOpen || undefined}
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
    >
      <button
        type="button"
        className={styles.header}
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span className={shared.gutter}>{sectionLabel}</span>
        <span className={shared.infoGrid}>
          <span>{project.title || 'Untitled project'}</span>
          <span className={shared.muted}>{project.type}</span>
          <span className={shared.muted}>{project.year}</span>
        </span>
      </button>

      <div className={styles.description}>
        <div className={styles.descriptionInner}>
          <div className={styles.descriptionContent}>
            {project.excerpt && (
              <div className={styles.excerptRow}>
                <span className={`${shared.gutter} ${styles.excerptGutter}`}>Description</span>
                <p className={styles.excerpt}>{project.excerpt}</p>
              </div>
            )}

            {hasCredits && (
              <div className={styles.credits}>
                <CreditColumn items={project.credits?.leftColumn1} />
                <CreditColumn items={project.credits?.leftColumn2} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
