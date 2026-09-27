import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { ExperienceDetailEditor, type ExperienceDetailData } from '@/components/admin/ExperienceAdminUI'
import { MERCHANT_HANDOFF_ACTIONS } from '@/modules/store/domain/merchant-handoff'

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => <a href={href} {...props}>{children}</a>,
}))

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} />,
}))

jest.mock('lucide-react', () => new Proxy({}, { get: () => () => null }))

function detail(initialCta: { type: ExperienceDetailData['experience']['primaryCtaType']; label: string | null; url: string | null }): ExperienceDetailData {
  return {
    merchant: { id: 'merchant-a', slug: 'merchant-a', name: 'Merchant A', referenceData: false },
    experience: {
      id: 'experience-a', type: 'STORE', slug: 'store', name: 'Store', status: 'ACTIVE',
      headline: null, description: null, primaryCtaType: initialCta.type,
      primaryCtaLabel: initialCta.label, primaryCtaUrl: initialCta.url,
      offerLabel: null, offerCode: null, startAt: null, endAt: null, referenceData: false,
      journeyPolicy: { enabledStages: ['FACE_ANALYSIS', 'RECOMMENDATION'] },
      deliveryPolicy: { kioskEnabled: false, kioskIdleTimeoutSeconds: 120 }, selectedFrameIds: [],
    },
    catalog: [],
    insights: { metrics: { sessions: 0, tryOns: 0, recommendations: 0, compareStarts: 0, favorites: 0, productClicks: 0, inquiries: 0 } } as ExperienceDetailData['insights'],
  }
}

describe('Experience Admin Merchant Handoff editor', () => {
  const originalFetch = Object.getOwnPropertyDescriptor(globalThis, 'fetch')
  afterEach(() => {
    jest.restoreAllMocks()
    if (originalFetch) Object.defineProperty(globalThis, 'fetch', originalFetch)
    else Reflect.deleteProperty(globalThis, 'fetch')
  })

  it('shows the legacy untyped CTA as CUSTOM_LINK in a bounded action selector', () => {
    render(<ExperienceDetailEditor initial={detail({ type: 'CUSTOM_LINK', label: 'Visit shop', url: 'https://shop.example/next' })} />)

    const action = screen.getByRole('combobox', { name: 'Primary CTA action' })
    expect(action).toHaveValue('CUSTOM_LINK')
    expect(within(action).getAllByRole('option').map((option) => (option as HTMLOptionElement).value)).toEqual([
      '', ...MERCHANT_HANDOFF_ACTIONS,
    ])
  })

  it('saves the selected canonical action and removes CTA fields when action is cleared', async () => {
    const fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
    Object.defineProperty(globalThis, 'fetch', { configurable: true, value: fetch })
    render(<ExperienceDetailEditor initial={detail({ type: 'CUSTOM_LINK', label: 'Visit shop', url: 'https://shop.example/next' })} />)

    const action = screen.getByRole('combobox', { name: 'Primary CTA action' })
    fireEvent.change(action, { target: { value: 'PRODUCT' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save settings' }))
    await waitFor(() => expect(fetch).toHaveBeenCalled())

    const options = JSON.parse(String(fetch.mock.calls[0][1]?.body)) as { primaryCtaType: string }
    expect(options.primaryCtaType).toBe('PRODUCT')

    fireEvent.change(action, { target: { value: '' } })
    expect(screen.getByLabelText('Primary CTA label')).toBeDisabled()
    expect(screen.getByLabelText('Primary CTA label')).toHaveValue('')
  })
})
