import { Metadata } from 'next'
import { generateSEO } from '@/lib/seo'
import Link from 'next/link'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

export const metadata: Metadata = generateSEO({
  title: 'Refund Policy | VisuTry',
  description: 'Learn about VisuTry refund policy, cancellation terms, and how to request a refund for our AI glasses try-on service.',
  url: '/refund',
})

export default async function RefundPage() {
  const t = await getTranslations('legal.refund')
  const lastUpdated = 'January 15, 2025'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
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
            <RefreshCw className="w-10 h-10 text-blue-600 mr-3" />
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
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Overview</h2>
              <p className="text-gray-700 mb-4">
                At VisuTry, we strive to provide the best AI-powered virtual glasses try-on experience. This Refund 
                Policy outlines the terms and conditions for refunds and cancellations of our services.
              </p>
              <p className="text-gray-700">
                Please read this policy carefully before making a purchase. By purchasing our services, you agree to 
                the terms outlined in this Refund Policy.
              </p>
            </section>

            {/* Subscription Refunds */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Subscription Refunds</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">2.1 Monthly Subscriptions</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-gray-700 mb-2">
                  <strong>7-Day Money-Back Guarantee:</strong> If you are not satisfied with your monthly subscription, 
                  you may request a full refund within 7 days of your initial purchase.
                </p>
                <p className="text-gray-700 text-sm">
                  Note: This guarantee applies only to your first monthly subscription purchase. Renewal charges are 
                  non-refundable.
                </p>
              </div>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">2.2 Annual Subscriptions</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-gray-700 mb-2">
                  <strong>14-Day Money-Back Guarantee:</strong> If you are not satisfied with your annual subscription, 
                  you may request a full refund within 14 days of your initial purchase.
                </p>
                <p className="text-gray-700 text-sm">
                  Note: This guarantee applies only to your first annual subscription purchase. Renewal charges are 
                  non-refundable.
                </p>
              </div>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">2.3 Refund Conditions</h3>
              <p className="text-gray-700 mb-4">
                To be eligible for a subscription refund:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>The refund request must be made within the guarantee period</li>
                <li>You must provide a valid reason for the refund request</li>
                <li>The subscription must not have been excessively used (more than 50% of quota)</li>
                <li>No previous refunds have been issued for your account</li>
              </ul>
            </section>

            {/* Credits Pack Refunds */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Credits Pack Refunds</h2>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-gray-700 mb-2">
                  <strong>Unused Credits:</strong> Credits packs are refundable within 7 days of purchase if no credits 
                  have been used.
                </p>
                <p className="text-gray-700 text-sm">
                  Once you start using credits from a pack, the purchase becomes non-refundable.
                </p>
              </div>

              <p className="text-gray-700 mb-4">
                Refund eligibility for credits packs:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li><strong>100% Refund:</strong> If no credits have been used within 7 days</li>
                <li><strong>No Refund:</strong> If any credits have been used</li>
                <li><strong>No Refund:</strong> After 7 days from purchase date</li>
              </ul>
            </section>

            {/* Non-Refundable Items */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Non-Refundable Items</h2>
              <p className="text-gray-700 mb-4">
                The following are not eligible for refunds:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Subscription renewals (automatic or manual)</li>
                <li>Used credits or try-on services</li>
                <li>Purchases made more than 7-14 days ago (depending on plan type)</li>
                <li>Accounts that have violated our Terms of Service</li>
                <li>Promotional or discounted purchases (unless required by law)</li>
                <li>Services already rendered or consumed</li>
              </ul>
            </section>

            {/* Cancellation Policy */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Subscription Cancellation</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">5.1 How to Cancel</h3>
              <p className="text-gray-700 mb-4">
                You can cancel your subscription at any time through your account dashboard:
              </p>
              <ol className="list-decimal list-inside text-gray-700 mb-4 space-y-2">
                <li>Log in to your VisuTry account</li>
                <li>Go to Dashboard → Subscription Settings</li>
                <li>Click &quot;Cancel Subscription&quot;</li>
                <li>Confirm your cancellation</li>
              </ol>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">5.2 After Cancellation</h3>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-gray-700 mb-2">
                  <strong>Access Until Period End:</strong> When you cancel your subscription, you will continue to 
                  have access to premium features until the end of your current billing period.
                </p>
                <p className="text-gray-700 text-sm">
                  No refunds will be issued for the remaining time in your billing period.
                </p>
              </div>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">5.3 Reactivation</h3>
              <p className="text-gray-700">
                You can reactivate your subscription at any time. If you reactivate within the same billing period, 
                you will not be charged again until the next billing cycle.
              </p>
            </section>

            {/* Refund Process */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. How to Request a Refund</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">6.1 Refund Request Steps</h3>
              <ol className="list-decimal list-inside text-gray-700 mb-4 space-y-2">
                <li>Contact our support team at{' '}
                  <a href="mailto:refunds@visutry.com" className="text-blue-600 hover:underline">
                    refunds@visutry.com
                  </a>
                </li>
                <li>Include your account email and order/transaction ID</li>
                <li>Provide a brief explanation for your refund request</li>
                <li>Wait for our team to review your request (typically 2-3 business days)</li>
              </ol>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">6.2 Refund Processing Time</h3>
              <p className="text-gray-700 mb-4">
                Once your refund is approved:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li><strong>Credit/Debit Cards:</strong> 5-10 business days</li>
                <li><strong>PayPal:</strong> 3-5 business days</li>
                <li><strong>Other Payment Methods:</strong> Up to 14 business days</li>
              </ul>
              <p className="text-gray-700 text-sm">
                Note: Processing times may vary depending on your bank or payment provider.
              </p>
            </section>

            {/* Special Circumstances */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Special Circumstances</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">7.1 Technical Issues</h3>
              <p className="text-gray-700 mb-4">
                If you experience technical issues that prevent you from using our service:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Contact our support team immediately</li>
                <li>We will work to resolve the issue within 48 hours</li>
                <li>If we cannot resolve the issue, you may be eligible for a refund or credit</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">7.2 Service Interruptions</h3>
              <p className="text-gray-700">
                In case of extended service interruptions (more than 24 hours), we may offer:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Extension of your subscription period</li>
                <li>Additional credits as compensation</li>
                <li>Partial refund for the affected period</li>
              </ul>
            </section>

            {/* Chargebacks */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Chargebacks and Disputes</h2>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-gray-700 mb-2">
                  <strong>Important:</strong> Please contact us before initiating a chargeback with your bank or 
                  payment provider.
                </p>
                <p className="text-gray-700 text-sm">
                  Chargebacks may result in immediate account suspension and may affect your ability to use our 
                  service in the future.
                </p>
              </div>
              <p className="text-gray-700">
                We are committed to resolving any billing disputes fairly and promptly. Most issues can be resolved 
                through direct communication with our support team.
              </p>
            </section>

            {/* Changes to Policy */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Changes to This Policy</h2>
              <p className="text-gray-700">
                We reserve the right to modify this Refund Policy at any time. Changes will be effective immediately 
                upon posting to our website. Your continued use of our service after any changes constitutes acceptance 
                of the new policy.
              </p>
            </section>

            {/* Contact */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Contact Us</h2>
              <p className="text-gray-700 mb-4">
                If you have any questions about our Refund Policy or need assistance with a refund request:
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-gray-700">
                  <strong>Refund Requests:</strong>{' '}
                  <a href="mailto:refunds@visutry.com" className="text-blue-600 hover:underline">
                    refunds@visutry.com
                  </a>
                </p>
                <p className="text-gray-700 mt-2">
                  <strong>General Support:</strong>{' '}
                  <a href="mailto:support@visutry.com" className="text-blue-600 hover:underline">
                    support@visutry.com
                  </a>
                </p>
                <p className="text-gray-700 mt-2 text-sm">
                  Response time: Within 24-48 hours (business days)
                </p>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  )
}

