/**
 * Locale-specific 404 Page
 *
 * Rendered when notFound() is called within a [locale] route, or when a
 * locale-prefixed route doesn't match. The locale is already set by
 * setRequestLocale() in [locale]/layout.tsx, so getTranslations() works
 * without needing to access params directly.
 */

import { getTranslations, getLocale } from 'next-intl/server'
import { AlertCircle, Glasses, Search, Home } from 'lucide-react'
import Link from 'next/link'
import { Metadata } from 'next'
import { localizedPath } from '@/lib/localized-path'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('notFound')
  return {
    title: t('title'),
    description: t('description'),
    robots: {
      index: false,
      follow: false,
    },
  }
}

export default async function NotFound() {
  const t = await getTranslations('notFound')
  const locale = await getLocale()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <Glasses className="w-12 h-12 text-blue-600 me-3" />
          <h1 className="text-3xl font-bold text-gray-900">VisuTry</h1>
        </div>

        {/* 404 Icon */}
        <div className="flex items-center justify-center mb-6">
          <AlertCircle className="w-20 h-20 text-gray-400" />
        </div>

        {/* Error Message */}
        <div className="mb-8">
          <h2 className="text-6xl font-bold text-gray-900 mb-4">{t('heading')}</h2>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            {t('subheading')}
          </h3>
          <p className="text-gray-600">
            {t('message')}
          </p>
        </div>

        {/* Helpful Links */}
        <div className="flex flex-col gap-y-3">
          <Link
            href={localizedPath(locale, '/')}
            className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
          >
            <Home className="w-5 h-5 me-2" />
            {t('backToHome')}
          </Link>

          <Link
            href={localizedPath(locale, '/try-on')}
            className="w-full flex items-center justify-center px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <Glasses className="w-5 h-5 me-2" />
            {t('tryOn')}
          </Link>

          <Link
            href={localizedPath(locale, '/blog')}
            className="w-full flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Search className="w-5 h-5 me-2" />
            {t('browseBlog')}
          </Link>
        </div>

        {/* Popular Pages */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">{t('popularPages')}</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link
              href={localizedPath(locale, '/blog/how-to-choose-glasses-for-your-face')}
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              {t('faceShapeGuide')}
            </Link>
            <span className="text-gray-300">•</span>
            <Link
              href={localizedPath(locale, '/blog/best-ai-virtual-glasses-tryon-tools-2025')}
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              {t('aiTryOnTools')}
            </Link>
            <span className="text-gray-300">•</span>
            <Link
              href={localizedPath(locale, '/pricing')}
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              {t('pricing')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
