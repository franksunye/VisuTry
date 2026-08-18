import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { serveLegacyTryOnMedia } from '@/lib/tryon-media-response'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

type RouteParams = { params: { id: string } }

/**
 * Public Share capability for a completed Try-On result only.
 *
 * The opaque task id remains the existing share capability, but the browser no
 * longer receives the underlying storage URL. User/item source media are never
 * addressable through this route.
 */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const task = await prisma.tryOnTask.findUnique({
      where: { id: params.id },
      select: {
        status: true,
        resultImageUrl: true,
      },
    })

    if (!task || task.status !== 'COMPLETED' || !task.resultImageUrl) {
      return NextResponse.json({ success: false, error: 'Result not found' }, { status: 404 })
    }

    return await serveLegacyTryOnMedia(task.resultImageUrl)
  } catch (error) {
    console.error('[Try-On Share Result] Failed to serve result', error)
    return NextResponse.json({ success: false, error: 'Result unavailable' }, { status: 502 })
  }
}
