/**
 * Admin Root Layout
 *
 * Independent root layout for /admin routes. Admin pages are always English
 * and LTR, so lang="en" is hardcoded. This layout does NOT include next-intl
 * providers — admin pages use plain English strings.
 *
 * This is a separate root layout from [locale]/layout.tsx so that locale
 * routes can have locale-specific <html lang dir> attributes without
 * affecting admin pages.
 */

import { Inter } from 'next/font/google'
import { SessionProvider } from '@/components/providers/SessionProvider'
import '../globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export default function AdminGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={inter.variable} suppressHydrationWarning>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
