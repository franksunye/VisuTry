import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MerchantControlCenter } from '@/components/merchant/MerchantControlCenter'
import { analytics } from '@/lib/analytics'

jest.mock('@/lib/analytics', () => ({
  analytics: { trackCustomEvent: jest.fn() },
}))

const baseProps = {
  locale: 'en', selectedMerchantId: 'merchant-a', merchants: [{ id: 'merchant-a', slug: 'alpha', name: 'Alpha', role: 'OWNER' }],
  control: { merchant: { id: 'merchant-a', slug: 'alpha', name: 'Alpha', websiteUrl: null, status: 'ACTIVE', referenceData: false }, store: null, catalog: { total: 0, active: 0, valid: 0, invalid: 0, sourceCounts: [] }, experiences: [], activeCampaignCount: 0, shopperActivityAvailable: false, credentialUsage: { active: 0 } },
  credentials: [], endpoint: 'https://www.visutry.com/api/mcp', skills: [
    { name: 'VisuTry Merchant', purpose: 'Set up Store, Campaigns, and insights', url: 'https://www.visutry.com/skills/merchant', prompt: 'Help me set up my VisuTry Store.' },
  ],
}

describe('MerchantControlCenter', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: jest.fn().mockResolvedValue(undefined) } })
    global.fetch = jest.fn().mockImplementation(async (url: string) => {
      if (url.includes('/catalog')) return new Promise(() => undefined)
      return { ok: true, json: async () => ({ data: { credentials: [{ id: 'credential-a', name: 'Agent', masked: 'vt_live_••••••••', scopes: ['analytics:read'], status: 'ACTIVE', createdAt: '2026-08-01T00:00:00.000Z', lastUsedAt: null, revokedAt: null }] } }) }
    }) as jest.Mock
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

  it('shows the post-creation next step and records workspace entry', () => {
    render(<MerchantControlCenter {...baseProps} onboardingState="created" />)
    expect(screen.getByRole('status')).toHaveTextContent('Merchant workspace created successfully')
    expect(screen.getByRole('link', { name: /next: add your eyewear catalog/i })).toHaveAttribute('href', '#catalog')
    expect(analytics.trackCustomEvent).toHaveBeenCalledWith('merchant_workspace_entered', expect.objectContaining({ merchant_id: 'merchant-a', entry_point: 'b2b' }))
  })

  it('renders merchant-readable Commerce Intelligence when controlled activity exists', () => {
    render(<MerchantControlCenter {...baseProps} control={{ ...baseProps.control, commerceIntelligence: {
      period: { from: '2026-08-01T00:00:00.000Z', to: '2026-08-24T00:00:00.000Z', timezone: 'UTC' },
      hasActivity: true,
      totals: { visitors: 12, engagedShoppers: 8, recommendationActivity: 7, tryOnCompletions: 5, compareActivity: 3, productClicks: 2, highIntentShoppers: 2 },
      rates: { engagement: 66.7, recommendation: 58.3, tryOn: 41.7, compare: 25 },
      comparison: { previousPeriod: { from: '2026-07-08T00:00:00.000Z', to: '2026-08-01T00:00:00.000Z', timezone: 'UTC' }, previous: { visitors: 6, engagedShoppers: 4, recommendationActivity: 4, tryOnCompletions: 2, compareActivity: 1, productClicks: 1, highIntentShoppers: 1 }, deltas: { visitors: 100, engagedShoppers: 100, recommendationActivity: 75, tryOnCompletions: 150, compareActivity: 200, productClicks: 100, highIntentShoppers: 100 }, reliable: true },
      experiencePerformance: { reliable: true, ranked: [{ id: 'experience-a', type: 'STORE', name: 'Reference Store', visitors: 12, engagedShoppers: 8, tryOnCompletions: 5, productClicks: 2, highIntentShoppers: 2 }], topExperienceId: null, topMetric: null, needsAttentionExperienceId: null },
      sourceHighlights: { topVisitors: 'ChatGPT', topDownstreamIntent: 'ChatGPT', topHighIntent: 'ChatGPT', reliable: true },
      interpretation: { summary: 'Visitors changed +100% versus the previous equivalent window.', evidence: ['Visitors changed +100% versus the previous equivalent window.'], nextAction: 'Ask Agent to compare these Experiences' },
      acquisitionSources: [{ source: 'AI · ChatGPT', visitors: 4 }, { source: 'organic / search', visitors: 8 }],
      distributionReport: {
        scope: 'MERCHANT_STORE_CAMPAIGN_SESSIONS',
        consumerEventBoundary: 'Detector and Advisor events currently live in GA4/dataLayer without a durable MerchantSession join; this report does not claim those Consumer actions.',
        sources: [{ sourceClass: 'chatgpt', visitors: 4, engagedShoppers: 3, recommendationActivity: 2, tryOnCompletions: 1, compareActivity: 1, productClicks: 1, inquiries: 0, highIntentShoppers: 1 }],
      },
      experiences: [{ id: 'experience-a', type: 'STORE', name: 'Reference Store', status: 'ACTIVE', referenceData: true, visitors: 12, engagedShoppers: 8, recommendationActivity: 7, tryOnCompletions: 5, compareActivity: 3, productClicks: 2, highIntentShoppers: 2 }],
    } }} />)
    expect(screen.getByRole('heading', { name: 'Understand shopper intent' })).toBeInTheDocument()
    expect(screen.getByText('Data window (UTC)')).toBeInTheDocument()
    expect(screen.getAllByText(/Aug 1, 2026/)).toHaveLength(3)
    expect(screen.getByRole('button', { name: 'Continue with Agent' })).toBeInTheDocument()
    expect(screen.getAllByText('Visitors').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText('AI · ChatGPT')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Source → decision actions' })).toBeInTheDocument()
    expect(screen.getByText('Downstream intent')).toBeInTheDocument()
    expect(screen.getByText(/Detector and Advisor events currently live in GA4\/dataLayer/)).toBeInTheDocument()
    expect(screen.getByText('Reference / Simulation')).toBeInTheDocument()
  })

  it('renders the merchant-readable empty Commerce Intelligence state', () => {
    render(<MerchantControlCenter {...baseProps} control={{ ...baseProps.control, commerceIntelligence: {
      period: { from: '2026-08-01T00:00:00.000Z', to: '2026-08-24T00:00:00.000Z', timezone: 'UTC' },
      hasActivity: false,
      totals: { visitors: 0, engagedShoppers: 0, recommendationActivity: 0, tryOnCompletions: 0, compareActivity: 0, productClicks: 0, highIntentShoppers: 0 },
      rates: { engagement: null, recommendation: null, tryOn: null, compare: null },
      comparison: { previousPeriod: { from: '2026-07-08T00:00:00.000Z', to: '2026-08-01T00:00:00.000Z', timezone: 'UTC' }, previous: { visitors: 0, engagedShoppers: 0, recommendationActivity: 0, tryOnCompletions: 0, compareActivity: 0, productClicks: 0, highIntentShoppers: 0 }, deltas: { visitors: 0, engagedShoppers: 0, recommendationActivity: 0, tryOnCompletions: 0, compareActivity: 0, productClicks: 0, highIntentShoppers: 0 }, reliable: false },
      experiencePerformance: { reliable: false, ranked: [], topExperienceId: null, topMetric: null, needsAttentionExperienceId: null },
      sourceHighlights: { topVisitors: null, topDownstreamIntent: null, topHighIntent: null, reliable: false },
      interpretation: { summary: 'No shopper activity yet. Share a published Store or Campaign before comparing performance.', evidence: [], nextAction: 'Ask Agent to review setup' },
      acquisitionSources: [],
      experiences: [],
    } }} />)
    expect(screen.getByRole('heading', { name: 'Understand shopper intent' })).toBeInTheDocument()
    expect(screen.getByText(/Data window \(UTC\)/)).toBeInTheDocument()
    expect(screen.getByText('No shopper activity yet')).toBeInTheDocument()
    expect(screen.getByText(/Share a published Store or Campaign to start collecting decision signals/)).toBeInTheDocument()
    expect(screen.queryByText('Visitors')).not.toBeInTheDocument()
    expect(screen.getByText(/No shopper photos, identity, revenue, or purchase claims/)).toBeInTheDocument()
    expect(screen.getByText(/Human approval remains required/)).toBeInTheDocument()
  })

  it('shows catalog readiness, campaign context, and agent-mediated status controls', () => {
    render(<MerchantControlCenter {...baseProps} control={{ ...baseProps.control, catalog: { total: 2, active: 2, valid: 2, invalid: 0, sourceCounts: [{ source: 'SEED', count: 2 }] }, experiences: [
      { id: 'store-a', type: 'STORE', name: 'Reference Store', slug: 'alpha', status: 'ACTIVE', frameCount: 1, referenceData: true, publicPath: '/en/store/alpha', headline: null, description: null, primaryCtaLabel: null, startAt: null, endAt: null, selectedFrames: [{ id: 'frame-a', sku: 'A-1', name: 'Frame A', brand: 'Alpha', imageUrl: 'https://example.com/a.jpg', source: 'SEED', status: 'ACTIVE', enrichmentStatus: 'APPROVED', validation: { valid: true, issues: [], warnings: [] } }], readiness: { status: 'VALID', validCount: 1, invalidCount: 0, issues: [] }, lastOperation: { label: 'Published', actor: 'Agent', at: '2026-08-20T00:00:00.000Z' }, policy: { objective: null, gate: null, presentation: 'PRODUCT_FIRST' }, updatedAt: '2026-08-20T00:00:00.000Z' },
      { id: 'campaign-a', type: 'CAMPAIGN', name: 'Everyday Fit', slug: 'everyday-fit', status: 'DRAFT', frameCount: 0, referenceData: false, publicPath: '/en/c/alpha/everyday-fit', headline: 'Find your everyday frame', description: 'A focused campaign for daily wear.', primaryCtaLabel: 'Explore frames', startAt: null, endAt: null, selectedFrames: [], readiness: { status: 'INCOMPLETE', validCount: 0, invalidCount: 0, issues: ['NO_SELECTED_FRAMES'] }, lastOperation: { label: 'Created', actor: 'Agent', at: '2026-08-19T00:00:00.000Z' }, policy: { objective: 'INTENT', gate: 'NONE', presentation: 'EDITORIAL_FIRST' }, updatedAt: '2026-08-19T00:00:00.000Z' },
    ] }} />)
    expect(screen.getByText('2 products · 2 active · 2 valid')).toBeInTheDocument()
    expect(screen.getByText('Catalog ready')).toBeInTheDocument()
    expect(screen.getByText('Frame A')).toBeInTheDocument()
    expect(screen.getByText('Find your everyday frame')).toBeInTheDocument()
    expect(screen.getByText('CTA: Explore frames')).toBeInTheDocument()
    expect(screen.getByText('Published by Agent')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Ask Agent to update' })).toHaveLength(2)
    expect(screen.getByText('Select products to continue')).toBeInTheDocument()
  })

  it('shows a newly created secret once and removes it on close', async () => {
    ;(global.fetch as jest.Mock).mockImplementation(async (url: string, options?: RequestInit) => {
      if (options?.method === 'POST') return { ok: true, json: async () => ({ data: { secret: 'vt_live_one_time_secret' } }) }
      if (url.includes('/catalog')) return new Promise(() => undefined)
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
