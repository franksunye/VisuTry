/**
 * Root Layout
 *
 * Note: This layout provides SessionProvider for all routes.
 * The [locale]/layout.tsx will override <html> and <body> tags for i18n routes.
 * Admin routes will use this layout's <html> and <body> tags.
 */

import { SessionProvider } from '@/components/providers/SessionProvider'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get server session for SSR
  const session = await getServerSession(authOptions)

  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider session={session}>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
