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
import { analytics, getUserType } from '@/lib/analytics'

interface HeaderProps {
  transparent?: boolean
}

export function Header({ transparent = false }: HeaderProps) {
  const { data: session } = useSession()
  const { testSession } = useTestSession()
  const pathname = usePathname()
  const params = useParams()
  const locale = params.locale as string
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const t = useTranslations('nav')
  const tCommon = useTranslations('common')

  const isAuthenticated = !!(session || testSession)
  // Check if current path is the home page for this locale
  const isHomePage = pathname === `/${locale}` || pathname === `/${locale}/`

  // Navigation links with locale prefix
  const navLinks = useMemo(() => [
    { href: `/${locale}/try-on/glasses`, label: t('tryGlasses') },
    { href: `/${locale}/pricing`, label: t('pricing') },
    { href: `/${locale}#faq`, label: 'FAQ' },
  ], [locale, t])
  
  return (
    <header className={cn(
      "border-b border-gray-200 sticky top-0 z-50 transition-all",
      isHomePage && transparent
        ? "bg-transparent"
        : "bg-white/80 backdrop-blur-sm"
    )}>
      <nav className="container mx-auto px-4 py-3" aria-label="Main navigation">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link
            href={`/${locale}`}
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            aria-label="VisuTry Home"
          >
            <Glasses className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">VisuTry</span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => {
              const isPricingLink = link.href.includes('/pricing')
              return (
                <div key={link.href} className="relative flex items-center">
                  <Link
                    href={isPricingLink ? `/${locale}/pricing?code=BOGO` : link.href}
                    onClick={() => {
                      // 追踪 Pricing 链接点击
                      if (isPricingLink) {
                        const creditsPurchased = (session?.user as any)?.creditsPurchased || 0
                        const creditsUsed = (session?.user as any)?.creditsUsed || 0
                        const creditsRemaining = creditsPurchased - creditsUsed
                        const userType = getUserType(
                          session?.user?.isPremiumActive || false,
                          creditsRemaining,
                          !!session
                        )
                        analytics.trackViewPricing('nav', userType, (session?.user as any)?.remainingTrials || 0)
                      }
                    }}
                    className={cn(
                      'text-sm font-medium transition-colors hover:text-blue-600',
                      pathname === link.href
                        ? 'text-blue-600 border-b-2 border-blue-600 pb-1'
                        : 'text-gray-700'
                    )}
                  >
                    {link.label}
                  </Link>
                  {/* Promo Badge - only on Pricing link */}
                  {isPricingLink && (
                    <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 text-white animate-pulse">
                      🎁 Limited
                    </span>
                  )}
                </div>
              )
            })}
          </div>
          
          {/* CTA + Auth Section */}
          <div className="flex items-center space-x-3">
            {/* Language Switcher - Desktop */}
            <div className="hidden md:block">
              <LanguageSwitcher />
            </div>

            {/* CTA Button - Desktop only */}
            {!isAuthenticated ? (
              <Link
                href={`/${locale}/try-on`}
                className="hidden sm:flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
              >
                {tCommon('startFreeTrial')}
              </Link>
            ) : (
              <Link
                href={`/${locale}/try-on`}
                className="hidden sm:flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {tCommon('startTryOn')}
              </Link>
            )}

            {/* User Menu or Login Button */}
            {isAuthenticated ? (
              <UserMenu />
            ) : (
              <LoginButton variant="outline" />
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:text-blue-600 transition-colors"
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
            "md:hidden transition-all duration-300 ease-in-out",
            mobileMenuOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0 overflow-hidden"
          )}
          role="menu"
        >
          <div className="border-t border-gray-200 pt-4 pb-4 mt-3">
            <div className="flex flex-col space-y-3">
              {navLinks.map((link) => {
                const isPricingLink = link.href.includes('/pricing')
                return (
                  <Link
                    key={link.href}
                    href={isPricingLink ? `/${locale}/pricing?code=BOGO` : link.href}
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
                    {isPricingLink && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
                        🎁 Limited
                      </span>
                    )}
                  </Link>
                )
              })}
              
              {/* Mobile Language Switcher */}
              <div className="border-t border-gray-200 pt-3 mt-3">
                <LanguageSwitcher />
              </div>

              {/* Mobile CTA */}
              <div className="pt-3">
                {isAuthenticated ? (
                  <Link
                    href={`/${locale}/try-on`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {tCommon('startTryOn')}
                  </Link>
                ) : (
                  <Link
                    href={`/${locale}/try-on`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                  >
                    {tCommon('startFreeTrial')}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  )
}

