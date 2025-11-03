/**
 * Root Layout
 *
 * Note: This layout is minimal because <html> and <body> tags
 * are now in the [locale]/layout.tsx to support i18n.
 *
 * This layout only exists to satisfy Next.js requirements
 * and will be bypassed by the locale-specific layouts.
 */

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
