import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MerchantControlCenter } from '@/components/merchant/MerchantControlCenter'

const baseProps = {
  locale: 'en', selectedMerchantId: 'merchant-a', merchants: [{ id: 'merchant-a', slug: 'alpha', name: 'Alpha', role: 'OWNER' }],
  control: { merchant: { id: 'merchant-a', slug: 'alpha', name: 'Alpha', status: 'ACTIVE', referenceData: false }, store: null, experiences: [], activeCampaignCount: 0, shopperActivityAvailable: false, credentialUsage: { active: 0 } },
  credentials: [], endpoint: 'https://www.visutry.com/api/mcp', skills: [
    { name: 'Merchant Onboarding', purpose: 'Set up', url: 'https://www.visutry.com/skills/merchant-onboarding', prompt: 'Set up my Store.' },
    { name: 'Campaign Creation', purpose: 'Create', url: 'https://www.visutry.com/skills/campaign-creation', prompt: 'Create a Campaign.' },
    { name: 'Commerce Analyst', purpose: 'Analyze', url: 'https://www.visutry.com/skills/commerce-analyst', prompt: 'How is it performing?' },
  ],
}

describe('MerchantControlCenter', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { credentials: [{ id: 'credential-a', name: 'Agent', masked: 'vt_live_••••••••', scopes: ['analytics:read'], status: 'ACTIVE', createdAt: '2026-08-01T00:00:00.000Z', lastUsedAt: null, revokedAt: null }] } }) }) as jest.Mock
  })

  it('renders the connection surface, real Skill URLs, and mobile-safe stacked sections', () => {
    render(<MerchantControlCenter {...baseProps} />)
    expect(screen.getByText('https://www.visutry.com/api/mcp')).toBeInTheDocument()
    expect(screen.getByText('Merchant Onboarding')).toBeInTheDocument()
    expect(screen.getByText('Campaign Creation')).toBeInTheDocument()
    expect(screen.getByText('Commerce Analyst')).toBeInTheDocument()
    expect(screen.getByText('No shopper activity yet')).toBeInTheDocument()
    expect(document.querySelector('table')).not.toBeInTheDocument()
  })

  it('shows a newly created secret once and removes it on close', async () => {
    ;(global.fetch as jest.Mock).mockImplementation(async (url: string, options?: RequestInit) => {
      if (options?.method === 'POST') return { ok: true, json: async () => ({ data: { secret: 'vt_live_one_time_secret' } }) }
      return { ok: true, json: async () => ({ data: { credentials: [] } }) }
    })
    render(<MerchantControlCenter {...baseProps} />)
    fireEvent.click(screen.getByRole('button', { name: 'Create key' }))
    await waitFor(() => expect(screen.getByText('vt_live_one_time_secret')).toBeInTheDocument())
    expect(screen.getByText(/You won't be able to see it again/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByText('vt_live_one_time_secret')).not.toBeInTheDocument()
  })
})
