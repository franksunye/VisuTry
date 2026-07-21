/**
 * Root Layout
 *
 * Single <html>/<body> shell for all routes. Locale-specific lang/dir and i18n
 * providers live in app/[locale]/layout.tsx (must not nest another html/body).
 */

import { SessionProvider } from '@/components/providers/SessionProvider'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // SessionProvider without a server-side session prop — next-auth will fetch
  // the session on the client via /api/auth/session. This avoids calling
  // getServerSession (which reads cookies()) in the root layout, which would
  // force every page into dynamic rendering and trigger a DB query per request.
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://www.google-analytics.com" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
