import { NextRequest, NextResponse } from 'next/server'
import { createStoreRuntime, getPublicMerchantProfile, storeErrorResponse } from '@/modules/store/application'

export const dynamic = 'force-dynamic'
const PUBLIC_MERCHANT_CACHE_CONTROL = 'public, max-age=0, s-maxage=300, stale-while-revalidate=60'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } },
) {
  try {
    const runtime = createStoreRuntime()
    const experienceSlug = request.nextUrl.searchParams.get('experienceSlug')
    const profile = await getPublicMerchantProfile({
      merchants: runtime.merchants,
      frames: runtime.frames,
      experiences: runtime.experiences,
      slug: params.slug,
      experienceSlug,
    })

    return NextResponse.json({
      success: true,
      data: profile,
    }, {
      headers: { 'Cache-Control': PUBLIC_MERCHANT_CACHE_CONTROL },
    })
  } catch (error) {
    return storeErrorResponse(error)
  }
}
