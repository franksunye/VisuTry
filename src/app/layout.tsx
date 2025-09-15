import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'VisuTry - AI眼镜试戴',
  description: '使用AI技术体验虚拟眼镜试戴，找到最适合你的眼镜款式',
  keywords: ['眼镜试戴', 'AI', '虚拟试戴', '眼镜', '人工智能'],
  authors: [{ name: 'VisuTry Team' }],
  openGraph: {
    title: 'VisuTry - AI眼镜试戴',
    description: '使用AI技术体验虚拟眼镜试戴，找到最适合你的眼镜款式',
    type: 'website',
    locale: 'zh_CN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VisuTry - AI眼镜试戴',
    description: '使用AI技术体验虚拟眼镜试戴，找到最适合你的眼镜款式',
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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          {children}
        </div>
      </body>
    </html>
  )
}
