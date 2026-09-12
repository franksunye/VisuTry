'use client'

import { useCallback, useMemo, useState } from 'react'
import { Glasses, Menu, Shield, Sparkles, X } from 'lucide-react'
import Link from '@/components/layout/PublicLink'
import { useParams, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { cn } from '@/utils/cn'

/**
 * Anonymous-first navigation for public SEO and marketing routes.
 *
 * This component deliberately has no session or auth-runtime dependency. A
 * sign-in link is still available, but authentication starts only after the
 * visitor explicitly follows that link and uses the auth surface.
 */
export function PublicHeader() {
  const params = useParams()
  const pathname = usePathname()
  const localeParam = params.locale
  const locale = Array.isArray(localeParam) ? localeParam[0] : localeParam
  const currentPathname = pathname ?? `/${locale}`
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const t = useTranslations('nav')
  const tCommon = useTranslations('common')
  const translateNav = useCallback((key: string, fallback: string) => t.has(key) ? t(key) : fallback, [t])

  const isHomePage = currentPathname === `/${locale}` || currentPathname === `/${locale}/`
  const signInHref = `/${locale}/auth/signin?callbackUrl=${encodeURIComponent(currentPathname)}`

  const navLinks = useMemo(() => [
    { href: `/${locale}/face-shape-detector`, label: t('detectorShort') },
    { href: `/${locale}/face-analysis`, label: translateNav('analysisShort', locale === 'en' ? 'Analysis' : t('advisorShort')) },
    { href: `/${locale}/try-on/glasses`, label: t('tryOnShort') },
    { href: `/${locale}/try-on/glasses/compare`, label: t('compareShort') },
    { href: `/${locale}/style-explorer`, label: t('explorerShort') },
  ], [locale, t, translateNav])

  return (
    <header className="border-b border-gray-200 sticky top-0 z-50 transition-all bg-white/80 backdrop-blur-sm">
      <nav className="container mx-auto px-4 py-3" aria-label="Main navigation">
        <div className="flex items-center justify-between gap-4">
          <Link
            href={`/${locale}`}
            prefetch={false}
            className="flex shrink-0 items-center gap-x-2 transition-opacity hover:opacity-80"
            aria-label="VisuTry Home"
          >
            <Glasses className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">VisuTry</span>
          </Link>

          <div className="hidden items-center gap-6 lg:flex">
            {navLinks.map((link) => (
              <div key={link.href} className="relative flex items-center">
                <Link
                  href={link.href}
                  prefetch={false}
                  className={cn(
                    'whitespace-nowrap text-sm font-medium transition-colors hover:text-blue-600',
                    currentPathname === link.href
                      ? 'text-blue-600 border-b-2 border-blue-600 pb-1'
                      : 'text-gray-700',
                  )}
                >
                  {link.label}
                </Link>
              </div>
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-x-3">
            {!isHomePage ? (
              <Link
                href={`/${locale}/face-shape-detector`}
                prefetch={false}
                className="hidden sm:flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
              >
                {tCommon('checkFaceShape')}
              </Link>
            ) : null}

            <Link
              href={signInHref}
              prefetch={false}
              className="flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              <Shield className="w-4 h-4 me-2" />
              Sign in
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-gray-700 hover:text-blue-600 transition-colors"
              aria-label={t('toggleMenu')}
              aria-expanded={mobileMenuOpen}
              aria-controls="public-mobile-menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        <div
          id="public-mobile-menu"
          className={cn(
            'lg:hidden transition-all duration-300 ease-in-out',
            mobileMenuOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden',
          )}
          role="menu"
        >
          <div className="border-t border-gray-200 pt-4 pb-4 mt-3">
            <div className="flex flex-col gap-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch={false}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-between',
                    currentPathname === link.href
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50',
                  )}
                  role="menuitem"
                >
                  <span>{link.label}</span>
                </Link>
              ))}

              <div className="pt-3">
                {!isHomePage ? (
                  <Link
                    href={`/${locale}/face-shape-detector`}
                    prefetch={false}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                  >
                    <Sparkles className="w-4 h-4 me-2" />
                    {tCommon('checkFaceShape')}
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  )
}
