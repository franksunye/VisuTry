'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Glasses, Mail, Twitter, Github } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

export function Footer() {
  const params = useParams()
  const locale = params.locale as string
  const currentYear = new Date().getFullYear()
  const t = useTranslations('footer')
  const translateFooter = (key: string, fallback: string) => t.has(key) ? t(key) : fallback

  return (
    <footer className="bg-white/80 backdrop-blur-sm border-t border-gray-200 mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-8 mb-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center mb-4">
              <Glasses className="w-8 h-8 text-blue-600 me-2" />
              <span className="text-xl font-bold text-gray-800">VisuTry</span>
            </div>
            <p className="text-gray-600 text-sm mb-6">
              {t('tagline')}
            </p>
            <div className="flex gap-x-4">
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
            <div className="mt-5 -ms-3 w-fit">
              <LanguageSwitcher />
            </div>
          </div>

          {/* Products */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">{translateFooter('links.products', 'Products')}</h3>
            <ul className="flex flex-col gap-y-2">
              <li>
                <Link href={`/${locale}/face-shape-detector`} prefetch={false} className="text-gray-600 hover:text-blue-600 text-sm transition-colors">
                  {translateFooter('links.faceShapeDetectorShort', 'Face Shape Detector')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/face-analysis`} prefetch={false} className="text-gray-600 hover:text-blue-600 text-sm transition-colors">
                  {translateFooter('links.faceAnalysisShort', 'Face Analysis')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/try-on/glasses`} prefetch={false} className="text-gray-600 hover:text-blue-600 text-sm transition-colors">
                  {translateFooter('links.virtualTryOnShort', 'Virtual Try-On')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/try-on/glasses/compare`} prefetch={false} className="text-gray-600 hover:text-blue-600 text-sm transition-colors">
                  {translateFooter('links.frameCompareShort', 'Frame Compare')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/style-explorer`} prefetch={false} className="text-gray-600 hover:text-blue-600 text-sm transition-colors">
                  {translateFooter('links.styleExplorerShort', 'Style Explorer')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Explore */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">{translateFooter('links.explore', 'Explore')}</h3>
            <ul className="flex flex-col gap-y-2">
              <li>
                <Link href={`/${locale}/discover`} prefetch={false} className="text-gray-600 hover:text-blue-600 text-sm transition-colors">
                  {translateFooter('links.discoverBrands', 'Discover Brands')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/blog`} prefetch={false} className="text-gray-600 hover:text-blue-600 text-sm transition-colors">
                  {t('links.blog')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/glasses-for-face-shape`} prefetch={false} className="text-gray-600 hover:text-blue-600 text-sm transition-colors">
                  {t('links.faceShapeGuide')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/faq`} prefetch={false} className="text-gray-600 hover:text-blue-600 text-sm transition-colors">
                  {t('links.faq')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Business */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">{translateFooter('links.businessSection', 'Business')}</h3>
            <ul className="flex flex-col gap-y-2">
              <li>
                <Link href={`/${locale}/business`} prefetch={false} className="text-gray-600 hover:text-blue-600 text-sm transition-colors">
                  {translateFooter('links.forEyewearBusinesses', 'For Eyewear Businesses')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/store`} prefetch={false} className="text-gray-600 hover:text-blue-600 text-sm transition-colors">
                  {translateFooter('links.visutryStore', 'VisuTry Store')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">{t('links.legal')}</h3>
            <ul className="flex flex-col gap-y-2">
              <li>
                <Link href={`/${locale}/privacy`} prefetch={false} className="text-gray-600 hover:text-blue-600 text-sm transition-colors">
                  {translateFooter('links.privacyShort', 'Privacy')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/terms`} prefetch={false} className="text-gray-600 hover:text-blue-600 text-sm transition-colors">
                  {translateFooter('links.termsShort', 'Terms')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/refund`} prefetch={false} className="text-gray-600 hover:text-blue-600 text-sm transition-colors">
                  {translateFooter('links.refundsShort', 'Refunds')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 pt-6">
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
