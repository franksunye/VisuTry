import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { list } from '@vercel/blob';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

// 获取 Blob Storage 统计信息
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

    console.log('[Admin Blob Stats] Fetching storage statistics...');

    // 获取所有 Blob 文件
    const { blobs } = await list();
    
    // 计算总大小
    const totalSize = blobs.reduce((sum, blob) => sum + blob.size, 0);
    const totalFiles = blobs.length;

    const [userUrls, itemUrls, glassesUrls, resultUrls] = await Promise.all([
      prisma.tryOnTask.findMany({
        where: { userImageUrl: { not: null } },
        select: { userImageUrl: true },
        distinct: ['userImageUrl'],
      }),
      prisma.tryOnTask.findMany({
        where: { itemImageUrl: { not: null } },
        select: { itemImageUrl: true },
        distinct: ['itemImageUrl'],
      }),
      prisma.tryOnTask.findMany({
        where: { glassesImageUrl: { not: null } },
        select: { glassesImageUrl: true },
        distinct: ['glassesImageUrl'],
      }),
      prisma.tryOnTask.findMany({
        where: { resultImageUrl: { not: null } },
        select: { resultImageUrl: true },
        distinct: ['resultImageUrl'],
      }),
    ]);

    const dbUrls = new Set<string>();
    userUrls.forEach(u => dbUrls.add(u.userImageUrl as string));
    itemUrls.forEach(i => dbUrls.add(i.itemImageUrl as string));
    glassesUrls.forEach(g => dbUrls.add(g.glassesImageUrl as string));
    resultUrls.forEach(r => dbUrls.add(r.resultImageUrl as string));

    // 找出孤立文件（在 Blob 中但不在数据库中）
    const orphanedFiles = blobs.filter(blob => !dbUrls.has(blob.url));
    const orphanedSize = orphanedFiles.reduce((sum, blob) => sum + blob.size, 0);

    // 按文件类型分组
    const filesByType: Record<string, number> = {};
    blobs.forEach(blob => {
      const ext = blob.pathname.split('.').pop()?.toLowerCase() || 'unknown';
      filesByType[ext] = (filesByType[ext] || 0) + 1;
    });

    // 按用户分组（从路径中提取用户 ID）
    const filesByUser: Record<string, number> = {};
    blobs.forEach(blob => {
      const match = blob.pathname.match(/^try-on\/([^\/]+)\//);
      if (match) {
        const userId = match[1];
        filesByUser[userId] = (filesByUser[userId] || 0) + 1;
      }
    });

    const stats = {
      totalFiles,
      totalSize,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
      orphanedFiles: orphanedFiles.length,
      orphanedSize,
      orphanedSizeMB: (orphanedSize / (1024 * 1024)).toFixed(2),
      referencedFiles: dbUrls.size,
      filesByType,
      topUsers: Object.entries(filesByUser)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([userId, count]) => ({ userId, count })),
    };

    console.log('[Admin Blob Stats] Statistics:', stats);

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('[Admin Blob Stats] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch storage statistics' },
      { status: 500 }
    );
  }
}
