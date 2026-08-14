import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { storeErrorResponse, updateCampaign, updatePublicExperience } from '@/modules/store/application'
import type { CampaignGate, CampaignObjective } from '@/modules/store/domain/campaign-policy'
import type { PresentationMode } from '@/modules/store/domain/presentation-mode'

export const dynamic = 'force-dynamic'

const EXPERIENCE_STATUSES = ['DRAFT', 'ACTIVE', 'ENDED', 'ARCHIVED'] as const
type ExperienceStatus = (typeof EXPERIENCE_STATUSES)[number]

function optionalDate(value: unknown): Date | null | undefined {
  if (value === undefined) return undefined
  if (value === null || value === '') return null
  if (typeof value !== 'string') throw new Error('Date fields must be ISO strings or null')
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) throw new Error('Invalid date field')
  return date
}

function isSafeCtaUrl(value: string) {
  if (/\s|[\u0000-\u001f\u007f]/u.test(value)) return false

  if (value.startsWith('/') && !value.startsWith('//')) {
    try {
      const parsed = new URL(value, 'https://visutry.internal')
      return parsed.origin === 'https://visutry.internal'
    } catch {
      return false
    }
  }

  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string; experienceId: string } },
) {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return auth.response

    const experience = await prisma.experience.findFirst({
      where: { id: params.experienceId, merchantId: params.id },
      include: {
        frames: {
          where: { active: true },
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
          include: { merchantFrame: true },
        },
      },
    })
    if (!experience) return NextResponse.json({ success: false, error: 'Experience not found' }, { status: 404 })

    const catalog = await prisma.merchantFrame.findMany({
      where: { merchantId: params.id, status: 'ACTIVE' },
      orderBy: [{ name: 'asc' }, { createdAt: 'asc' }],
    })
    return NextResponse.json({ success: true, data: { experience, catalog } })
  } catch (error) {
    return storeErrorResponse(error)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; experienceId: string } },
) {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return auth.response

    const body = await request.json() as Record<string, unknown>
    const existing = await prisma.experience.findFirst({
      where: { id: params.experienceId, merchantId: params.id },
      select: { id: true, slug: true, type: true, merchant: { select: { slug: true } } },
    })
    if (!existing) return NextResponse.json({ success: false, error: 'Experience not found' }, { status: 404 })

    if (existing.type === 'CAMPAIGN' && !('status' in body)) {
      const updated = await updateCampaign({
        merchantId: params.id,
        campaignId: params.experienceId,
        ...(typeof body.name === 'string' ? { name: body.name } : {}),
        ...(body.headline === null || typeof body.headline === 'string' ? { headline: body.headline as string | null } : {}),
        ...(body.description === null || typeof body.description === 'string' ? { description: body.description as string | null } : {}),
        ...(typeof body.campaignObjective === 'string' ? { objective: body.campaignObjective as CampaignObjective } : {}),
        ...(typeof body.campaignGate === 'string' ? { gate: body.campaignGate as CampaignGate } : {}),
        ...(typeof body.presentationMode === 'string' ? { presentationMode: body.presentationMode as PresentationMode } : {}),
        ...(body.startAt === null || typeof body.startAt === 'string' ? { startAt: body.startAt as string | null } : {}),
        ...(body.endAt === null || typeof body.endAt === 'string' ? { endAt: body.endAt as string | null } : {}),
        ...(body.primaryCtaType === null || typeof body.primaryCtaType === 'string' ? { primaryCtaType: body.primaryCtaType as string | null } : {}),
        ...(body.primaryCtaLabel === null || typeof body.primaryCtaLabel === 'string' ? { primaryCtaLabel: body.primaryCtaLabel as string | null } : {}),
        ...(body.primaryCtaUrl === null || typeof body.primaryCtaUrl === 'string' ? { primaryCtaUrl: body.primaryCtaUrl as string | null } : {}),
        ...(body.secondaryCtaType === null || typeof body.secondaryCtaType === 'string' ? { secondaryCtaType: body.secondaryCtaType as string | null } : {}),
        ...(body.secondaryCtaLabel === null || typeof body.secondaryCtaLabel === 'string' ? { secondaryCtaLabel: body.secondaryCtaLabel as string | null } : {}),
        ...(body.secondaryCtaUrl === null || typeof body.secondaryCtaUrl === 'string' ? { secondaryCtaUrl: body.secondaryCtaUrl as string | null } : {}),
      })
      return NextResponse.json({ success: true, data: updated })
    }

    const data: Record<string, unknown> = {}
    for (const field of ['name', 'headline', 'description', 'primaryCtaLabel', 'primaryCtaUrl', 'offerLabel', 'offerCode']) {
      if (field in body) {
        const value = body[field]
        if (value !== null && typeof value !== 'string') {
          return NextResponse.json({ success: false, error: `${field} must be a string or null` }, { status: 400 })
        }
        if (field === 'name' && typeof value === 'string' && value.trim().length === 0) {
          return NextResponse.json({ success: false, error: 'name is required' }, { status: 400 })
        }
        if (field === 'primaryCtaUrl' && typeof value === 'string' && value.trim() && !isSafeCtaUrl(value.trim())) {
          return NextResponse.json({ success: false, error: 'primaryCtaUrl must be an https URL or an internal path' }, { status: 400 })
        }
        data[field] = typeof value === 'string' ? value.trim() : value
      }
    }
    if ('status' in body) {
      if (typeof body.status !== 'string' || !EXPERIENCE_STATUSES.includes(body.status as ExperienceStatus)) {
        return NextResponse.json({ success: false, error: 'Invalid experience status' }, { status: 400 })
      }
      data.status = body.status
    }
    for (const field of ['startAt', 'endAt']) {
      if (field in body) {
        try {
          data[field] = optionalDate(body[field])
        } catch (error) {
          return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Invalid date field' }, { status: 400 })
        }
      }
    }

    const experience = await updatePublicExperience({
      merchantId: params.id,
      experienceId: params.experienceId,
      data,
    })
    return NextResponse.json({ success: true, data: experience })
  } catch (error) {
    return storeErrorResponse(error)
  }
}
