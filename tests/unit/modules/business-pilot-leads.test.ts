/** @jest-environment node */

import { businessPilotLeadInputSchema, createBusinessPilotLead } from '@/modules/business'
import { prisma } from '@/lib/prisma'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    businessPilotLead: { findUnique: jest.fn(), findUniqueOrThrow: jest.fn(), create: jest.fn() },
    businessPilotLeadRateLimit: { upsert: jest.fn() },
  },
}))

const validLead = {
  requestId: 'ecfcebe9-37f7-4ce7-a5ef-9a251ea948d5',
  contactName: 'Alex Merchant',
  email: 'alex@example.com',
  businessName: 'Example Optical',
  businessType: 'optical-store',
  websiteUrl: 'https://example.com',
  frameCountRange: '21-50',
  trafficSource: 'Paid social',
  goal: 'campaign',
  message: 'We want to test a new collection.',
  locale: 'en',
  consentToContact: true,
}

describe('Business Pilot lead application', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(prisma.businessPilotLead.findUnique as jest.Mock).mockResolvedValue(null)
    ;(prisma.businessPilotLeadRateLimit.upsert as jest.Mock).mockResolvedValue({ count: 1 })
    ;(prisma.businessPilotLead.create as jest.Mock).mockResolvedValue({ id: 'lead-1', requestId: validLead.requestId })
  })

  it('validates the public contract and rejects missing contact consent', () => {
    expect(businessPilotLeadInputSchema.safeParse(validLead).success).toBe(true)
    expect(businessPilotLeadInputSchema.safeParse({ ...validLead, consentToContact: false }).success).toBe(false)
  })

  it('persists a valid lead after consuming a privacy-preserving rate limit', async () => {
    await expect(createBusinessPilotLead(validLead, '203.0.113.8')).resolves.toMatchObject({ id: 'lead-1', accepted: true })
    expect(prisma.businessPilotLeadRateLimit.upsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({ identityHash: expect.stringMatching(/^[a-f0-9]{64}$/u), count: 1 }),
    }))
    expect(prisma.businessPilotLead.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ email: 'alex@example.com' }) }))
  })

  it('returns an idempotent success without consuming another limit', async () => {
    ;(prisma.businessPilotLead.findUnique as jest.Mock).mockResolvedValue({ id: 'lead-1', requestId: validLead.requestId })
    await expect(createBusinessPilotLead(validLead, '203.0.113.8')).resolves.toMatchObject({ duplicate: true })
    expect(prisma.businessPilotLeadRateLimit.upsert).not.toHaveBeenCalled()
    expect(prisma.businessPilotLead.create).not.toHaveBeenCalled()
  })

  it('silently accepts the honeypot without writing PII', async () => {
    await expect(createBusinessPilotLead({ ...validLead, companyFax: 'spam' }, '203.0.113.8')).resolves.toMatchObject({ spam: true })
    expect(prisma.businessPilotLead.findUnique).not.toHaveBeenCalled()
    expect(prisma.businessPilotLead.create).not.toHaveBeenCalled()
  })

  it('rejects the sixth request in an hourly window', async () => {
    ;(prisma.businessPilotLeadRateLimit.upsert as jest.Mock).mockResolvedValue({ count: 6 })
    await expect(createBusinessPilotLead(validLead, '203.0.113.8')).rejects.toMatchObject({ code: 'RATE_LIMITED', status: 429 })
    expect(prisma.businessPilotLead.create).not.toHaveBeenCalled()
  })
})
