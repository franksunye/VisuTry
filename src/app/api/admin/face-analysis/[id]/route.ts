import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { adminFaceAnalysisPhotoPath } from '@/lib/face-analysis-source-photo';
import { deleteFaceAnalysisBlobFirst } from '@/lib/retention/cleanup-expired-face-analysis';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const task = await prisma.faceAnalysisTask.findUnique({
      where: { id: params.id },
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
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...task,
        userImageUrl: adminFaceAnalysisPhotoPath(task.id),
      },
    });
  } catch (error) {
    console.error('[Admin Face Analysis Detail] Error:', error);
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

    const task = await prisma.faceAnalysisTask.findUnique({
      where: { id: params.id },
    });

    if (!task) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    const deletedFiles = await deleteFaceAnalysisBlobFirst(task);

    return NextResponse.json({
      success: true,
      data: {
        deletedTask: params.id,
        deletedFiles,
      },
    });
  } catch (error) {
    console.error('[Admin Face Analysis Delete] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete task' },
      { status: 500 }
    );
  }
}
