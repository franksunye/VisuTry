import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MerchantCampaignDetailWorkspace } from '@/components/merchant/MerchantCampaignDetailWorkspace'
import type { CampaignReadModel } from '@/modules/store/application/campaign-service'
import { DEFAULT_DECISION_JOURNEY_POLICY } from '@/modules/store/domain/decision-journey'
import { DEFAULT_EXPERIENCE_DELIVERY_POLICY } from '@/modules/store/domain/delivery-profile'

const mockRefresh = jest.fn()
jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mockRefresh }) }))
jest.mock('next/image', () => ({ __esModule: true, default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} /> }))
jest.mock('@/components/merchant/MerchantCampaignPrivatePreview', () => ({ MerchantCampaignPrivatePreview: () => <div /> }))

function campaign(): CampaignReadModel {
  return {
    id: 'campaign-a', merchantId: 'merchant-a', slug: 'spring', name: 'Spring frames', status: 'ACTIVE',
    objective: 'INTENT', gate: 'NONE', presentationMode: 'PRODUCT_FIRST',
    journeyPolicy: DEFAULT_DECISION_JOURNEY_POLICY, effectiveJourneyPolicy: DEFAULT_DECISION_JOURNEY_POLICY,
    journeyCapabilities: { tryOnEnabled: true, compareEnabled: true, kioskDeliveryEnabled: true },
    deliveryPolicy: DEFAULT_EXPERIENCE_DELIVERY_POLICY, headline: null, description: null,
    primaryCtaType: null, primaryCtaLabel: null, primaryCtaUrl: null,
    secondaryCtaType: null, secondaryCtaLabel: null, secondaryCtaUrl: null,
    startAt: null, endAt: null, frameIds: [], frameCount: 0, selectedFrames: [], referenceData: false,
    publicPath: '/en/c/north-star/spring', readiness: { ready: true, blockingIssues: [], warnings: [] },
  }
}

function ok(data: unknown) {
  return { ok: true, json: async () => ({ success: true, data }) }
}

describe('MerchantCampaignDetailWorkspace Experience configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn().mockImplementation(async (input: string, init?: RequestInit) => {
      if (input.includes('/catalog?')) return ok({ items: [], nextCursor: null })
      if (init?.method === 'PATCH') return ok({ ...campaign(), name: 'Spring frames update', journeyPolicy: { enabledStages: ['FACE_ANALYSIS', 'FIT_PROFILE', 'RECOMMENDATION'] } })
      return ok(campaign())
    }) as jest.Mock
  })

  it('previews unsaved flow and requires confirmation before changing a specific live Campaign', async () => {
    render(<MerchantCampaignDetailWorkspace locale="en" merchantId="merchant-a" merchantName="North Star" initialCampaign={campaign()} />)
    fireEvent.change(screen.getByLabelText('Campaign name *'), { target: { value: 'Spring frames update' } })
    fireEvent.click(screen.getByRole('checkbox', { name: 'Virtual Try-On' }))
    fireEvent.click(screen.getByRole('button', { name: 'Preview shopper flow' }))

    expect(screen.getByRole('region', { name: 'Shopper flow preview' })).toHaveTextContent('Live after confirmation')
    expect(screen.getByRole('region', { name: 'Shopper flow preview' })).not.toHaveTextContent('Try-On · Compare')
    fireEvent.click(screen.getByRole('button', { name: 'Save campaign details' }))

    expect(screen.getByRole('alertdialog', { name: 'Apply changes to the live Campaign?' })).toHaveTextContent('Spring frames')
    expect(global.fetch).not.toHaveBeenCalledWith('/api/merchant/merchant-a/campaigns/campaign-a', expect.objectContaining({ method: 'PATCH' }))
    fireEvent.click(screen.getByRole('button', { name: 'Apply to live Campaign' }))

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/api/merchant/merchant-a/campaigns/campaign-a', expect.objectContaining({ method: 'PATCH' })))
    const patchCall = (global.fetch as jest.Mock).mock.calls.find(([, init]) => init?.method === 'PATCH')
    expect(JSON.parse(patchCall[1].body)).toMatchObject({
      name: 'Spring frames update',
      journeyPolicy: { enabledStages: ['FACE_ANALYSIS', 'FIT_PROFILE', 'RECOMMENDATION'] },
    })
    expect(await screen.findByText('Campaign details saved. These changes are now visible in your live Campaign.')).toBeInTheDocument()
  })
})
