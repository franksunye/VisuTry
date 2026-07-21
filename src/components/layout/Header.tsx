'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname, useParams } from 'next/navigation'
import { Glasses, Menu, X, Sparkles } from 'lucide-react'
import { LoginButton } from '@/components/auth/LoginButton'
import { UserMenu } from '@/components/auth/UserMenu'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useState, useMemo } from 'react'
import { cn } from '@/utils/cn'
import { useTestSession } from '@/hooks/useTestSession'
import { useTranslations } from 'next-intl'

interface HeaderProps {
  transparent?: boolean
}

export function Header({ transparent = false }: HeaderProps) {
  const { data: session, status } = useSession()
  const { testSession } = useTestSession()
  const pathname = usePathname()
  const params = useParams()
  const locale = params.locale as string
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const t = useTranslations('nav')
  const tCommon = useTranslations('common')

  // While session is loading, render a neutral placeholder to avoid flashing
  // LoginButton → UserMenu for authenticated users on page refresh.
  const sessionLoading = status === 'loading' && !testSession
  const isAuthenticated = !!(session || testSession)
  // Check if current path is the home page for this locale
  const isHomePage = pathname === `/${locale}` || pathname === `/${locale}/`

  const navLinks = useMemo(() => [
    { href: `/${locale}/face-shape-detector`, label: t('detectorShort') },
    { href: `/${locale}/face-analysis`, label: t('advisorShort') },
    { href: `/${locale}/try-on/glasses`, label: t('tryOnShort') },
    { href: `/${locale}/style-explorer`, label: t('explorerShort') },
    { href: `/${locale}/try-on/glasses/compare`, label: t('compareShort') },
  ], [locale, t])
  
  return (
    <header className={cn(
      "border-b border-gray-200 sticky top-0 z-50 transition-all",
      isHomePage && transparent
        ? "bg-transparent"
        : "bg-white/80 backdrop-blur-sm"
    )}>
      <nav className="container mx-auto px-4 py-3" aria-label="Main navigation">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link
            href={`/${locale}`}
            className="flex shrink-0 items-center space-x-2 transition-opacity hover:opacity-80"
            aria-label="VisuTry Home"
          >
            <Glasses className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">VisuTry</span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden items-center gap-6 lg:flex">
            {navLinks.map((link) => {
              return (
                <div key={link.href} className="relative flex items-center">
                  <Link
                    href={link.href}
                    className={cn(
                      'whitespace-nowrap text-sm font-medium transition-colors hover:text-blue-600',
                      pathname === link.href
                        ? 'text-blue-600 border-b-2 border-blue-600 pb-1'
                        : 'text-gray-700'
                    )}
                  >
                    {link.label}
                  </Link>
                </div>
              )
            })}
          </div>
          
          {/* CTA + Auth Section */}
          <div className="flex shrink-0 items-center space-x-3">
            {/* Language Switcher - Desktop */}
            <div className="hidden lg:block">
              <LanguageSwitcher />
            </div>

            {/* CTA Button - Desktop only */}
            {sessionLoading ? (
              <div className="hidden sm:flex items-center px-4 py-2 w-24" aria-hidden="true" />
            ) : isAuthenticated ? (
              <Link
                href={`/${locale}/try-on`}
                className="hidden items-center whitespace-nowrap rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 sm:flex"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {t('tryOnShort')}
              </Link>
            ) : !isHomePage ? (
              <Link
                href={`/${locale}/face-shape-detector`}
                className="hidden sm:flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
              >
                {tCommon('checkFaceShape')}
              </Link>
            ) : null}

            {/* User Menu or Login Button (placeholder while session loads) */}
            {sessionLoading ? (
              <div className="h-9 w-20 rounded-lg bg-gray-100 animate-pulse" aria-hidden="true" />
            ) : isAuthenticated ? (
              <UserMenu />
            ) : (
              <LoginButton variant="outline" />
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-gray-700 hover:text-blue-600 transition-colors"
              aria-label={t('toggleMenu')}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
        
        {/* Mobile Navigation with Animation */}
        <div
          id="mobile-menu"
          className={cn(
            "lg:hidden transition-all duration-300 ease-in-out",
            mobileMenuOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0 overflow-hidden"
          )}
          role="menu"
        >
          <div className="border-t border-gray-200 pt-4 pb-4 mt-3">
            <div className="flex flex-col space-y-3">
              {navLinks.map((link) => {
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-between',
                      pathname === link.href
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    )}
                    role="menuitem"
                  >
                    <span>{link.label}</span>
                  </Link>
                )
              })}
              
              {/* Mobile Language Switcher */}
              <div className="border-t border-gray-200 pt-3 mt-3">
                <LanguageSwitcher />
              </div>

              {/* Mobile CTA */}
              <div className="pt-3">
                {sessionLoading ? null : isAuthenticated ? (
                  <Link
                    href={`/${locale}/try-on`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {tCommon('startTryOn')}
                  </Link>
                ) : !isHomePage ? (
                  <Link
                    href={`/${locale}/face-shape-detector`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                  >
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
