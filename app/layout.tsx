import type { Metadata } from 'next'
import { Fraunces, Be_Vietnam_Pro } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import { SITE_NAME, SITE_TAGLINE, SITE_URL } from '@/lib/config'

const display = Fraunces({ subsets: ['latin', 'vietnamese'], variable: '--font-display', display: 'swap' })
const body = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: `%s · ${SITE_NAME}` },
  description: SITE_TAGLINE,
  openGraph: { siteName: SITE_NAME, locale: 'vi_VN', type: 'website' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${display.variable} ${body.variable}`}>
      <body>
        <Header />
        {children}
      </body>
    </html>
  )
}
