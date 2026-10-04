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

import '@fontsource-variable/inter/wght.css'
import { SessionProvider } from '@/components/providers/SessionProvider'
import '../globals.css'

export default function AdminGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
