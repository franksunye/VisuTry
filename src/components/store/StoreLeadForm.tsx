'use client'

import { FormEvent, useMemo, useRef, useState } from 'react'
import { ArrowRight, Mail } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { analytics } from '@/lib/analytics'

interface StoreLeadFormProps {
  locale: string
}

export function StoreLeadForm({ locale }: StoreLeadFormProps) {
  const t = useTranslations('marketing.store')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [businessType, setBusinessType] = useState('opticalStore')
  const [website, setWebsite] = useState('')
  const [frameCount, setFrameCount] = useState('8-20')
  const [intent, setIntent] = useState('sample')
  const [notes, setNotes] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const hasTrackedFormStart = useRef(false)

  const businessTypeKeys = ['opticalStore', 'ecommerce', 'stylist', 'agency', 'socialSeller', 'other'] as const
  const intentKeys = ['sample', 'demo', 'catalog', 'partnership'] as const

  const mailtoHref = useMemo(() => {
    const businessTypeLabel = t(`formBusinessTypes.${businessType}`)
    const intentLabel = t(`formIntents.${intent}`)
    const subject = `VisuTry Store request - ${businessName || name || 'New lead'}`
    const body = [
      'Hi VisuTry team,',
      '',
      'I would like to see how VisuTry Store could work for my eyewear business.',
      '',
      `Name: ${name}`,
      `Email: ${email}`,
      `Business name: ${businessName}`,
      `Business type: ${businessTypeLabel}`,
      `Website / Instagram / store link: ${website}`,
      `Approximate number of frames: ${frameCount}`,
      `Requested action: ${intentLabel}`,
      '',
      `Notes: ${notes}`,
      '',
      `Locale: ${locale}`,
    ].join('\n')

    return `mailto:support@visutry.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }, [businessName, businessType, email, frameCount, intent, locale, name, notes, t, website])

  function handleFocus() {
    if (hasTrackedFormStart.current) return
    hasTrackedFormStart.current = true

    analytics.trackCustomEvent('store_lead_form_started', {
      source: 'store_landing',
      locale,
    })
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    analytics.trackCustomEvent('store_lead_submitted', {
      source: 'store_landing',
      locale,
      business_type: businessType,
      intent,
      frame_count: frameCount,
    })

    if (intent === 'sample') {
      analytics.trackCustomEvent('store_sample_link_requested', {
        source: 'store_landing',
        locale,
        business_type: businessType,
      })
    }

    if (intent === 'demo') {
      analytics.trackCustomEvent('store_demo_requested', {
        source: 'store_landing',
        locale,
        business_type: businessType,
      })
    }

    if (intent === 'catalog') {
      analytics.trackCustomEvent('store_pilot_requested', {
        source: 'store_landing',
        locale,
        business_type: businessType,
      })
    }

    setSubmitted(true)
    window.location.href = mailtoHref
  }

  return (
    <form onSubmit={handleSubmit} onFocus={handleFocus} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm md:p-6">
      <div className="mb-5">
        <div className="mb-2 inline-flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
          <Mail className="h-4 w-4" />
          {t('formBadge')}
        </div>
        <h2 className="text-2xl font-bold text-gray-950">{t('formHeading')}</h2>
        <p className="mt-2 text-sm leading-6 text-gray-600">
          {t('formSubheading')}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-gray-800">{t('formLabels.name')}</span>
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            placeholder={t('formLabels.namePlaceholder')}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-gray-800">{t('formLabels.email')}</span>
          <input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            placeholder={t('formLabels.emailPlaceholder')}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-gray-800">{t('formLabels.businessName')}</span>
          <input
            required
            value={businessName}
            onChange={(event) => setBusinessName(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            placeholder={t('formLabels.businessNamePlaceholder')}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-gray-800">{t('formLabels.businessType')}</span>
          <select
            value={businessType}
            onChange={(event) => setBusinessType(event.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          >
            {businessTypeKeys.map((key) => (
              <option key={key} value={key}>{t(`formBusinessTypes.${key}`)}</option>
            ))}
          </select>
        </label>

        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-semibold text-gray-800">{t('formLabels.website')}</span>
          <input
            value={website}
            onChange={(event) => setWebsite(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            placeholder={t('formLabels.websitePlaceholder')}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-gray-800">{t('formLabels.frameCount')}</span>
          <select
            value={frameCount}
            onChange={(event) => setFrameCount(event.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          >
            <option>8-20</option>
            <option>21-50</option>
            <option>51-200</option>
            <option>200+</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-gray-800">{t('formLabels.intent')}</span>
          <select
            value={intent}
            onChange={(event) => setIntent(event.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          >
            {intentKeys.map((key) => (
              <option key={key} value={key}>{t(`formIntents.${key}`)}</option>
            ))}
          </select>
        </label>

        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-semibold text-gray-800">{t('formLabels.notes')}</span>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            placeholder={t('formLabels.notesPlaceholder')}
          />
        </label>
      </div>

      <button
        type="submit"
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 sm:w-auto"
      >
        {t('formSubmit')}
        <ArrowRight className="h-4 w-4" />
      </button>

      {submitted && (
        <p className="mt-3 text-sm leading-6 text-green-700">
          {t('formSuccessMessage')}
        </p>
      )}

      <p className="mt-4 text-xs leading-5 text-gray-500">
        {t('formDisclaimer')}
      </p>
    </form>
  )
}
