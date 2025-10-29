import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { SessionProvider } from '@/components/providers/SessionProvider'
import { DEFAULT_SEO } from '@/lib/seo'
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics'
import { GoogleTagManager } from '@/components/analytics/GoogleTagManager'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = DEFAULT_SEO

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID

  return (
    <html lang="en">
      <head>
        {/* Preconnect to external domains for faster resource loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://www.google-analytics.com" />

        {/* DNS prefetch for additional performance */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
      </head>
      <body className={inter.className}>
        {/* Google Tag Manager */}
        {gtmId && <GoogleTagManager gtmId={gtmId} />}

        {/* Google Analytics */}
        {gaId && <GoogleAnalytics gaId={gaId} />}

        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
