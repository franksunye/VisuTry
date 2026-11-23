import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import CanaryFramePage, { generateMetadata } from '@/app/[locale]/(public)/discover/frames/[frameId]/page'
import { getCanaryDiscoveryFrame } from '@/modules/store/application/get-canary-discovery-frames'
import { buildCanaryDiscoveryFrames } from '@/modules/store/application/canary-discovery-frames'
import { makeCanaryEditorialDiscovery } from '../../fixtures/merchant-discovery-editorial'

jest.mock('@/modules/store/application/get-canary-discovery-frames', () => ({ getCanaryDiscoveryFrame: jest.fn() }))
jest.mock('next-intl/server', () => ({ setRequestLocale: jest.fn() }))
jest.mock('next/navigation', () => ({ notFound: () => { throw new Error('NOT_FOUND') } }))
jest.mock('@/components/layout/PublicLink', () => ({ __esModule: true, default: ({ children, ...props }: { children: ReactNode; href: string }) => <a {...props}>{children}</a> }))
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ fill: _fill, priority: _priority, sizes: _sizes, unoptimized: _unoptimized, ...props }: Record<string, unknown>) => <img {...props} />,
}))

const readFrame = jest.mocked(getCanaryDiscoveryFrame)

function admittedFrame() {
  const store = makeCanaryEditorialDiscovery()
  store.experience.type = 'STORE'
  store.experience.slug = 'store'
  return buildCanaryDiscoveryFrames({ store, campaign: makeCanaryEditorialDiscovery() }).find((frame) => frame.id === 'canary-round')!
}

describe('first-party Canary frame detail route', () => {
  beforeEach(() => jest.clearAllMocks())

  it('server-renders the real frame and independent canonical without a sale or physical-fit claim', async () => {
    const frame = admittedFrame()
    readFrame.mockResolvedValue(frame)
    const params = { locale: 'en', frameId: frame.id }
    const metadata = await generateMetadata({ params })
    expect(metadata.alternates?.canonical).toBe(frame.canonicalUrl)
    expect(metadata.robots).toMatchObject({ index: true, follow: true })
    const { container } = render(await CanaryFramePage({ params }))
    expect(screen.getByRole('heading', { level: 1, name: frame.name })).toBeInTheDocument()
    expect(screen.getByRole('img')).toHaveAttribute('src', frame.imageUrl)
    expect(screen.getByRole('link', { name: 'Explore the VisuTry Demo collection' })).toHaveAttribute('href', expect.stringContaining('/en/store/visutry-demo?source=visutry&medium=internal'))
    expect(screen.getByRole('link', { name: 'Compare in Everyday Fit' })).toHaveAttribute('href', expect.stringContaining('/en/c/visutry-demo/everyday-fit?'))
    const jsonLd = JSON.parse(container.querySelector('script[type="application/ld+json"]')!.textContent!)
    expect(jsonLd).toMatchObject({ '@type': 'Product', name: frame.name, url: frame.canonicalUrl })
    expect(jsonLd).not.toHaveProperty('offers')
    expect(jsonLd).not.toHaveProperty('aggregateRating')
    expect(container).toHaveTextContent('not offered for sale')
    expect(container.innerHTML).not.toMatch(/demo-optical|\/demo\/frames\//)
  })

  it('honestly omits missing media while keeping an admitted detail usable', async () => {
    readFrame.mockResolvedValue({ ...admittedFrame(), imageUrl: null, campaignPath: null })
    render(await CanaryFramePage({ params: { locale: 'en', frameId: 'canary-round' } }))
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByText('Frame image unavailable.')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Compare in Everyday Fit' })).not.toBeInTheDocument()
  })

  it('does not expose the English example through another locale', async () => {
    expect(await generateMetadata({ params: { locale: 'ja', frameId: 'canary-round' } })).toEqual({ robots: { index: false, follow: false } })
    await expect(CanaryFramePage({ params: { locale: 'ja', frameId: 'canary-round' } })).rejects.toThrow('NOT_FOUND')
    expect(readFrame).not.toHaveBeenCalled()
  })

  it('returns not-found/noindex for a frame not admitted by the bounded public sources', async () => {
    readFrame.mockResolvedValue(null)
    const params = { locale: 'en', frameId: 'other-tenant-frame' }
    expect((await generateMetadata({ params })).robots).toMatchObject({ index: false })
    await expect(CanaryFramePage({ params })).rejects.toThrow('NOT_FOUND')
  })
})
