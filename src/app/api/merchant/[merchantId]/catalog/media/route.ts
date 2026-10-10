import { randomUUID } from 'node:crypto'
import { list, put } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth-runtime'
import { requireMerchantMembership } from '@/modules/merchant/application/merchant-access'
import { inspectBrandImage, BrandKitError } from '@/modules/merchant/domain/merchant-brand-kit'
import {
  MerchantCatalogMediaError, PRODUCT_IMAGE_MAX_BYTES, PRODUCT_IMAGE_MAX_DAILY_UPLOADS,
  catalogProductMediaPrefix, requireOwnedCatalogProductMediaUrl,
} from '@/modules/merchant/domain/merchant-catalog-media'
import { merchantAgentErrorResponse } from '@/modules/merchant/application/merchant-agent-http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
const MAX_MULTIPART_BODY = PRODUCT_IMAGE_MAX_BYTES + 32 * 1024

async function boundedMultipart(request: NextRequest): Promise<FormData> {
  const invalid = () => new MerchantCatalogMediaError('INVALID_PRODUCT_IMAGE', 'Upload a PNG, JPEG or WebP image up to 4 MB.')
  const contentType = request.headers.get('content-type')
  if (!contentType?.toLowerCase().startsWith('multipart/form-data;') || !contentType.includes('boundary=')) throw invalid()
  const declared = request.headers.get('content-length')
  if (declared != null && (!/^\d+$/.test(declared) || Number(declared) > MAX_MULTIPART_BODY)) throw invalid()
  if (!request.body) throw invalid()
  const reader = request.body.getReader()
  const chunks: Buffer[] = []
  let total = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      total += value.byteLength
      if (total > MAX_MULTIPART_BODY) { await reader.cancel().catch(() => undefined); throw invalid() }
      chunks.push(Buffer.from(value))
    }
  } finally { reader.releaseLock() }
  try {
    return await new Request(request.url, {
      method: 'POST', headers: { 'content-type': contentType },
      body: Buffer.concat(chunks, total),
    }).formData()
  } catch { throw invalid() }
}

/** Explicit owner/admin staging. Catalog itself is never written until approval. */
export async function POST(request: NextRequest, { params }: { params: { merchantId: string } }) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  try {
    await requireMerchantMembership({ userId: auth.userId, merchantId: params.merchantId, roles: ['OWNER', 'ADMIN'] })
    const site = request.headers.get('sec-fetch-site')
    if (site && site !== 'same-origin' && site !== 'none') {
      return NextResponse.json({ success: false, error: 'FORBIDDEN_ORIGIN' }, { status: 403 })
    }
    const prefix = catalogProductMediaPrefix(params.merchantId)
    const form = await boundedMultipart(request)
    const file = form.get('file')
    if (!(file instanceof File) || file.size < 30 || file.size > PRODUCT_IMAGE_MAX_BYTES) {
      throw new MerchantCatalogMediaError('INVALID_PRODUCT_IMAGE', 'Choose a valid product image up to 4 MB.')
    }
    let image: { mime: string; width: number; height: number }
    const bytes = new Uint8Array(await file.arrayBuffer())
    try { image = inspectBrandImage(bytes, file.type, 'product') }
    catch (error) {
      if (error instanceof BrandKitError) throw new MerchantCatalogMediaError('INVALID_PRODUCT_IMAGE', error.message)
      throw error
    }
    // Best-effort daily Blob cost bound, without claiming atomic concurrency enforcement.
    const blobs = await list({ prefix, limit: 1000 })
    if (blobs.hasMore || blobs.blobs.filter((blob) =>
      new Date(blob.uploadedAt).getTime() >= Date.now() - 86400000).length >= PRODUCT_IMAGE_MAX_DAILY_UPLOADS) {
      throw new MerchantCatalogMediaError('PRODUCT_MEDIA_LIMIT', 'Daily product-image upload limit reached. Try tomorrow.', 429)
    }
    const ext = image.mime === 'image/png' ? 'png' : image.mime === 'image/jpeg' ? 'jpg' : 'webp'
    const path = prefix + randomUUID().replace(/-/g, '') + '.' + ext
    const uploaded = await put(path, Buffer.from(bytes), { access: 'public', contentType: image.mime, addRandomSuffix: false })
    const ownedUrl = requireOwnedCatalogProductMediaUrl(uploaded.url, params.merchantId)
    return NextResponse.json({
      success: true, data: { url: ownedUrl, width: image.width, height: image.height },
    }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    if (error instanceof MerchantCatalogMediaError) {
      return NextResponse.json({ success: false, error: error.code, message: error.message }, {
        status: error.httpStatus, headers: { 'Cache-Control': 'no-store' },
      })
    }
    return merchantAgentErrorResponse(error)
  }
}
