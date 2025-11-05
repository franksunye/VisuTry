import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { del } from '@vercel/blob';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

// 获取 Try-On 任务详情（包含图片）
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证管理员权限
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const taskId = params.id;

    // 获取任务详情
    const task = await prisma.tryOnTask.findUnique({
      where: { id: taskId },
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

    return NextResponse.json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error('[Admin Try-On Detail] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch task details' },
      { status: 500 }
    );
  }
}

// 删除 Try-On 任务及其相关文件
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证管理员权限
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // @ts-ignore
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const taskId = params.id;

    // 获取任务详情
    const task = await prisma.tryOnTask.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    console.log(`[Admin Try-On Delete] Deleting task ${taskId}...`);

    // 收集需要删除的文件 URL
    const urlsToDelete: string[] = [];
    if (task.userImageUrl) urlsToDelete.push(task.userImageUrl);
    if (task.glassesImageUrl) urlsToDelete.push(task.glassesImageUrl);
    if (task.resultImageUrl) urlsToDelete.push(task.resultImageUrl);

    // 删除数据库记录
    await prisma.tryOnTask.delete({
      where: { id: taskId },
    });

    // 删除 Blob 文件
    if (urlsToDelete.length > 0) {
      try {
        await del(urlsToDelete);
        console.log(`[Admin Try-On Delete] Deleted ${urlsToDelete.length} files from Blob Storage`);
      } catch (blobError) {
        console.error('[Admin Try-On Delete] Failed to delete blob files:', blobError);
        // 继续执行，因为数据库记录已删除
      }
    }

    console.log(`[Admin Try-On Delete] Successfully deleted task ${taskId}`);

    return NextResponse.json({
      success: true,
      data: {
        deletedTask: taskId,
        deletedFiles: urlsToDelete.length,
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

