'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Glasses, Menu, X, Sparkles } from 'lucide-react'
import { LoginButton } from '@/components/auth/LoginButton'
import { UserMenu } from '@/components/auth/UserMenu'
import { useState } from 'react'
import { cn } from '@/utils/cn'
import { useTestSession } from '@/hooks/useTestSession'

interface HeaderProps {
  transparent?: boolean
}

export function Header({ transparent = false }: HeaderProps) {
  const { data: session } = useSession()
  const { testSession } = useTestSession()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  const isAuthenticated = !!(session || testSession)
  const isHomePage = pathname === '/'
  
  // 主导航链接（保持简洁，只有3个核心功能）
  const navLinks = [
    { href: '/try-on', label: 'Try-On' },
    { href: '/blog', label: 'Blog' },
    { href: '/pricing', label: 'Pricing' },
  ]
  
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
            href="/" 
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            aria-label="VisuTry Home"
          >
            <Glasses className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">VisuTry</span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-blue-600',
                  pathname === link.href
                    ? 'text-blue-600 border-b-2 border-blue-600 pb-1'
                    : 'text-gray-700'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
          
          {/* CTA + Auth Section */}
          <div className="flex items-center space-x-3">
            {/* CTA Button - Desktop only */}
            {!isAuthenticated ? (
              <Link
                href="/try-on"
                className="hidden sm:flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
              >
                Start Free Trial
              </Link>
            ) : (
              <Link
                href="/try-on"
                className="hidden sm:flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Start Try-On
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
              aria-label="Toggle navigation menu"
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
            "md:hidden overflow-hidden transition-all duration-300 ease-in-out",
            mobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          )}
          role="menu"
        >
          <div className="border-t border-gray-200 pt-4 pb-4 mt-3">
            <div className="flex flex-col space-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    pathname === link.href
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  )}
                  role="menuitem"
                >
                  {link.label}
                </Link>
              ))}
              
              {/* Mobile CTA */}
              <div className="border-t border-gray-200 pt-3 mt-3">
                {isAuthenticated ? (
                  <Link
                    href="/try-on"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Start Try-On
                  </Link>
                ) : (
                  <Link
                    href="/try-on"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                  >
                    Start Free Trial
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

