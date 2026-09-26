/** @jest-environment node */

import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { withPublicDiscoveryInvalidation } from '@/modules/store/application/public-discovery-invalidation'
import { buildExperienceAdminSavePayload } from '@/components/admin/experience-admin-save-payload'
import { PUT as updateExperience } from '@/app/api/admin/store/merchants/[id]/experiences/[experienceId]/route'
import { PUT as updateFrames } from '@/app/api/admin/store/merchants/[id]/experiences/[experienceId]/frames/route'

jest.mock('@/lib/api-auth', () => ({ requireAdmin: jest.fn() }))
jest.mock('@/lib/prisma', () => ({
  prisma: {
    experience: { findFirst: jest.fn(), update: jest.fn() },
    merchant: { findUnique: jest.fn() },
    merchantFrame: { findMany: jest.fn() },
    $transaction: jest.fn(),
  },
}))

jest.mock('@/modules/store/application/public-discovery-invalidation', () => ({
  withPublicDiscoveryInvalidation: jest.fn(async ({ mutation }: { mutation: () => Promise<unknown> }) => mutation()),
}))

const db = prisma as unknown as {
  experience: { findFirst: jest.Mock; update: jest.Mock }
  merchant: { findUnique: jest.Mock }
  merchantFrame: { findMany: jest.Mock }
  $transaction: jest.Mock
}

const admin = requireAdmin as jest.Mock
const boundary = withPublicDiscoveryInvalidation as jest.Mock
const storeExperience = { id: 'experience-1', slug: 'store', type: 'STORE', merchant: { slug: 'merchant-a' } }
const campaignExperience = {
  id: 'campaign-a',
  slug: 'spring',
  type: 'CAMPAIGN',
  merchantId: 'merchant-a',
  merchant: { slug: 'merchant-a' },
  name: 'Spring',
  status: 'DRAFT',
  headline: 'Spring frames',
  description: null,
  primaryCtaType: null,
  primaryCtaLabel: null,
  primaryCtaUrl: null,
  secondaryCtaType: null,
  secondaryCtaLabel: null,
  secondaryCtaUrl: null,
  startAt: null,
  endAt: null,
  campaignObjective: 'INTENT',
  campaignGate: 'NONE',
  presentationMode: 'EDITORIAL_FIRST',
  referenceData: false,
  frames: [],
}

describe('Merchant Experience admin routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    admin.mockResolvedValue({ ok: true, userId: 'admin-1' })
  })

  it('rejects unsafe CTA destinations before writing configuration', async () => {
    db.experience.findFirst.mockResolvedValue({ id: 'experience-1' })
    for (const primaryCtaUrl of ['//evil.example.com', 'http://merchant.example', 'javascript:alert(1)', 'data:text/html,hello', 'ftp://merchant.example', 'https://', '/foo bar', `/foo${'\u0000'}bar`]) {
      const response = await updateExperience(
        new NextRequest('http://localhost/api/admin/store/merchants/merchant-a/experiences/experience-1', {
          method: 'PUT',
          body: JSON.stringify({ primaryCtaUrl }),
        }),
        { params: { id: 'merchant-a', experienceId: 'experience-1' } },
      )
      expect(response.status).toBe(400)
    }
    expect(db.experience.update).not.toHaveBeenCalled()
  })

  it.each(['/products/foo', 'https://merchant.example/product'])('accepts safe CTA destination %s', async (primaryCtaUrl) => {
    db.experience.findFirst.mockResolvedValue(storeExperience)
    db.experience.update.mockResolvedValue({ id: 'experience-1', primaryCtaUrl })

    const response = await updateExperience(
      new NextRequest('http://localhost/api/admin/store/merchants/merchant-a/experiences/experience-1', {
        method: 'PUT',
        body: JSON.stringify({ primaryCtaUrl }),
      }),
      { params: { id: 'merchant-a', experienceId: 'experience-1' } },
    )

    expect(response.status).toBe(200)
    expect(db.experience.update).toHaveBeenCalledWith(expect.objectContaining({ data: { primaryCtaUrl } }))
    expect(boundary).toHaveBeenCalledWith(expect.objectContaining({ target: { kind: 'experience', merchantSlug: 'merchant-a', experienceSlug: null } }))
  })

  it('accepts a bounded journey policy and rejects arbitrary workflow stages', async () => {
    db.experience.findFirst.mockResolvedValue(storeExperience)
    db.experience.update.mockResolvedValue({ id: 'experience-1' })
    const valid = { enabledStages: ['FACE_ANALYSIS', 'RECOMMENDATION', 'TRY_ON'] }

    const response = await updateExperience(
      new NextRequest('http://localhost/api/admin/store/merchants/merchant-a/experiences/experience-1', {
        method: 'PUT',
        body: JSON.stringify({ journeyPolicy: valid }),
      }),
      { params: { id: 'merchant-a', experienceId: 'experience-1' } },
    )
    expect(response.status).toBe(200)
    expect(db.experience.update).toHaveBeenCalledWith(expect.objectContaining({ data: { journeyPolicy: valid } }))

    jest.clearAllMocks()
    admin.mockResolvedValue({ ok: true, userId: 'admin-1' })
    db.experience.findFirst.mockResolvedValue(storeExperience)
    const invalid = await updateExperience(
      new NextRequest('http://localhost/api/admin/store/merchants/merchant-a/experiences/experience-1', {
        method: 'PUT',
        body: JSON.stringify({ journeyPolicy: { enabledStages: ['FACE_ANALYSIS', 'TRY_ON', 'RECOMMENDATION'] } }),
      }),
      { params: { id: 'merchant-a', experienceId: 'experience-1' } },
    )
    expect(invalid.status).toBe(400)
    expect(db.experience.update).not.toHaveBeenCalled()
  })

  it('saves the normal Store Admin payload without Campaign schedule fields', async () => {
    db.experience.findFirst.mockResolvedValue(storeExperience)
    db.merchant.findUnique.mockResolvedValue({ slug: 'merchant-a' })
    db.experience.update.mockResolvedValue({ id: 'experience-1', status: 'ACTIVE' })
    const payload = buildExperienceAdminSavePayload({
      type: 'STORE', name: 'Store A', status: 'ACTIVE', headline: 'Find your fit', description: null,
      primaryCtaLabel: 'Explore', primaryCtaUrl: '/shop', offerLabel: null, offerCode: null,
      startAt: null, endAt: null,
    }, { enabledStages: ['FACE_ANALYSIS', 'RECOMMENDATION', 'TRY_ON'] }, {
      kioskEnabled: true, kioskIdleTimeoutSeconds: 120,
    })

    expect(payload).toMatchObject({ status: 'ACTIVE', headline: 'Find your fit', journeyPolicy: { enabledStages: expect.any(Array) }, deliveryPolicy: { kioskEnabled: true } })
    expect(payload).not.toHaveProperty('startAt')
    expect(payload).not.toHaveProperty('endAt')

    const response = await updateExperience(
      new NextRequest('http://localhost/api/admin/store/merchants/merchant-a/experiences/experience-1', {
        method: 'PUT', body: JSON.stringify(payload),
      }),
      { params: { id: 'merchant-a', experienceId: 'experience-1' } },
    )

    expect(response.status).toBe(200)
    expect(db.experience.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: 'ACTIVE', headline: 'Find your fit', journeyPolicy: payload.journeyPolicy, deliveryPolicy: payload.deliveryPolicy }) }))
    const commandData = (db.experience.update.mock.calls[0][0] as { data: Record<string, unknown> }).data
    expect(commandData).not.toHaveProperty('startAt')
    expect(commandData).not.toHaveProperty('endAt')
  })

  it('rejects Campaign schedule input on Store Admin writes before invoking the shared command', async () => {
    db.experience.findFirst.mockResolvedValue(storeExperience)
    const response = await updateExperience(
      new NextRequest('http://localhost/api/admin/store/merchants/merchant-a/experiences/experience-1', {
        method: 'PUT', body: JSON.stringify({ headline: 'Store', startAt: null }),
      }),
      { params: { id: 'merchant-a', experienceId: 'experience-1' } },
    )
    expect(response.status).toBe(400)
    expect(db.experience.update).not.toHaveBeenCalled()
  })

  it('accepts a Campaign Journey-only update as a successful canonical mutation', async () => {
    const journeyPolicy = { enabledStages: ['FACE_ANALYSIS', 'RECOMMENDATION', 'TRY_ON'] }
    db.experience.findFirst.mockResolvedValue(campaignExperience)
    db.merchant.findUnique.mockResolvedValue({ slug: 'merchant-a', referenceData: false })
    db.experience.update.mockResolvedValue({ ...campaignExperience, journeyPolicy })

    const response = await updateExperience(
      new NextRequest('http://localhost/api/admin/store/merchants/merchant-a/experiences/campaign-a', {
        method: 'PUT',
        body: JSON.stringify({ journeyPolicy }),
      }),
      { params: { id: 'merchant-a', experienceId: 'campaign-a' } },
    )

    expect(response.status).toBe(200)
    expect(db.experience.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ journeyPolicy }),
    }))
  })

  it('validates Campaign siblings before writing a Journey policy', async () => {
    const journeyPolicy = { enabledStages: ['FACE_ANALYSIS', 'RECOMMENDATION', 'TRY_ON'] }
    for (const body of [
      { journeyPolicy, status: 'NOT_A_STATUS' },
      { journeyPolicy, headline: 42 },
    ]) {
      jest.clearAllMocks()
      admin.mockResolvedValue({ ok: true, userId: 'admin-1' })
      db.experience.findFirst.mockResolvedValue(campaignExperience)

      const response = await updateExperience(
        new NextRequest('http://localhost/api/admin/store/merchants/merchant-a/experiences/campaign-a', {
          method: 'PUT',
          body: JSON.stringify(body),
        }),
        { params: { id: 'merchant-a', experienceId: 'campaign-a' } },
      )

      expect(response.status).toBe(400)
      expect(db.experience.update).not.toHaveBeenCalled()
    }
  })

  it('writes only the allowed tenant-owned frame selection and preserves order', async () => {
    db.experience.findFirst.mockResolvedValue(storeExperience)
    db.merchantFrame.findMany.mockResolvedValue([{ id: 'frame-2' }, { id: 'frame-1' }])
    const tx = {
      experienceFrame: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
    }
    db.$transaction.mockImplementation(async (callback) => callback(tx))

    const response = await updateFrames(
      new NextRequest('http://localhost/api/admin/store/merchants/merchant-a/experiences/experience-1/frames', {
        method: 'PUT',
        body: JSON.stringify({ frameIds: ['frame-2', 'frame-1', 'frame-2'] }),
      }),
      { params: { id: 'merchant-a', experienceId: 'experience-1' } },
    )

    expect(response.status).toBe(200)
    expect(boundary).toHaveBeenCalledWith(expect.objectContaining({ target: { kind: 'experience', merchantSlug: 'merchant-a', experienceSlug: null } }))
    expect(db.merchantFrame.findMany).toHaveBeenCalledWith({
      where: { merchantId: 'merchant-a', id: { in: ['frame-2', 'frame-1'] }, status: 'ACTIVE' },
      select: { id: true },
    })
    expect(tx.experienceFrame.deleteMany).toHaveBeenCalledWith({ where: { experienceId: 'experience-1', merchantId: 'merchant-a' } })
    expect(tx.experienceFrame.createMany).toHaveBeenCalledWith({
      data: [
        { experienceId: 'experience-1', merchantId: 'merchant-a', merchantFrameId: 'frame-2', sortOrder: 0, active: true },
        { experienceId: 'experience-1', merchantId: 'merchant-a', merchantFrameId: 'frame-1', sortOrder: 1, active: true },
      ],
    })
  })

  it('rejects a selection containing a frame from another merchant', async () => {
    db.experience.findFirst.mockResolvedValue({ id: 'experience-1' })
    db.merchantFrame.findMany.mockResolvedValue([])

    const response = await updateFrames(
      new NextRequest('http://localhost/api/admin/store/merchants/merchant-a/experiences/experience-1/frames', {
        method: 'PUT',
        body: JSON.stringify({ frameIds: ['merchant-b-frame'] }),
      }),
      { params: { id: 'merchant-a', experienceId: 'experience-1' } },
    )

    expect(response.status).toBe(400)
    expect(db.$transaction).not.toHaveBeenCalled()
  })

  it('refuses Admin Campaign activation when canonical readiness does not pass', async () => {
    const campaign = {
      id: 'campaign-a',
      slug: 'spring',
      type: 'CAMPAIGN',
      merchant: { slug: 'merchant-a' },
      merchantId: 'merchant-a',
      name: 'Spring',
      status: 'DRAFT',
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
      campaignObjective: 'INTENT',
      campaignGate: 'NONE',
      presentationMode: 'EDITORIAL_FIRST',
      referenceData: false,
      frames: [],
    }
    db.experience.findFirst.mockResolvedValue(campaign)
    const lockedUpdate = jest.fn()
    db.$transaction.mockImplementation(async (callback) => callback({
      $queryRaw: jest.fn(),
      merchant: { findUnique: jest.fn().mockResolvedValue({ slug: 'merchant-a', referenceData: false }) },
      experience: { findFirst: jest.fn().mockResolvedValue(campaign), count: jest.fn().mockResolvedValue(0), update: lockedUpdate },
    }))

    const response = await updateExperience(
      new NextRequest('http://localhost/api/admin/store/merchants/merchant-a/experiences/campaign-a', {
        method: 'PUT',
        body: JSON.stringify({ status: 'ACTIVE', name: 'Spring' }),
      }),
      { params: { id: 'merchant-a', experienceId: 'campaign-a' } },
    )

    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toMatchObject({ success: false, code: 'CAMPAIGN_NOT_READY' })
    expect(lockedUpdate).not.toHaveBeenCalled()
  })
})
