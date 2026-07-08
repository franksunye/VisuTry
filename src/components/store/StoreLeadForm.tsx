'use client'

import { FormEvent, useMemo, useState } from 'react'
import { ArrowRight, Mail } from 'lucide-react'
import { analytics } from '@/lib/analytics'

interface StoreLeadFormProps {
  locale: string
}

const businessTypes = [
  'Independent optical store',
  'Eyewear ecommerce brand',
  'Frame stylist / consultant',
  'Boutique ecommerce agency',
  'Social seller',
  'Other',
]

const intentOptions = [
  'Get a sample Store Link',
  'Join the pilot',
  'Book a demo',
  'Discuss agency partnership',
]

export function StoreLeadForm({ locale }: StoreLeadFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [businessType, setBusinessType] = useState(businessTypes[0])
  const [website, setWebsite] = useState('')
  const [frameCount, setFrameCount] = useState('8-20')
  const [intent, setIntent] = useState(intentOptions[0])
  const [notes, setNotes] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const mailtoHref = useMemo(() => {
    const subject = `VisuTry Store pilot inquiry - ${businessName || name || 'New lead'}`
    const body = [
      'Hi VisuTry team,',
      '',
      'I am interested in VisuTry Store.',
      '',
      `Name: ${name}`,
      `Email: ${email}`,
      `Business name: ${businessName}`,
      `Business type: ${businessType}`,
      `Website / Instagram / store link: ${website}`,
      `Approximate number of frames: ${frameCount}`,
      `Requested action: ${intent}`,
      '',
      `Notes: ${notes}`,
      '',
      `Locale: ${locale}`,
    ].join('\n')

    return `mailto:hello@visutry.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }, [businessName, businessType, email, frameCount, intent, locale, name, notes, website])

  function handleFocus() {
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

    if (intent === 'Get a sample Store Link') {
      analytics.trackCustomEvent('store_sample_link_requested', {
        source: 'store_landing',
        locale,
        business_type: businessType,
      })
    }

    if (intent === 'Join the pilot') {
      analytics.trackCustomEvent('store_pilot_requested', {
        source: 'store_landing',
        locale,
        business_type: businessType,
      })
    }

    if (intent === 'Book a demo') {
      analytics.trackCustomEvent('store_demo_requested', {
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
          Pilot interest
        </div>
        <h2 className="text-2xl font-bold text-gray-950">Get a sample Store Link</h2>
        <p className="mt-2 text-sm leading-6 text-gray-600">
          Tell us about your frames. We will use this to understand whether VisuTry Store is useful for your sales workflow.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-gray-800">Name</span>
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            placeholder="Your name"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-gray-800">Email</span>
          <input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            placeholder="you@company.com"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-gray-800">Business name</span>
          <input
            required
            value={businessName}
            onChange={(event) => setBusinessName(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            placeholder="Store or brand name"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-gray-800">Business type</span>
          <select
            value={businessType}
            onChange={(event) => setBusinessType(event.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          >
            {businessTypes.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>

        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-semibold text-gray-800">Website, Instagram, or store link</span>
          <input
            value={website}
            onChange={(event) => setWebsite(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            placeholder="https://..."
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-gray-800">Approximate frame count</span>
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
          <span className="mb-1 block text-sm font-semibold text-gray-800">What would you like?</span>
          <select
            value={intent}
            onChange={(event) => setIntent(event.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          >
            {intentOptions.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>

        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-semibold text-gray-800">Notes</span>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            placeholder="Tell us what you sell, where your shoppers come from, or what you want to test."
          />
        </label>
      </div>

      <button
        type="submit"
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 sm:w-auto"
      >
        Send pilot inquiry
        <ArrowRight className="h-4 w-4" />
      </button>

      {submitted && (
        <p className="mt-3 text-sm leading-6 text-green-700">
          Opening your email client with the inquiry details. If it does not open, email hello@visutry.com with your store information.
        </p>
      )}

      <p className="mt-4 text-xs leading-5 text-gray-500">
        v0 uses email-based lead capture for validation. We will move to a database or CRM workflow after the pilot process is confirmed.
      </p>
    </form>
  )
}
