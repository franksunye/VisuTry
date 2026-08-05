import { NextRequest, NextResponse } from 'next/server'
import { storeApiError } from '@/modules/store/contracts'
import {
  assertStorePhotoUploadAllowed,
  clientIpFromRequest,
  createStoreRuntime,
  storeErrorResponse,
  uploadShopperPhoto,
} from '@/modules/store/application'
import {
  computeStoreAssetExpiresAt,
  readStoreCapabilityToken,
} from '@/modules/store/infrastructure'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('photo')
    const merchantSlug = formData.get('merchantSlug')
    const merchantSessionId = formData.get('merchantSessionId')
    const locale = formData.get('locale')
    const deviceType = formData.get('deviceType')

    if (!(file instanceof File)) {
      return NextResponse.json(
        storeApiError('VALIDATION_ERROR', 'Photo file is required'),
        { status: 400 },
      )
    }
    if (typeof merchantSlug !== 'string' || !merchantSlug.trim()) {
      return NextResponse.json(
        storeApiError('VALIDATION_ERROR', 'merchantSlug is required'),
        { status: 400 },
      )
    }
    if (typeof merchantSessionId !== 'string' || !merchantSessionId.trim()) {
      return NextResponse.json(
        storeApiError('VALIDATION_ERROR', 'merchantSessionId is required'),
        { status: 400 },
      )
    }

    const runtime = createStoreRuntime()
    const merchant = await runtime.merchants.findBySlug(merchantSlug.trim())
    if (merchant) {
      await assertStorePhotoUploadAllowed({
        merchantId: merchant.id,
        ip: clientIpFromRequest(request.headers),
        byteSize: file.size,
      })
    }

    const result = await uploadShopperPhoto({
      merchants: runtime.merchants,
      sessions: runtime.sessions,
      events: runtime.events,
      assets: runtime.assets,
      slug: merchantSlug.trim(),
      merchantSessionId: merchantSessionId.trim(),
      capabilityToken: readStoreCapabilityToken(request),
      file,
      locale: typeof locale === 'string' ? locale : null,
      deviceType: typeof deviceType === 'string' ? deviceType : null,
      assetExpiresAt: computeStoreAssetExpiresAt(),
    })

    return NextResponse.json({
      success: true,
      data: {
        merchantSessionId: result.merchantSessionId,
        photoAssetId: result.photoAssetId,
        previewUrl: result.previewUrl,
      },
    })
  } catch (error) {
    return storeErrorResponse(error)
  }
}
