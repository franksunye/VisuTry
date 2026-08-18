import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { type TryOnMediaKind } from '@/lib/tryon-media'
import { serveLegacyTryOnMedia } from '@/lib/tryon-media-response'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

const MEDIA_KINDS = new Set<TryOnMediaKind>(['user', 'item', 'result'])

type RouteParams = { params: { id: string; kind: string } }

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return auth.response

    if (!MEDIA_KINDS.has(params.kind as TryOnMediaKind)) {
      return NextResponse.json({ success: false, error: 'Media not found' }, { status: 404 })
    }

    const task = await prisma.tryOnTask.findFirst({
      where: { id: params.id, origin: 'CONSUMER' },
      select: {
        userImageUrl: true,
        itemImageUrl: true,
        glassesImageUrl: true,
        resultImageUrl: true,
      },
    })
    if (!task) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 })
    }

    const kind = params.kind as TryOnMediaKind
    const sourceUrl = kind === 'user'
      ? task.userImageUrl
      : kind === 'item'
        ? task.itemImageUrl || task.glassesImageUrl
        : task.resultImageUrl

    if (!sourceUrl) {
      return NextResponse.json({ success: false, error: 'Media not found' }, { status: 404 })
    }

    return await serveLegacyTryOnMedia(sourceUrl)
  } catch (error) {
    console.error('[Admin Try-On Media] Failed to serve media', error)
    return NextResponse.json({ success: false, error: 'Media unavailable' }, { status: 502 })
  }
}
