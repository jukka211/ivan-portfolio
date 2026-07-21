import type {Metadata} from 'next'
import {getLegalPage} from '@/sanity/lib/fetch'
import styles from './legal.module.css'

export const metadata: Metadata = {
  title: 'Legal',
}

type LegalPageData = {
  title?: string
  columnOne?: string
  columnTwo?: string
}

export default async function LegalPage() {
  const data = await getLegalPage<LegalPageData | null>()

  return (
    <main className={styles.page}>
      <div className={styles.columns}>
        <p className={styles.column}>{data?.columnOne}</p>
        <p className={styles.column}>{data?.columnTwo}</p>
      </div>
    </main>
  )
}
