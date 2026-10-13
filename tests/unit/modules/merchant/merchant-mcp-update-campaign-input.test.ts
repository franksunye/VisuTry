/** @jest-environment node */
import { mcpUpdateCampaignInput } from '@/modules/merchant/mcp/update-campaign-input'

const id = 'campaign-a'
const journey = { enabledStages: ['FACE_ANALYSIS', 'RECOMMENDATION', 'TRY_ON'] }
const delivery = { kioskEnabled: true, kioskIdleTimeoutSeconds: 120 }

describe('Agent update_campaign strict shared MCP input contract', () => {
  it.each([
    { campaignId: id, headline: 'Updated' },
    { campaignId: id, journeyPolicy: journey },
    { campaignId: id, deliveryPolicy: delivery },
    { campaignId: id, headline: 'Updated', journeyPolicy: journey, deliveryPolicy: delivery },
    { campaignId: id, headline: null },
  ])('accepts a real bounded patch: %p', (input) => {
    expect(mcpUpdateCampaignInput.safeParse(input).success).toBe(true)
  })

  it.each([
    { campaignId: id },
    { campaignId: id, unexpectedField: 'silently-ignored-before' },
    { campaignId: id, headline: 'Valid', unexpectedField: 'must-reject-entire-request' },
    { campaignId: id, journeyPolicy: { ...journey, unknown: true } },
    { campaignId: id, deliveryPolicy: { ...delivery, unknown: true } },
    { campaignId: id, journeyPolicy: { enabledStages: ['FACE_ANALYSIS', 'RECOMMENDATION', 'COMPARE'] } },
    { campaignId: id, deliveryPolicy: { kioskEnabled: true, kioskIdleTimeoutSeconds: 10 } },
    { unexpectedField: 'missing ID' },
  ])('rejects unsupported, invalid or no-op Campaign updates: %p', (input) => {
    expect(mcpUpdateCampaignInput.safeParse(input).success).toBe(false)
  })
})
