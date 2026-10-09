import { randomUUID } from 'node:crypto'
import { put, del } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth-runtime'
import { requireMerchantMembership } from '@/modules/merchant/application/merchant-access'
import { getMerchantBrandWorkspace, updateMerchantBrand, updateMerchantExperienceHero } from '@/modules/merchant/application/merchant-brand-kit'
import { prisma } from '@/lib/prisma'
import { BrandKitError, brandMediaPath, inspectBrandImage, normalizeBrandMediaUrl } from '@/modules/merchant/domain/merchant-brand-kit'
import { merchantAgentErrorResponse } from '@/modules/merchant/application/merchant-agent-http'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
const MAX_UPLOAD = 4 * 1024 * 1024
type Context = { params: { merchantId: string } }
const errorResponse = (error: unknown) => error instanceof BrandKitError
  ? NextResponse.json({ success: false, error: error.code, message: error.message }, { status: error.httpStatus })
  : merchantAgentErrorResponse(error)

/**
 * Upload AND apply an approved merchant brand asset in one authorized action.
 * No arbitrary remote URL fetching; no SVG/HTML; reject spoofed MIME/dimensions.
 */
export async function POST(request: NextRequest, { params }: Context) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  let createdUrl: string | null = null
  try {
    await requireMerchantMembership({ userId: auth.userId, merchantId: params.merchantId, roles: ['OWNER'] })
    const contentLength = Number(request.headers.get('content-length') ?? 0)
    if (contentLength > MAX_UPLOAD + 32_768) throw new BrandKitError('INVALID_BRAND_UPLOAD', 'Image exceeds 4 MB.')
    const data = await request.formData()
    const file = data.get('file')
    const kind = data.get('kind')
    const experienceId = data.get('experienceId')
    const approvedLiveChange = data.get('approvedLiveChange') === 'true'
    if (!(file instanceof File) || (kind !== 'logo' && kind !== 'hero') || file.size > MAX_UPLOAD
      || (kind === 'hero' && (typeof experienceId !== 'string' || !experienceId))) {
      throw new BrandKitError('INVALID_BRAND_UPLOAD', 'Provide a valid logo or hero image up to 4 MB.')
    }
    if (kind === 'logo') {
      const profile = await getMerchantBrandWorkspace(params.merchantId)
      if (profile.liveExperiences && !approvedLiveChange) throw new BrandKitError('LIVE_CHANGE_CONFIRMATION_REQUIRED', 'Confirm the impact on live Store and Campaign pages.', 409)
    } else {
      const row = await prisma.experience.findFirst({
        where: { id: experienceId as string, merchantId: params.merchantId, type: { in: ['STORE','CAMPAIGN'] } },
        select: { status: true },
      })
      if (!row || !['DRAFT','ACTIVE'].includes(row.status)) throw new BrandKitError('EXPERIENCE_NOT_FOUND', 'Editable Experience not found.', 404)
      if (row.status === 'ACTIVE' && !approvedLiveChange) throw new BrandKitError('LIVE_CHANGE_CONFIRMATION_REQUIRED', 'Confirm live Experience impact.', 409)
    }
    const bytes = new Uint8Array(await file.arrayBuffer())
    const image = inspectBrandImage(bytes, file.type, kind)
    const ext = image.mime === 'image/jpeg' ? 'jpg' : image.mime === 'image/png' ? 'png' : 'webp'
    const path = `${brandMediaPath(params.merchantId, kind, kind === 'hero' ? experienceId as string : undefined)}${randomUUID().replace(/-/g, '')}.${ext}`
    const saved = await put(path, Buffer.from(bytes), { access: 'public', contentType: image.mime, addRandomSuffix: false })
    createdUrl = saved.url
    normalizeBrandMediaUrl(saved.url, params.merchantId, kind, kind === 'hero' ? experienceId as string : undefined)
    const result = kind === 'logo'
      ? await updateMerchantBrand({ userId: auth.userId, merchantId: params.merchantId, logoUrl: saved.url, approvedLiveChange })
      : await updateMerchantExperienceHero({ userId: auth.userId, merchantId: params.merchantId, experienceId: experienceId as string, heroAssetUrl: saved.url, approvedLiveChange })
    return NextResponse.json({ success: true, data: { url: saved.url, width: image.width, height: image.height, result } }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    // A failed DB attach must not leak an orphaned *new* versioned blob.
    if (createdUrl) {
      try { await del(createdUrl) } catch (cleanupError) {
        console.error('Merchant brand upload compensation failed', cleanupError)
      }
    }
    return errorResponse(error)
  }
}
