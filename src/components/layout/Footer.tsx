'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Glasses, Mail, Twitter, Github } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function Footer() {
  const params = useParams()
  const locale = params.locale as string
  const currentYear = new Date().getFullYear()
  const t = useTranslations('footer')

  return (
    <footer className="bg-white/80 backdrop-blur-sm border-t border-gray-200 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center mb-4">
              <Glasses className="w-8 h-8 text-blue-600 mr-2" />
              <span className="text-xl font-bold text-gray-800">VisuTry</span>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              {t('tagline')}
            </p>
            <div className="flex space-x-4">
              <a
                href="https://twitter.com/visutry"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-blue-600 transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="https://github.com/franksunye/VisuTry"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-gray-900 transition-colors"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="mailto:support@visutry.com"
                className="text-gray-600 hover:text-blue-600 transition-colors"
                aria-label="Email"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">{t('links.product')}</h3>
            <ul className="space-y-2">
              <li>
                <Link href={`/${locale}/try-on`} className="text-gray-600 hover:text-blue-600 text-sm transition-colors">
                  {t('links.tryOn')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/pricing`} className="text-gray-600 hover:text-blue-600 text-sm transition-colors">
                  {t('links.pricing')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/blog`} className="text-gray-600 hover:text-blue-600 text-sm transition-colors">
                  {t('links.blog')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">{t('links.legal')}</h3>
            <ul className="space-y-2">
              <li>
                <Link href={`/${locale}/privacy`} className="text-gray-600 hover:text-blue-600 text-sm transition-colors">
                  {t('links.privacy')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/terms`} className="text-gray-600 hover:text-blue-600 text-sm transition-colors">
                  {t('links.terms')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/refund`} className="text-gray-600 hover:text-blue-600 text-sm transition-colors">
                  {t('links.refund')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 mt-8 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-600 text-sm">
              {t('copyright', { year: currentYear })}
            </p>
            <p className="text-gray-500 text-xs mt-2 md:mt-0">
              {t('madeWith')}
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

