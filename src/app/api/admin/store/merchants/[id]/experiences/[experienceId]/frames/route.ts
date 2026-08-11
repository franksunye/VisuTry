import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { storeErrorResponse } from '@/modules/store/application'

export const dynamic = 'force-dynamic'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; experienceId: string } },
) {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return auth.response

    const body = await request.json() as { frameIds?: unknown }
    if (!Array.isArray(body.frameIds) || body.frameIds.some((id) => typeof id !== 'string')) {
      return NextResponse.json({ success: false, error: 'frameIds must be an array of strings' }, { status: 400 })
    }
    const frameIds = [...new Set(body.frameIds)] as string[]
    const experience = await prisma.experience.findFirst({
      where: { id: params.experienceId, merchantId: params.id },
      select: { id: true },
    })
    if (!experience) return NextResponse.json({ success: false, error: 'Experience not found' }, { status: 404 })

    const frames = await prisma.merchantFrame.findMany({
      where: { merchantId: params.id, id: { in: frameIds }, status: 'ACTIVE' },
      select: { id: true },
    })
    if (frames.length !== frameIds.length) {
      return NextResponse.json({ success: false, error: 'Every selected frame must belong to this merchant and be active' }, { status: 400 })
    }

    await prisma.$transaction(async (tx) => {
      await tx.experienceFrame.deleteMany({
        where: { experienceId: params.experienceId, merchantId: params.id },
      })
      if (frameIds.length > 0) {
        await tx.experienceFrame.createMany({
          data: frameIds.map((merchantFrameId, sortOrder) => ({
            experienceId: params.experienceId,
            merchantId: params.id,
            merchantFrameId,
            sortOrder,
            active: true,
          })),
        })
      }
    })

    return NextResponse.json({ success: true, data: { frameIds } })
  } catch (error) {
    return storeErrorResponse(error)
  }
}
