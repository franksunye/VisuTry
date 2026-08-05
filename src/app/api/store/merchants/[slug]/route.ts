import { NextRequest, NextResponse } from 'next/server'
import { createStoreRuntime, getPublicMerchantProfile, storeErrorResponse } from '@/modules/store/application'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } },
) {
  try {
    const runtime = createStoreRuntime()
    const profile = await getPublicMerchantProfile({
      merchants: runtime.merchants,
      frames: runtime.frames,
      slug: params.slug,
    })

    return NextResponse.json({
      success: true,
      data: profile,
    })
  } catch (error) {
    return storeErrorResponse(error)
  }
}
