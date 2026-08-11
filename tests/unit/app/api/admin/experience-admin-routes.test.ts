/** @jest-environment node */

import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { PUT as updateExperience } from '@/app/api/admin/store/merchants/[id]/experiences/[experienceId]/route'
import { PUT as updateFrames } from '@/app/api/admin/store/merchants/[id]/experiences/[experienceId]/frames/route'

jest.mock('@/lib/api-auth', () => ({ requireAdmin: jest.fn() }))
jest.mock('@/lib/prisma', () => ({
  prisma: {
    experience: { findFirst: jest.fn(), update: jest.fn() },
    merchantFrame: { findMany: jest.fn() },
    $transaction: jest.fn(),
  },
}))

const db = prisma as unknown as {
  experience: { findFirst: jest.Mock; update: jest.Mock }
  merchantFrame: { findMany: jest.Mock }
  $transaction: jest.Mock
}

const admin = requireAdmin as jest.Mock

describe('Merchant Experience admin routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    admin.mockResolvedValue({ ok: true, userId: 'admin-1' })
  })

  it('rejects unsafe CTA destinations before writing configuration', async () => {
    db.experience.findFirst.mockResolvedValue({ id: 'experience-1' })
    const response = await updateExperience(
      new NextRequest('http://localhost/api/admin/store/merchants/merchant-a/experiences/experience-1', {
        method: 'PUT',
        body: JSON.stringify({ primaryCtaUrl: 'javascript:alert(1)' }),
      }),
      { params: { id: 'merchant-a', experienceId: 'experience-1' } },
    )

    expect(response.status).toBe(400)
    expect(db.experience.update).not.toHaveBeenCalled()
  })

  it('writes only the allowed tenant-owned frame selection and preserves order', async () => {
    db.experience.findFirst.mockResolvedValue({ id: 'experience-1' })
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
})
