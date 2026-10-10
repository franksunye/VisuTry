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
const MAX_MULTIPART_BODY = MAX_UPLOAD + 32 * 1024

/**
 * Limit actual multipart bytes before formData() allocates/parses the payload.
 * Content-Length is only an early hint: missing or dishonest headers must not
 * allow an unbounded buffered request. This route intentionally runs on Node.
 */
async function readBoundedBrandFormData(request: NextRequest): Promise<FormData> {
  const contentType = request.headers.get('content-type')
  if (!contentType?.toLowerCase().startsWith('multipart/form-data;') || !contentType.includes('boundary=')) {
    throw new BrandKitError('INVALID_BRAND_UPLOAD', 'A multipart image upload is required.')
  }
  const declaredLength = request.headers.get('content-length')
  if (declaredLength !== null && (!/^\d+$/.test(declaredLength) || Number(declaredLength) > MAX_MULTIPART_BODY)) {
    throw new BrandKitError('INVALID_BRAND_UPLOAD', 'Upload request exceeds the 4 MB image limit.')
  }
  if (!request.body) throw new BrandKitError('INVALID_BRAND_UPLOAD', 'Upload body is missing.')

  const chunks: Buffer[] = []
  const reader = request.body.getReader()
  let total = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      total += value.byteLength
      if (total > MAX_MULTIPART_BODY) {
        await reader.cancel().catch(() => undefined)
        throw new BrandKitError('INVALID_BRAND_UPLOAD', 'Upload request exceeds the 4 MB image limit.')
      }
      chunks.push(Buffer.from(value))
    }
  } finally {
    reader.releaseLock()
  }
  try {
    return await new Request(request.url, {
      method: 'POST',
      headers: { 'content-type': contentType },
      body: Buffer.concat(chunks, total),
    }).formData()
  } catch {
    throw new BrandKitError('INVALID_BRAND_UPLOAD', 'Invalid multipart image upload.')
  }
}
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
  let uploadedKind: 'logo' | 'hero' | null = null
  let uploadedExperienceId: string | null = null
  try {
    await requireMerchantMembership({ userId: auth.userId, merchantId: params.merchantId, roles: ['OWNER'] })
    const data = await readBoundedBrandFormData(request)
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
    uploadedKind = kind
    uploadedExperienceId = kind === 'hero' ? experienceId as string : null
    const saved = await put(path, Buffer.from(bytes), { access: 'public', contentType: image.mime, addRandomSuffix: false })
    createdUrl = saved.url
    normalizeBrandMediaUrl(saved.url, params.merchantId, kind, kind === 'hero' ? experienceId as string : undefined)
    const result = kind === 'logo'
      ? await updateMerchantBrand({ userId: auth.userId, merchantId: params.merchantId, logoUrl: saved.url, approvedLiveChange })
      : await updateMerchantExperienceHero({ userId: auth.userId, merchantId: params.merchantId, experienceId: experienceId as string, heroAssetUrl: saved.url, approvedLiveChange })
    return NextResponse.json({ success: true, data: { url: saved.url, width: image.width, height: image.height, result } }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    if (createdUrl && uploadedKind) {
      // An invalidation failure can happen AFTER the database transaction commits.
      // Deleting a persisted image in that case would break the public experience.
      // Delete only if a tenant-bound DB read proves the new URL was NOT attached.
      let attached: boolean | null = null
      try {
        if (uploadedKind === 'logo') {
          const current = await prisma.merchant.findUnique({
            where: { id: params.merchantId }, select: { logoUrl: true },
          })
          attached = current?.logoUrl === createdUrl
        } else if (uploadedExperienceId) {
          const current = await prisma.experience.findFirst({
            where: { id: uploadedExperienceId, merchantId: params.merchantId, type: { in: ['STORE', 'CAMPAIGN'] } },
            select: { heroAssetUrl: true },
          })
          attached = current?.heroAssetUrl === createdUrl
        }
      } catch (readbackError) {
        // A failed readback is UNKNOWN, not evidence that the write rolled back.
        console.error('Merchant brand post-upload persistence readback failed', readbackError)
      }
      if (attached === false) {
        try { await del(createdUrl) } catch (cleanupError) {
          console.error('Merchant brand upload compensation failed', cleanupError)
        }
      } else {
        console.error('Merchant brand upload persisted/uncertain; preserving Blob after post-upload failure', error)
        return NextResponse.json({
          success: false,
          error: attached ? 'BRAND_CACHE_REFRESH_UNCONFIRMED' : 'BRAND_PERSISTENCE_UNCONFIRMED',
          message: attached
            ? 'Image saved, but the public refresh did not complete. Verify the shopper page before retrying.'
            : 'Image persistence could not be verified. Contact support before retrying.',
          persisted: attached === true,
        }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
      }
    }
    return errorResponse(error)
  }
}
