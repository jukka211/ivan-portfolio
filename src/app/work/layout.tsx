import {Inter} from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  variable: '--work-font',
})

export default function WorkLayout({children}: {children: React.ReactNode}) {
  return <div className={inter.variable}>{children}</div>
}
