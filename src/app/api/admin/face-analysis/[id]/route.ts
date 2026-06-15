import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { del } from '@vercel/blob';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

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

    return NextResponse.json({ success: true, data: task });
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
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const task = await prisma.faceAnalysisTask.findUnique({
      where: { id: params.id },
    });

    if (!task) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    await prisma.faceAnalysisTask.delete({
      where: { id: params.id },
    });

    const urlsToDelete = task.userImageUrl ? [task.userImageUrl] : [];
    if (urlsToDelete.length > 0) {
      try {
        await del(urlsToDelete);
      } catch (blobError) {
        console.error('[Admin Face Analysis Delete] Failed to delete blob files:', blobError);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        deletedTask: params.id,
        deletedFiles: urlsToDelete.length,
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
