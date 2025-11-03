import { Metadata } from 'next'
import { generateSEO } from '@/lib/seo'
import Link from 'next/link'
import { ArrowLeft, FileText } from 'lucide-react'
import { Breadcrumbs } from '@/components/seo/Breadcrumbs'

export const metadata: Metadata = generateSEO({
  title: 'Terms of Service | VisuTry',
  description: 'Read VisuTry Terms of Service. Learn about user responsibilities, service usage rules, and legal terms for our AI glasses try-on platform.',
  url: '/terms',
})

export default function TermsPage() {
  const lastUpdated = 'January 15, 2025'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <div className="mb-6">
          <Breadcrumbs
            items={[
              { name: 'Terms of Service' },
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
            Back to Home
          </Link>
          
          <div className="flex items-center mb-4">
            <FileText className="w-10 h-10 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">Terms of Service</h1>
          </div>
          
          <p className="text-gray-600">
            Last updated: {lastUpdated}
          </p>
        </div>

        {/* Content */}
        <div className="glass-effect rounded-2xl p-8 max-w-4xl">
          <div className="prose prose-blue max-w-none">
            
            {/* Introduction */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Agreement to Terms</h2>
              <p className="text-gray-700 mb-4">
                Welcome to VisuTry. These Terms of Service (&quot;Terms&quot;) govern your access to and use of our AI-powered
                virtual glasses try-on service, website, and related services (collectively, the &quot;Service&quot;).
              </p>
              <p className="text-gray-700 mb-4">
                By accessing or using our Service, you agree to be bound by these Terms. If you do not agree to these
                Terms, please do not use our Service.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-gray-700 text-sm">
                  <strong>Important:</strong> These Terms include an arbitration clause and class action waiver that
                  affect your legal rights. Please read them carefully.
                </p>
              </div>
            </section>

            {/* Service Description */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Service Description</h2>
              <p className="text-gray-700 mb-4">
                VisuTry provides an AI-powered virtual glasses try-on service that allows users to:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Upload personal photos for virtual try-on</li>
                <li>Upload custom glasses images</li>
                <li>Generate AI-powered try-on results</li>
                <li>Save and share try-on results</li>
                <li>Access premium features through paid subscriptions</li>
              </ul>
              <p className="text-gray-700">
                We reserve the right to modify, suspend, or discontinue any part of the Service at any time with or 
                without notice.
              </p>
            </section>

            {/* Account Registration */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Account Registration and Security</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">3.1 Account Creation</h3>
              <p className="text-gray-700 mb-4">
                To use certain features of our Service, you must create an account. You agree to:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Provide accurate and complete information</li>
                <li>Maintain and update your information</li>
                <li>Keep your account credentials secure</li>
                <li>Be responsible for all activities under your account</li>
                <li>Notify us immediately of any unauthorized access</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">3.2 Age Requirement</h3>
              <p className="text-gray-700">
                You must be at least 13 years old to use our Service. If you are under 18, you must have permission 
                from a parent or legal guardian.
              </p>
            </section>

            {/* User Responsibilities */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. User Responsibilities and Conduct</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">4.1 Acceptable Use</h3>
              <p className="text-gray-700 mb-4">
                You agree to use the Service only for lawful purposes. You must not:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Upload images that violate any laws or third-party rights</li>
                <li>Upload inappropriate, offensive, or harmful content</li>
                <li>Use the Service to harass, abuse, or harm others</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with or disrupt the Service</li>
                <li>Use automated systems to access the Service without permission</li>
                <li>Reverse engineer or attempt to extract source code</li>
                <li>Resell or redistribute our Service without authorization</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">4.2 Content Ownership</h3>
              <p className="text-gray-700 mb-4">
                You retain ownership of the images you upload. By uploading content, you grant us a license to:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Process your images using our AI technology</li>
                <li>Store your images on our servers</li>
                <li>Display your try-on results to you</li>
                <li>Use anonymized data to improve our Service</li>
              </ul>
            </section>

            {/* Intellectual Property */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Intellectual Property Rights</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">5.1 Our Rights</h3>
              <p className="text-gray-700 mb-4">
                The Service, including all content, features, and functionality, is owned by VisuTry and is protected by:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Copyright laws</li>
                <li>Trademark laws</li>
                <li>Patent laws</li>
                <li>Other intellectual property rights</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">5.2 Generated Content</h3>
              <p className="text-gray-700">
                AI-generated try-on results are created using your uploaded images and our proprietary technology. 
                You may use these results for personal, non-commercial purposes. Commercial use requires our written 
                permission.
              </p>
            </section>

            {/* Payment Terms */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Payment and Subscription Terms</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">6.1 Pricing</h3>
              <p className="text-gray-700 mb-4">
                We offer various pricing plans:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li><strong>Free Plan:</strong> Limited try-ons with basic features</li>
                <li><strong>Credits Pack:</strong> One-time purchase of additional try-ons</li>
                <li><strong>Premium Subscriptions:</strong> Monthly or annual recurring billing</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">6.2 Billing</h3>
              <p className="text-gray-700 mb-4">
                By purchasing a subscription, you agree that:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>You authorize us to charge your payment method</li>
                <li>Subscriptions automatically renew unless cancelled</li>
                <li>You are responsible for all charges incurred</li>
                <li>Prices may change with 30 days notice</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">6.3 Refunds</h3>
              <p className="text-gray-700">
                Refunds are subject to our{' '}
                <Link href="/refund" className="text-blue-600 hover:underline">
                  Refund Policy
                </Link>
                . Please review it carefully before making a purchase.
              </p>
            </section>

            {/* Service Limitations */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Service Limitations and Disclaimers</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">7.1 AI Technology Limitations</h3>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-gray-700 mb-2">
                  <strong>Important Notice:</strong> Our AI-generated try-on results are for visualization purposes only.
                </p>
                <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                  <li>Results may not be 100% accurate</li>
                  <li>Actual glasses may look different in person</li>
                  <li>We do not guarantee perfect representation</li>
                  <li>Results depend on image quality and AI processing</li>
                </ul>
              </div>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">7.2 Service Availability</h3>
              <p className="text-gray-700">
                We strive to provide reliable service but do not guarantee:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Uninterrupted or error-free operation</li>
                <li>Specific processing times</li>
                <li>Compatibility with all devices or browsers</li>
                <li>Availability in all geographic locations</li>
              </ul>
            </section>

            {/* Liability Limitation */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Limitation of Liability</h2>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-gray-700 mb-2">
                  <strong>IMPORTANT LEGAL NOTICE:</strong>
                </p>
                <p className="text-gray-700 text-sm mb-2">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, VISUTRY SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, 
                  SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES.
                </p>
                <p className="text-gray-700 text-sm">
                  OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID TO US IN THE 12 MONTHS PRECEDING THE CLAIM.
                </p>
              </div>
            </section>

            {/* Indemnification */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Indemnification</h2>
              <p className="text-gray-700">
                You agree to indemnify and hold harmless VisuTry from any claims, damages, losses, or expenses 
                (including legal fees) arising from:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Your use of the Service</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of any third-party rights</li>
                <li>Content you upload to the Service</li>
              </ul>
            </section>

            {/* Termination */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Termination</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">10.1 By You</h3>
              <p className="text-gray-700 mb-4">
                You may terminate your account at any time by contacting us or using the account deletion feature.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">10.2 By Us</h3>
              <p className="text-gray-700 mb-4">
                We may suspend or terminate your account if:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>You violate these Terms</li>
                <li>You engage in fraudulent activity</li>
                <li>Your account is inactive for an extended period</li>
                <li>Required by law or legal process</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">10.3 Effect of Termination</h3>
              <p className="text-gray-700">
                Upon termination, your right to use the Service will immediately cease. We may delete your data in 
                accordance with our data retention policies.
              </p>
            </section>

            {/* Dispute Resolution */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Dispute Resolution</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">11.1 Informal Resolution</h3>
              <p className="text-gray-700 mb-4">
                Before filing a claim, please contact us at{' '}
                <a href="mailto:legal@visutry.com" className="text-blue-600 hover:underline">
                  legal@visutry.com
                </a>
                {' '}to attempt to resolve the dispute informally.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">11.2 Governing Law</h3>
              <p className="text-gray-700">
                These Terms shall be governed by and construed in accordance with the laws of the jurisdiction where 
                VisuTry is registered, without regard to conflict of law principles.
              </p>
            </section>

            {/* Changes to Terms */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Changes to Terms</h2>
              <p className="text-gray-700">
                We may update these Terms from time to time. We will notify you of material changes by:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Posting the new Terms on our website</li>
                <li>Updating the &quot;Last updated&quot; date</li>
                <li>Sending you an email notification (for significant changes)</li>
              </ul>
              <p className="text-gray-700">
                Your continued use of the Service after changes become effective constitutes acceptance of the new Terms.
              </p>
            </section>

            {/* Contact */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Contact Information</h2>
              <p className="text-gray-700 mb-4">
                If you have questions about these Terms, please contact us:
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-gray-700">
                  <strong>Legal Inquiries:</strong>{' '}
                  <a href="mailto:legal@visutry.com" className="text-blue-600 hover:underline">
                    legal@visutry.com
                  </a>
                </p>
                <p className="text-gray-700 mt-2">
                  <strong>General Support:</strong>{' '}
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

