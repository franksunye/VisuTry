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

    // 获取所有 Blob 文件（处理分页，支持超过 1000 个文件）
    const allBlobs = [];
    let hasMore = true;
    let cursor: string | undefined;

    while (hasMore) {
      const listResponse = await list({ cursor, limit: 1000 });
      allBlobs.push(...listResponse.blobs);
      hasMore = listResponse.hasMore;
      cursor = listResponse.cursor;
    }
    
    // 计算总大小
    const totalSize = allBlobs.reduce((sum, blob) => sum + blob.size, 0);
    const totalFiles = allBlobs.length;

    const [userUrls, itemUrls, glassesUrls, resultUrls, frameUrls, userAvatarUrls] = await Promise.all([
      prisma.tryOnTask.findMany({
        select: { userImageUrl: true },
        distinct: ['userImageUrl'],
      }),
      prisma.tryOnTask.findMany({
        select: { itemImageUrl: true },
        distinct: ['itemImageUrl'],
      }),
      prisma.tryOnTask.findMany({
        select: { glassesImageUrl: true },
        distinct: ['glassesImageUrl'],
      }),
      prisma.tryOnTask.findMany({
        select: { resultImageUrl: true },
        distinct: ['resultImageUrl'],
      }),
      prisma.glassesFrame.findMany({
        select: { imageUrl: true },
        distinct: ['imageUrl'],
      }),
      prisma.user.findMany({
        select: { image: true },
        distinct: ['image'],
      }),
    ]);

    const dbUrls = new Set<string>();
    userUrls.forEach(u => { if (u.userImageUrl) dbUrls.add(u.userImageUrl); });
    itemUrls.forEach(i => { if (i.itemImageUrl) dbUrls.add(i.itemImageUrl as string); });
    glassesUrls.forEach(g => { if (g.glassesImageUrl) dbUrls.add(g.glassesImageUrl as string); });
    resultUrls.forEach(r => { if (r.resultImageUrl) dbUrls.add(r.resultImageUrl as string); });
    frameUrls.forEach(f => { if (f.imageUrl) dbUrls.add(f.imageUrl); });
    userAvatarUrls.forEach(u => { if (u.image) dbUrls.add(u.image); });

    // 找出孤立文件（在 Blob 中但不在数据库中）
    // 安全策略：
    // 1. 必须不在数据库记录中
    // 2. 上传时间必须超过 24 小时（防止竞争风险）
    const now = new Date();
    const gracePeriodHours = 24;
    const gracePeriodMs = gracePeriodHours * 60 * 60 * 1000;

    const orphanedFiles = allBlobs.filter(blob => {
      // 在数据库中被引用
      if (dbUrls.has(blob.url)) return false;

      // 还在 24 小时缓冲期内
      const uploadedAt = new Date(blob.uploadedAt);
      if (now.getTime() - uploadedAt.getTime() < gracePeriodMs) return false;

      return true;
    });
    const orphanedSize = orphanedFiles.reduce((sum, blob) => sum + blob.size, 0);

    // 按文件类型分组
    const filesByType: Record<string, number> = {};
    allBlobs.forEach(blob => {
      const ext = blob.pathname.split('.').pop()?.toLowerCase() || 'unknown';
      filesByType[ext] = (filesByType[ext] || 0) + 1;
    });

    // 按用户分组（从路径中提取用户 ID）
    const filesByUser: Record<string, number> = {};
    allBlobs.forEach(blob => {
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
