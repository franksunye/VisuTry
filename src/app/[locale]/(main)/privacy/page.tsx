import { Metadata } from 'next'
import { generateSEO } from '@/lib/seo'
import Link from 'next/link'
import { ArrowLeft, Shield } from 'lucide-react'
import { Breadcrumbs } from '@/components/seo/Breadcrumbs'
import { getTranslations } from 'next-intl/server'

export const metadata: Metadata = generateSEO({
  title: 'Privacy Policy | VisuTry',
  description: 'Learn how VisuTry collects, uses, and protects your personal information. Our commitment to your privacy and data security.',
  url: '/privacy',
})

export default async function PrivacyPage() {
  const t = await getTranslations('legal.privacy')
  const lastUpdated = 'January 15, 2025'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <div className="mb-6">
          <Breadcrumbs
            items={[
              { name: t('title') },
            ]}
          />
        </div>

        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('backToHome')}
          </Link>

          <div className="flex items-center mb-4">
            <Shield className="w-10 h-10 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">{t('title')}</h1>
          </div>

          <p className="text-gray-600">
            {t('lastUpdated', { date: lastUpdated })}
          </p>
        </div>

        {/* Content */}
        <div className="glass-effect rounded-2xl p-8 max-w-4xl">
          <div className="prose prose-blue max-w-none">
            
            {/* Introduction */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-700 mb-4">
                Welcome to VisuTry (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We are committed to protecting your personal information
                and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard
                your information when you use our AI-powered virtual glasses try-on service.
              </p>
              <p className="text-gray-700">
                By using VisuTry, you agree to the collection and use of information in accordance with this policy.
                If you do not agree with our policies and practices, please do not use our service.
              </p>
            </section>

            {/* Information We Collect */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">2.1 Personal Information</h3>
              <p className="text-gray-700 mb-4">
                When you create an account or use our service, we may collect:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Name and email address (via Twitter OAuth)</li>
                <li>Profile information from your Twitter account</li>
                <li>Payment information (processed securely by Stripe)</li>
                <li>Account preferences and settings</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">2.2 Images and Content</h3>
              <p className="text-gray-700 mb-4">
                To provide our AI try-on service, we collect:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Photos you upload for virtual try-on</li>
                <li>Custom glasses images you upload</li>
                <li>Generated try-on results</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">2.3 Usage Data</h3>
              <p className="text-gray-700 mb-4">
                We automatically collect certain information when you use our service:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Device information (browser type, operating system)</li>
                <li>IP address and location data</li>
                <li>Usage statistics and interaction data</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </section>

            {/* How We Use Your Information */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-700 mb-4">
                We use the collected information for the following purposes:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>To provide and maintain our AI virtual try-on service</li>
                <li>To process your payments and manage subscriptions</li>
                <li>To improve and personalize your experience</li>
                <li>To communicate with you about updates, offers, and support</li>
                <li>To detect, prevent, and address technical issues or fraud</li>
                <li>To comply with legal obligations</li>
                <li>To analyze usage patterns and improve our service</li>
              </ul>
            </section>

            {/* Third-Party Services */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Third-Party Services</h2>
              <p className="text-gray-700 mb-4">
                We use the following third-party services to operate our platform:
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-gray-900 mb-2">Stripe (Payment Processing)</h4>
                <p className="text-gray-700 text-sm">
                  We use Stripe to process payments securely. Stripe may collect and process your payment information.
                  Please review Stripe&apos;s Privacy Policy at{' '}
                  <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    stripe.com/privacy
                  </a>
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-gray-900 mb-2">Google Gemini AI</h4>
                <p className="text-gray-700 text-sm">
                  We use Google Gemini AI to process your images for virtual try-on. Your images are sent to Google&apos;s
                  servers for processing. Please review Google&apos;s Privacy Policy at{' '}
                  <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    policies.google.com/privacy
                  </a>
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-gray-900 mb-2">Vercel (Hosting &amp; Storage)</h4>
                <p className="text-gray-700 text-sm">
                  Our service is hosted on Vercel, and we use Vercel Blob for image storage. Please review Vercel&apos;s
                  Privacy Policy at{' '}
                  <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    vercel.com/legal/privacy-policy
                  </a>
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-gray-900 mb-2">Twitter OAuth</h4>
                <p className="text-gray-700 text-sm">
                  We use Twitter OAuth for authentication. Please review Twitter&apos;s Privacy Policy at{' '}
                  <a href="https://twitter.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    twitter.com/privacy
                  </a>
                </p>
              </div>
            </section>

            {/* Data Storage and Security */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Storage and Security</h2>
              <p className="text-gray-700 mb-4">
                We implement appropriate technical and organizational security measures to protect your personal information:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Encrypted data transmission using HTTPS/SSL</li>
                <li>Secure database storage with access controls</li>
                <li>Regular security audits and updates</li>
                <li>Limited employee access to personal data</li>
              </ul>
              <p className="text-gray-700">
                However, no method of transmission over the Internet is 100% secure. While we strive to protect your 
                personal information, we cannot guarantee absolute security.
              </p>
            </section>

            {/* Data Retention */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Data Retention</h2>
              <p className="text-gray-700 mb-4">
                We retain your personal information only for as long as necessary to fulfill the purposes outlined in 
                this Privacy Policy:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Account information: Until you delete your account</li>
                <li>Uploaded images: Until you delete them or your account</li>
                <li>Payment records: As required by law (typically 7 years)</li>
                <li>Usage data: Up to 2 years for analytics purposes</li>
              </ul>
            </section>

            {/* Your Rights */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Your Privacy Rights</h2>
              <p className="text-gray-700 mb-4">
                Depending on your location, you may have the following rights:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correction:</strong> Request correction of inaccurate data</li>
                <li><strong>Deletion:</strong> Request deletion of your personal data</li>
                <li><strong>Portability:</strong> Request transfer of your data</li>
                <li><strong>Objection:</strong> Object to processing of your data</li>
                <li><strong>Restriction:</strong> Request restriction of processing</li>
              </ul>
              <p className="text-gray-700">
                To exercise these rights, please contact us at{' '}
                <a href="mailto:privacy@visutry.com" className="text-blue-600 hover:underline">
                  privacy@visutry.com
                </a>
              </p>
            </section>

            {/* Cookies */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Cookies and Tracking</h2>
              <p className="text-gray-700 mb-4">
                We use cookies and similar tracking technologies to track activity on our service and store certain information:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li><strong>Essential Cookies:</strong> Required for authentication and security</li>
                <li><strong>Analytics Cookies:</strong> Help us understand how you use our service</li>
                <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
              </ul>
              <p className="text-gray-700">
                You can control cookies through your browser settings. However, disabling cookies may affect the 
                functionality of our service.
              </p>
            </section>

            {/* Children's Privacy */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Children&apos;s Privacy</h2>
              <p className="text-gray-700">
                Our service is not intended for children under 13 years of age. We do not knowingly collect personal
                information from children under 13. If you are a parent or guardian and believe your child has provided
                us with personal information, please contact us.
              </p>
            </section>

            {/* Changes to Privacy Policy */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Changes to This Privacy Policy</h2>
              <p className="text-gray-700">
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the
                new Privacy Policy on this page and updating the &quot;Last updated&quot; date. You are advised to review this
                Privacy Policy periodically for any changes.
              </p>
            </section>

            {/* Contact */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Contact Us</h2>
              <p className="text-gray-700 mb-4">
                If you have any questions about this Privacy Policy, please contact us:
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-gray-700">
                  <strong>Email:</strong>{' '}
                  <a href="mailto:privacy@visutry.com" className="text-blue-600 hover:underline">
                    privacy@visutry.com
                  </a>
                </p>
                <p className="text-gray-700 mt-2">
                  <strong>Support:</strong>{' '}
                  <a href="mailto:support@visutry.com" className="text-blue-600 hover:underline">
                    support@visutry.com
                  </a>
                </p>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  )
}

