import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MerchantControlCenter } from '@/components/merchant/MerchantControlCenter'

const baseProps = {
  locale: 'en', selectedMerchantId: 'merchant-a', merchants: [{ id: 'merchant-a', slug: 'alpha', name: 'Alpha', role: 'OWNER' }],
  control: { merchant: { id: 'merchant-a', slug: 'alpha', name: 'Alpha', websiteUrl: null, status: 'ACTIVE', referenceData: false }, store: null, experiences: [], activeCampaignCount: 0, shopperActivityAvailable: false, credentialUsage: { active: 0 } },
  credentials: [], endpoint: 'https://www.visutry.com/api/mcp', skills: [
    { name: 'VisuTry Merchant', purpose: 'Set up Store, Campaigns, and insights', url: 'https://www.visutry.com/skills/merchant', prompt: 'Help me set up my VisuTry Store.' },
  ],
}

describe('MerchantControlCenter', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: jest.fn().mockResolvedValue(undefined) } })
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { credentials: [{ id: 'credential-a', name: 'Agent', masked: 'vt_live_••••••••', scopes: ['analytics:read'], status: 'ACTIVE', createdAt: '2026-08-01T00:00:00.000Z', lastUsedAt: null, revokedAt: null }] } }) }) as jest.Mock
  })

  it('renders the three-step connection surface and mobile-safe stacked sections', () => {
    render(<MerchantControlCenter {...baseProps} />)
    expect(screen.getByText('https://www.visutry.com/api/mcp')).toBeInTheDocument()
    expect(screen.getByText('Connect your Agent')).toBeInTheDocument()
    expect(screen.getByText('Copy the Agent prompt')).toBeInTheDocument()
    expect(screen.getByText('Talk to your Agent')).toBeInTheDocument()
    expect(screen.getByText('About the VisuTry Merchant Skill')).toBeInTheDocument()
    expect(screen.getByText('No data yet')).toBeInTheDocument()
    expect(document.querySelector('table')).not.toBeInTheDocument()
  })

  it('renders merchant-readable Commerce Intelligence when controlled activity exists', () => {
    render(<MerchantControlCenter {...baseProps} control={{ ...baseProps.control, commerceIntelligence: {
      period: { from: '2026-08-01T00:00:00.000Z', to: '2026-08-24T00:00:00.000Z', timezone: 'UTC' },
      hasActivity: true,
      totals: { visitors: 12, engagedShoppers: 8, recommendationActivity: 7, tryOnCompletions: 5, compareActivity: 3, productClicks: 2, highIntentShoppers: 2 },
      rates: { engagement: 66.7, recommendation: 58.3, tryOn: 41.7, compare: 25 },
      acquisitionSources: [{ source: 'AI · ChatGPT', visitors: 4 }, { source: 'organic / search', visitors: 8 }],
      experiences: [{ id: 'experience-a', type: 'STORE', name: 'Reference Store', status: 'ACTIVE', referenceData: true, visitors: 12, engagedShoppers: 8, recommendationActivity: 7, tryOnCompletions: 5, compareActivity: 3, productClicks: 2, highIntentShoppers: 2 }],
    } }} />)
    expect(screen.getByRole('heading', { name: 'Understand shopper intent' })).toBeInTheDocument()
    expect(screen.getAllByText('Visitors').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText('AI · ChatGPT')).toBeInTheDocument()
    expect(screen.getByText('Reference / Simulation')).toBeInTheDocument()
  })

  it('shows a newly created secret once and removes it on close', async () => {
    ;(global.fetch as jest.Mock).mockImplementation(async (url: string, options?: RequestInit) => {
      if (options?.method === 'POST') return { ok: true, json: async () => ({ data: { secret: 'vt_live_one_time_secret' } }) }
      return { ok: true, json: async () => ({ data: { credentials: [{ id: 'credential-a', name: 'Agent', masked: 'vt_live_••••••••', scopes: ['analytics:read'], status: 'ACTIVE', createdAt: '2026-08-01T00:00:00.000Z', lastUsedAt: null, revokedAt: null }] } }) }
    })
    render(<MerchantControlCenter {...baseProps} />)
    fireEvent.click(screen.getByRole('button', { name: 'Create key' }))
    await waitFor(() => expect(screen.getByText(/vt_live_one_time_secret/)).toBeInTheDocument())
    expect(screen.getByText('Ready')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open agent connection' })).toBeInTheDocument()
    expect(screen.getByText(/Key will not be shown again/)).toBeInTheDocument()
    expect(screen.getByText('Your Agent startup prompt is ready')).toBeInTheDocument()
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('You are my VisuTry Merchant Agent.'))
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('VisuTry Merchant Skill:\nhttps://www.visutry.com/skills/merchant'))
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('VisuTry MCP endpoint:\nhttps://www.visutry.com/api/mcp'))
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('Agent Key:\nvt_live_one_time_secret'))
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('After connection verification, follow the Merchant Skill to assess the workspace state'))
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('Do not stop after reporting connection status.'))
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('Creating a draft and publishing it are separate decisions.'))
    expect(navigator.clipboard.writeText).not.toHaveBeenCalledWith(expect.stringContaining('If no Store exists:'))
    fireEvent.click(screen.getByRole('button', { name: 'Continue to Agent' }))
    expect(screen.queryByText(/vt_live_one_time_secret/)).not.toBeInTheDocument()
  })
})
