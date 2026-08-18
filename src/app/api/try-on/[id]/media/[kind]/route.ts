import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { serveLegacyTryOnMedia, type TryOnMediaKind } from '@/lib/tryon-media'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

const MEDIA_KINDS = new Set<TryOnMediaKind>(['user', 'item', 'result'])

type RouteParams = { params: { id: string; kind: string } }

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response

    if (!MEDIA_KINDS.has(params.kind as TryOnMediaKind)) {
      return NextResponse.json({ success: false, error: 'Media not found' }, { status: 404 })
    }

    const task = await prisma.tryOnTask.findUnique({
      where: { id: params.id },
      select: {
        userId: true,
        userImageUrl: true,
        itemImageUrl: true,
        glassesImageUrl: true,
        resultImageUrl: true,
      },
    })

    if (!task) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 })
    }
    if (task.userId !== auth.userId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
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

    // Step 2A deliberately keeps storage public. The application-owned media route
    // establishes auth/ownership and DTO boundaries before any storage-access change.
    return await serveLegacyTryOnMedia(sourceUrl)
  } catch (error) {
    console.error('[Try-On Media] Failed to serve media', error)
    return NextResponse.json({ success: false, error: 'Media unavailable' }, { status: 502 })
  }
}
