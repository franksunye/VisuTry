import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { deleteTryOnBlobFirst } from '@/lib/retention/cleanup-expired-tryon-tasks';
import { adminTryOnMediaUrls } from '@/lib/tryon-media';

export const dynamic = 'force-dynamic'

function serializeAdminMetadata(
  metadata: unknown,
  media: ReturnType<typeof adminTryOnMediaUrls>,
) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return metadata

  const source = metadata as Record<string, unknown>
  const serialized: Record<string, unknown> = { ...source }

  // Never send the original provider/data URL to the browser.
  delete serialized.originalResultUrl

  if (source.uploadDiagnostics && typeof source.uploadDiagnostics === 'object' && !Array.isArray(source.uploadDiagnostics)) {
    const uploadDiagnostics = source.uploadDiagnostics as Record<string, unknown>
    serialized.uploadDiagnostics = {
      ...uploadDiagnostics,
      userImageUrl: media.userImageUrl,
      itemImageUrl: media.itemImageUrl,
    }
  }

  return serialized
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const taskId = params.id;
    const task = await prisma.tryOnTask.findFirst({
      where: { id: taskId, origin: 'CONSUMER' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    const media = adminTryOnMediaUrls(task)

    return NextResponse.json({
      success: true,
      data: {
        ...task,
        userImageUrl: media.userImageUrl,
        itemImageUrl: media.itemImageUrl,
        glassesImageUrl: media.glassesImageUrl,
        resultImageUrl: media.resultImageUrl,
        metadata: serializeAdminMetadata(task.metadata, media),
      },
    });
  } catch (error) {
    console.error('[Admin Try-On Detail] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch task details' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const taskId = params.id;
    const task = await prisma.tryOnTask.findFirst({
      where: { id: taskId, origin: 'CONSUMER' },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    console.log(`[Admin Try-On Delete] Deleting task ${taskId}...`);

    const deletedFiles = await deleteTryOnBlobFirst(task);

    console.log(`[Admin Try-On Delete] Successfully deleted task ${taskId}`);

    return NextResponse.json({
      success: true,
      data: {
        deletedTask: taskId,
        deletedFiles,
      },
    });
  } catch (error) {
    console.error('[Admin Try-On Delete] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete task' },
      { status: 500 }
    );
  }
}
