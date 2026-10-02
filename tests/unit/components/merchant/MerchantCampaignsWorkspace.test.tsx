import { fireEvent, render, screen, within } from '@testing-library/react'
import { MerchantCampaignsWorkspace } from '@/components/merchant/MerchantCampaignsWorkspace'
import type { CampaignReadModel } from '@/modules/store/application/campaign-service'

jest.mock('lucide-react', () => {
  const React = jest.requireActual('react')
  const icons = jest.requireActual('lucide-react')
  const createIcon = (name: string) => (props: Record<string, unknown>) => React.createElement('span', { ...props, 'data-testid': `${name}-icon` })
  return {
    ...icons,
    Archive: createIcon('archive'),
    CalendarDays: createIcon('calendar-days'),
    CircleDot: createIcon('circle-dot'),
    Layers3: createIcon('layers-3'),
  }
})

function campaign(overrides: Partial<CampaignReadModel> & Pick<CampaignReadModel, 'id' | 'name' | 'status'>): CampaignReadModel {
  const { id, name, status, ...rest } = overrides
  return {
    id,
    merchantId: 'merchant-a',
    slug: id,
    name,
    status,
    objective: 'INTENT',
    gate: 'OPT_IN_AFTER_VALUE',
    presentationMode: 'EDITORIAL_FIRST',
    headline: null,
    description: null,
    primaryCtaType: null,
    primaryCtaLabel: null,
    primaryCtaUrl: null,
    secondaryCtaType: null,
    secondaryCtaLabel: null,
    secondaryCtaUrl: null,
    startAt: null,
    endAt: null,
    frameIds: [],
    frameCount: 0,
    selectedFrames: [],
    referenceData: false,
    publicPath: `/en/c/merchant-a/${id}`,
    readiness: { ready: true, blockingIssues: [], warnings: [] },
    ...rest,
  }
}

describe('MerchantCampaignsWorkspace', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
  })

  it('shows canonical lifecycle counts and filters All, Draft, Live, and Archived campaigns', () => {
    const campaigns = [
      campaign({ id: 'draft-a', name: 'Spring draft', status: 'DRAFT' }),
      campaign({ id: 'live-a', name: 'Spring live', status: 'ACTIVE' }),
      campaign({ id: 'archived-a', name: 'Spring archived', status: 'ARCHIVED' }),
      campaign({ id: 'draft-b', name: 'Summer draft', status: 'DRAFT' }),
    ]
    render(<MerchantCampaignsWorkspace locale="en" merchantId="merchant-a" campaigns={campaigns} />)

    const summary = screen.getByLabelText('Campaign lifecycle summary')
    expect(within(summary).getByText('All campaigns').parentElement).toHaveTextContent('4')
    expect(within(summary).getByText('Draft').parentElement).toHaveTextContent('2')
    expect(within(summary).getByText('Live').parentElement).toHaveTextContent('1')
    expect(within(summary).getByText('Archived').parentElement).toHaveTextContent('1')

    const list = screen.getByRole('list', { name: 'Campaigns' })
    expect(within(list).getAllByRole('listitem')).toHaveLength(4)

    fireEvent.click(screen.getByRole('button', { name: 'Draft 2' }))
    expect(within(list).getAllByRole('listitem')).toHaveLength(2)
    expect(within(list).getByText('Spring draft')).toBeInTheDocument()
    expect(within(list).getByText('Summer draft')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Live 1' }))
    expect(within(list).getAllByRole('listitem')).toHaveLength(1)
    expect(within(list).getByText('Spring live')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Archived 1' }))
    expect(within(list).getAllByRole('listitem')).toHaveLength(1)
    expect(within(list).getByText('Spring archived')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'All 4' }))
    expect(within(list).getAllByRole('listitem')).toHaveLength(4)
  })

  it('uses the first selected-frame image and renders a neutral fallback when it is absent', () => {
    const campaigns = [
      campaign({
        id: 'with-image',
        name: 'With image',
        status: 'DRAFT',
        selectedFrames: [
          { id: 'frame-first', name: 'First frame', brand: null, imageUrl: 'https://cdn.example.test/first.jpg', productUrl: null, price: null, currency: null, shape: null, status: 'ACTIVE', valid: true, issues: [] },
          { id: 'frame-second', name: 'Second frame', brand: null, imageUrl: 'https://cdn.example.test/second.jpg', productUrl: null, price: null, currency: null, shape: null, status: 'ACTIVE', valid: true, issues: [] },
        ],
      }),
      campaign({
        id: 'without-image',
        name: 'Without image',
        status: 'DRAFT',
        selectedFrames: [{ id: 'frame-no-image', name: 'No image', brand: null, imageUrl: null, productUrl: null, price: null, currency: null, shape: null, status: 'ACTIVE', valid: true, issues: [] }],
      }),
    ]
    const { container } = render(<MerchantCampaignsWorkspace locale="en" merchantId="merchant-a" campaigns={campaigns} />)

    const firstRow = screen.getByRole('heading', { name: 'With image' }).closest('li')!
    expect(firstRow.querySelector('img')).toHaveAttribute('src', 'https://cdn.example.test/first.jpg')
    expect(firstRow.querySelector('img')).not.toHaveAttribute('src', 'https://cdn.example.test/second.jpg')

    const fallbackRow = screen.getByRole('heading', { name: 'Without image' }).closest('li')!
    expect(fallbackRow.querySelector('img')).not.toBeInTheDocument()
    expect(within(fallbackRow).getByTestId('glasses-icon')).toBeInTheDocument()
    expect(container.querySelectorAll('ul[aria-label="Campaigns"] li')).toHaveLength(2)
  })

  it('preserves merchantId on each Campaign Open link', () => {
    render(<MerchantCampaignsWorkspace
      locale="en"
      merchantId="merchant-a"
      campaigns={[campaign({ id: 'campaign-live', name: 'Spring eyewear', status: 'ACTIVE' })]}
    />)

    const openLink = screen.getByRole('heading', { name: 'Spring eyewear' }).closest('a')
    expect(openLink).toHaveAttribute('href', '/en/merchant/campaigns/campaign-live?merchantId=merchant-a')
  })

  it('opens and cancels Create Campaign without issuing a write before submit', () => {
    render(<MerchantCampaignsWorkspace locale="en" merchantId="merchant-a" campaigns={[]} />)

    fireEvent.click(within(screen.getByRole('banner')).getByRole('button', { name: 'Create Campaign' }))
    expect(screen.getByRole('form', { name: 'Create a Campaign draft' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /Campaign name/ })).toHaveFocus()
    expect(global.fetch).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('form', { name: 'Create a Campaign draft' })).not.toBeInTheDocument()
    expect(global.fetch).not.toHaveBeenCalled()
  })
})
