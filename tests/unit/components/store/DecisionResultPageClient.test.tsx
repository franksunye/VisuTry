import { fireEvent, render, screen } from '@testing-library/react'
import { DecisionResultPageClient } from '@/components/store/DecisionResultPageClient'
import type { DecisionResultView } from '@/modules/store/application/decision-result-service'

/* eslint-disable @next/next/no-img-element */
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ fill: _fill, unoptimized: _unoptimized, sizes: _sizes, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean; unoptimized?: boolean; sizes?: string }) => <img {...props} />,
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

const result: DecisionResultView = {
  expiresAt: '2026-10-02T00:00:00.000Z',
  merchant: { name: 'VisuTry Demo Optical', slug: 'visutry-demo-optical', accentColor: null, websiteUrl: null },
  experience: null,
  journey: { experienceId: null, experienceType: 'STORE', experienceSlug: null, enabledStages: [] },
  faceFit: null,
  recommendation: {
    rankingVersion: 'store-rank-v1',
    frames: [
      { frameId: 'rowan', sku: 'VT-ROWAN', name: 'VT Rowan', imageUrl: 'https://cdn.example.test/rowan.png', productUrl: null, score: 94, reason: 'A balanced round silhouette.' },
      { frameId: 'lane', sku: 'VT-LANE', name: 'VT Lane', imageUrl: null, productUrl: null, score: 82, reason: 'A clean rectangular alternative.' },
    ],
  },
  selectedFrameIds: ['rowan', 'lane'],
  favoriteFrameIds: [],
  compare: null,
  tryOnResults: [],
}

describe('DecisionResultPageClient recommendation thumbnails', () => {
  it('shows available product images and a quiet fixed-size fallback without changing shortlist order or details', () => {
    const { container } = render(<DecisionResultPageClient locale="en" token="opaque-result-token" result={result} />)

    const rowanImage = screen.getByRole('img', { name: 'VT Rowan product thumbnail' })
    expect(rowanImage).toHaveAttribute('src', 'https://cdn.example.test/rowan.png')
    expect(screen.getByRole('img', { name: 'VT Lane image unavailable' })).toBeInTheDocument()

    expect(screen.getByText('VT-ROWAN')).toBeInTheDocument()
    expect(screen.getByText('A balanced round silhouette.')).toBeInTheDocument()
    expect(screen.getByText('94')).toBeInTheDocument()
    expect(screen.getByText('82')).toBeInTheDocument()

    const rowanCard = screen.getByText('VT Rowan').closest('.rounded-2xl')
    const laneCard = screen.getByText('VT Lane').closest('.rounded-2xl')
    expect(Boolean(rowanCard && laneCard && (rowanCard.compareDocumentPosition(laneCard) & Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true)

    fireEvent.error(rowanImage)
    expect(screen.getByRole('img', { name: 'VT Rowan image unavailable' })).toBeInTheDocument()
    expect(container.querySelectorAll('[aria-label$="image unavailable"]')).toHaveLength(2)
  })
})
