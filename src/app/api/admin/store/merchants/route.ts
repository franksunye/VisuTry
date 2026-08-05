import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-auth'
import { createStoreRuntime, storeErrorResponse } from '@/modules/store/application'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return auth.response

    const runtime = createStoreRuntime()
    const merchants = await runtime.merchants.listAllAdmin(100)

    return NextResponse.json({
      success: true,
      data: {
        merchants: merchants.map((m) => ({
          id: m.id,
          slug: m.slug,
          name: m.name,
          status: m.status,
          updatedAt: m.updatedAt.toISOString(),
        })),
      },
    })
  } catch (error) {
    return storeErrorResponse(error)
  }
}
