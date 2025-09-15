import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { SessionProvider } from '@/components/providers/SessionProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'VisuTry - AI Glasses Try-On',
  description: 'Experience virtual glasses try-on with AI technology and find the perfect glasses style for you',
  keywords: ['glasses try-on', 'AI', 'virtual try-on', 'glasses', 'artificial intelligence'],
  authors: [{ name: 'VisuTry Team' }],
  openGraph: {
    title: 'VisuTry - AI Glasses Try-On',
    description: 'Experience virtual glasses try-on with AI technology and find the perfect glasses style for you',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VisuTry - AI Glasses Try-On',
    description: 'Experience virtual glasses try-on with AI technology and find the perfect glasses style for you',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <SessionProvider>
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            {children}
          </div>
        </SessionProvider>
      </body>
    </html>
  )
}
