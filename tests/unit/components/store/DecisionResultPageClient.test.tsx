import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { DecisionResultPageClient } from '@/components/store/DecisionResultPageClient'
import type { DecisionResultView } from '@/modules/store/application/decision-result-service'
import type { DecisionJourneyStage } from '@/modules/store/domain/decision-journey'

/* eslint-disable @next/next/no-img-element */
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ fill: _fill, unoptimized: _unoptimized, sizes: _sizes, alt = '', ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean; unoptimized?: boolean; sizes?: string }) => <img alt={alt} {...props} />,
}))

jest.mock('lucide-react', () => {
  const Icon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />
  return {
    ArrowUpRight: Icon,
    CheckCircle2: Icon,
    Copy: Icon,
    Glasses: Icon,
    Heart: Icon,
    ShieldCheck: Icon,
  }
})

jest.mock('@/components/store/DecisionResultQr', () => ({
  DecisionResultQr: () => <div aria-label="Decision Result QR" />,
}))

jest.mock('@/components/store/MerchantHandoffLink', () => ({
  MerchantHandoffLink: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

const legalJourneyPolicies: DecisionJourneyStage[][] = [
  ['FACE_ANALYSIS', 'RECOMMENDATION'],
  ['FACE_ANALYSIS', 'FIT_PROFILE', 'RECOMMENDATION'],
  ['FACE_ANALYSIS', 'RECOMMENDATION', 'TRY_ON'],
  ['FACE_ANALYSIS', 'FIT_PROFILE', 'RECOMMENDATION', 'TRY_ON'],
  ['FACE_ANALYSIS', 'RECOMMENDATION', 'TRY_ON', 'COMPARE'],
  ['FACE_ANALYSIS', 'FIT_PROFILE', 'RECOMMENDATION', 'TRY_ON', 'COMPARE'],
]

const baseResult: DecisionResultView = {
  expiresAt: '2026-10-10T00:00:00.000Z',
  merchant: { name: 'VisuTry Demo Optical', slug: 'visutry-demo-optical', logoUrl: 'https://cdn.example.test/visutry-logo.png', accentColor: '#1769e0', websiteUrl: null, referenceData: true },
  experience: null,
  journey: { experienceId: 'experience-a', experienceType: 'STORE', experienceSlug: 'spring-edit', enabledStages: legalJourneyPolicies[5] },
  faceFit: { faceShape: 'oval', alternativeShapes: [], preferredWidthClass: 'medium', geometryQualityBand: 'good', qualityScore: 90, signalCount: 4 },
  recommendation: {
    rankingVersion: 'store-rank-v2',
    frames: [
      { frameId: 'rowan', sku: 'VT-ROWAN-INTERNAL', name: 'VT Rowan', imageUrl: 'https://cdn.example.test/rowan.png', productUrl: 'https://shop.example.test/rowan', score: 94, reason: 'A balanced round silhouette.' },
      { frameId: 'lane', sku: 'VT-LANE-INTERNAL', name: 'VT Lane', imageUrl: 'https://cdn.example.test/lane.png', productUrl: null, score: 82, reason: 'A clean rectangular alternative.' },
    ],
  },
  selectedFrameIds: ['rowan', 'lane'],
  favoriteFrameIds: ['rowan'],
  compare: { startedAt: '2026-10-09T10:00:00.000Z', frameIds: ['rowan', 'lane'] },
  compareFrames: [
    { frameId: 'rowan', name: 'VT Rowan', imageUrl: 'https://cdn.example.test/rowan.png', productUrl: 'https://shop.example.test/rowan' },
    { frameId: 'lane', name: 'VT Lane', imageUrl: 'https://cdn.example.test/lane.png', productUrl: null },
  ],
  tryOnResults: [{ assetRef: 'asset-rowan', source: 'LIVE_TRYON', disclosure: null, frameId: 'rowan', name: 'VT Rowan', sku: 'VT-ROWAN-INTERNAL', productUrl: 'https://shop.example.test/rowan', imageUrl: '/api/store/results/token/try-on/asset-rowan', completedAt: '2026-10-09T10:00:00.000Z' }],
}

describe('DecisionResultPageClient journey and shopper presentation', () => {
  it.each(legalJourneyPolicies.flatMap((stages) => (['STORE', 'CAMPAIGN'] as const).map((experienceType) => ({ stages, experienceType }))))(
    'renders only effective, completed optional stages for $experienceType: $stages',
    ({ stages, experienceType }) => {
      const result: DecisionResultView = {
        ...baseResult,
        journey: { ...baseResult.journey, experienceType, enabledStages: stages },
        tryOnResults: stages.includes('TRY_ON') ? baseResult.tryOnResults : [],
        compare: stages.includes('COMPARE') ? baseResult.compare : null,
      }

      render(<DecisionResultPageClient locale="en" token="opaque-result-token" result={result} />)

      expect(screen.getByRole('img', { name: 'VisuTry Demo Optical logo' })).toHaveAttribute('src', 'https://cdn.example.test/visutry-logo.png')
      expect(screen.getByRole('heading', { level: 1, name: experienceType === 'CAMPAIGN' ? 'Your campaign shortlist' : 'Your eyewear shortlist' })).toBeInTheDocument()
      expect(screen.queryByText('store-rank-v2')).not.toBeInTheDocument()
      expect(screen.queryByText('VT-ROWAN-INTERNAL')).not.toBeInTheDocument()
      expect(screen.queryByText('94')).not.toBeInTheDocument()
      expect(screen.queryByText(/canonical result|Merchant Experience journey|session storage/i)).not.toBeInTheDocument()
      expect(Boolean(screen.queryByRole('heading', { name: 'A lightweight style guide' }))).toBe(stages.includes('FIT_PROFILE'))
      expect(Boolean(screen.queryByRole('heading', { name: 'Completed looks' }))).toBe(stages.includes('TRY_ON'))
      expect(Boolean(screen.queryByRole('heading', { name: 'Frames you compared' }))).toBe(stages.includes('COMPARE'))
    },
  )

  it('does not imply pending Try-On or Compare when no completed outcome exists', () => {
    const result: DecisionResultView = {
      ...baseResult,
      journey: { ...baseResult.journey, enabledStages: legalJourneyPolicies[5] },
      tryOnResults: [],
      compare: null,
    }
    render(<DecisionResultPageClient locale="en" token="opaque-result-token" result={result} />)

    expect(screen.queryByText(/looks will appear|waiting|pending/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Completed looks' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Frames you compared' })).not.toBeInTheDocument()
  })

  it('shows the actual compared frames with product imagery and supported links', () => {
    render(<DecisionResultPageClient locale="en" token="opaque-result-token" result={baseResult} />)
    const compare = screen.getByRole('region', { name: 'Frames you compared' })
    expect(compare).toHaveTextContent('VT Rowan')
    expect(compare).toHaveTextContent('VT Lane')
    expect(compare.querySelector('a[href="https://shop.example.test/rowan"]')).toHaveTextContent('View product')
    expect(compare.querySelectorAll('img[alt$="product thumbnail"]')).toHaveLength(2)
  })

  it('shows one concise fit unavailable message instead of empty metric placeholders', () => {
    const result: DecisionResultView = {
      ...baseResult,
      faceFit: { faceShape: null, alternativeShapes: [], preferredWidthClass: null, geometryQualityBand: null, qualityScore: null, signalCount: 0 },
    }
    render(<DecisionResultPageClient locale="en" token="opaque-result-token" result={result} />)
    expect(screen.getByText('Fit insights were not available for this photo. You can still explore the frames below.')).toBeInTheDocument()
    expect(screen.queryByText('Face shape')).not.toBeInTheDocument()
    expect(screen.queryByText('Frame width')).not.toBeInTheDocument()
    expect(screen.queryByText('Analysis quality')).not.toBeInTheDocument()
  })

  it('omits recommendation content when the effective Journey excludes Recommendation', () => {
    const result: DecisionResultView = {
      ...baseResult,
      journey: { ...baseResult.journey, enabledStages: ['FACE_ANALYSIS'] },
    }
    render(<DecisionResultPageClient locale="en" token="opaque-result-token" result={result} />)

    expect(screen.queryByRole('heading', { name: 'Your curated shortlist' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Your result is not available' })).not.toBeInTheDocument()
  })

  it('keeps mobile sharing primary and reserves QR continuation for desktop or Kiosk', () => {
    const { rerender } = render(<DecisionResultPageClient locale="en" token="opaque-result-token" result={baseResult} />)
    expect(screen.getByRole('button', { name: 'Copy link' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Share' })).toBeInTheDocument()
    expect(screen.queryByText(/continue on your phone|scan this result/i)).not.toBeInTheDocument()
    expect(screen.getByTestId('result-qr-continuation').className).toContain('hidden')

    rerender(<DecisionResultPageClient locale="en" token="opaque-result-token" result={baseResult} kioskMode />)
    expect(screen.getByText('Continue on your phone')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'New shopper' })).toBeInTheDocument()
    expect(screen.getByTestId('result-qr-continuation').className).not.toContain('hidden')
  })

  it('keeps an archived Campaign Result private while permitting Kiosk-only clearing', async () => {
    const result: DecisionResultView = {
      ...baseResult,
      experience: {
        type: 'CAMPAIGN', status: 'ARCHIVED', slug: 'spring-edit', name: 'Spring edit',
        primaryCta: { action: 'CUSTOM_LINK', label: 'Shop now', url: 'https://shop.example.test' },
        secondaryCta: null,
        deliveryPolicy: { kioskEnabled: true, kioskIdleTimeoutSeconds: 1 },
      },
      journey: { ...baseResult.journey, experienceType: 'CAMPAIGN' },
    }
    const originalFetch = Object.getOwnPropertyDescriptor(global, 'fetch')
    const fetchSpy = jest.fn().mockResolvedValue({ ok: false })
    Object.defineProperty(global, 'fetch', { configurable: true, writable: true, value: fetchSpy })
    try {
      render(<DecisionResultPageClient locale="en" token="opaque-result-token" result={result} kioskMode hasActivePublicStore archivedCampaignCopy={{ title: 'Campaign ended', body: 'This campaign has ended.', storeLink: 'Visit the current Store' }} />)

      expect(screen.getByText(/This campaign has ended/)).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Visit the current Store' })).toHaveAttribute('href', '/en/store/visutry-demo-optical')
      expect(screen.getByRole('heading', { name: 'Your curated shortlist' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Completed looks' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Frames you compared' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Copy link' })).toBeInTheDocument()
      expect(screen.getByTestId('result-qr-continuation').className).not.toContain('hidden')
      expect(screen.getByRole('button', { name: 'Clear this shopper' })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'New shopper' })).not.toBeInTheDocument()
      expect(screen.queryByText('Shop frame')).not.toBeInTheDocument()
      expect(screen.queryByText('View product')).not.toBeInTheDocument()
      expect(screen.queryByText('Next step')).not.toBeInTheDocument()

      sessionStorage.setItem('vt_store_session:visutry-demo-optical:spring-edit', 'private shopper state')
      fireEvent.click(screen.getByRole('button', { name: 'Clear this shopper' }))
      await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Kiosk privacy reset pending'))
      expect(fetchSpy).toHaveBeenCalledWith('/api/store/results/opaque-result-token/kiosk-reset', { method: 'POST', cache: 'no-store' })
      expect(sessionStorage.getItem('vt_store_session:visutry-demo-optical:spring-edit')).toBeNull()
      expect(screen.queryByRole('heading', { name: 'Your curated shortlist' })).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Retry secure clear' })).toBeInTheDocument()
    } finally {
      if (originalFetch) Object.defineProperty(global, 'fetch', originalFetch)
      else delete (global as { fetch?: typeof fetch }).fetch
    }
  })

  it('does not offer a dead Store link or Kiosk reset controls on the phone-only archived Result', () => {
    const result: DecisionResultView = {
      ...baseResult,
      experience: {
        type: 'CAMPAIGN', status: 'ARCHIVED', slug: 'spring-edit', name: 'Spring edit',
        primaryCta: null, secondaryCta: null,
        deliveryPolicy: { kioskEnabled: true, kioskIdleTimeoutSeconds: 120 },
      },
      journey: { ...baseResult.journey, experienceType: 'CAMPAIGN' },
    }
    render(<DecisionResultPageClient locale="en" token="opaque-result-token" result={result} />)
    expect(screen.getByText(/Campaign ended/)).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Visit the current Store' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Clear this shopper' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Your curated shortlist' })).toBeInTheDocument()
  })

  it('arms idle privacy cleanup for an archived Kiosk Result', async () => {
    const result: DecisionResultView = {
      ...baseResult,
      experience: {
        type: 'CAMPAIGN', status: 'ARCHIVED', slug: 'spring-edit', name: 'Spring edit',
        primaryCta: null, secondaryCta: null,
        deliveryPolicy: { kioskEnabled: true, kioskIdleTimeoutSeconds: 1 },
      },
      journey: { ...baseResult.journey, experienceType: 'CAMPAIGN' },
    }
    const originalFetch = Object.getOwnPropertyDescriptor(global, 'fetch')
    const fetchSpy = jest.fn().mockImplementation(() => new Promise(() => undefined))
    Object.defineProperty(global, 'fetch', { configurable: true, writable: true, value: fetchSpy })
    jest.useFakeTimers()
    try {
      render(<DecisionResultPageClient locale="en" token="opaque-result-token" result={result} kioskMode />)
      await act(async () => { jest.advanceTimersByTime(1_000) })
      expect(fetchSpy).toHaveBeenCalledTimes(1)
      expect(screen.getByRole('status')).toHaveTextContent('Private shopper content is hidden')
      expect(screen.queryByRole('heading', { name: 'Your curated shortlist' })).not.toBeInTheDocument()
    } finally {
      jest.useRealTimers()
      if (originalFetch) Object.defineProperty(global, 'fetch', originalFetch)
      else delete (global as { fetch?: typeof fetch }).fetch
    }
  })

  it('replaces timestamp-like QA experience names with a friendly title and keeps a compact disclosure', () => {
    const result: DecisionResultView = {
      ...baseResult,
      experience: { type: 'STORE', status: 'ACTIVE', slug: 'test', name: 'Local QA Store 2026-10-09T11:42:00.000Z', primaryCta: null, secondaryCta: null, deliveryPolicy: { kioskEnabled: true, kioskIdleTimeoutSeconds: 120 } },
    }
    render(<DecisionResultPageClient locale="en" token="opaque-result-token" result={result} />)

    expect(screen.getByRole('heading', { level: 1, name: 'Your eyewear shortlist' })).toBeInTheDocument()
    expect(screen.queryByText(/Local QA Store 2026/)).not.toBeInTheDocument()
    expect(screen.getByText(/Reference demonstration/)).toBeInTheDocument()
  })

  it('does not render a 1x1 QA fixture as a shopper Try-On image', () => {
    const result: DecisionResultView = {
      ...baseResult,
      tryOnResults: [{ ...baseResult.tryOnResults[0], disclosure: 'LOCAL_QA_FIXTURE' }],
    }
    render(<DecisionResultPageClient locale="en" token="opaque-result-token" result={result} />)

    expect(screen.getByRole('img', { name: 'Local QA fixture image intentionally omitted' })).toBeInTheDocument()
    expect(screen.getByText('Test asset · not a shopper Try-On image')).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: 'VT Rowan' })).not.toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Local QA fixture image intentionally omitted' }).closest('figure')?.querySelector('[class*="aspect-"]')).toBeNull()
  })
})
