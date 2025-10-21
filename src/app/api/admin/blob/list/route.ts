import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { list } from '@vercel/blob';
import { prisma } from '@/lib/prisma';

// 列出所有 Blob 文件
export async function GET(request: NextRequest) {
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

    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const prefix = searchParams.get('prefix') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const showOrphaned = searchParams.get('orphaned') === 'true';

    console.log('[Admin Blob List] Fetching files...', { prefix, limit, showOrphaned });

    // 获取所有 Blob 文件
    const { blobs } = await list({ prefix, limit });

    // 如果需要显示孤立文件，获取数据库中的 URL
    let filteredBlobs = blobs;
    if (showOrphaned) {
      const tasks = await prisma.tryOnTask.findMany({
        select: {
          userImageUrl: true,
          glassesImageUrl: true,
          resultImageUrl: true,
        },
      });

      const dbUrls = new Set<string>();
      tasks.forEach(task => {
        if (task.userImageUrl) dbUrls.add(task.userImageUrl);
        if (task.glassesImageUrl) dbUrls.add(task.glassesImageUrl);
        if (task.resultImageUrl) dbUrls.add(task.resultImageUrl);
      });

      filteredBlobs = blobs.filter(blob => !dbUrls.has(blob.url));
    }

    // 格式化文件信息
    const files = filteredBlobs.map(blob => ({
      url: blob.url,
      pathname: blob.pathname,
      size: blob.size,
      sizeMB: (blob.size / (1024 * 1024)).toFixed(2),
      uploadedAt: blob.uploadedAt,
      downloadUrl: blob.downloadUrl,
    }));

    console.log(`[Admin Blob List] Found ${files.length} files`);

    return NextResponse.json({
      success: true,
      data: {
        files,
        total: files.length,
      },
    });
  } catch (error) {
    console.error('[Admin Blob List] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to list files' },
      { status: 500 }
    );
  }
}

