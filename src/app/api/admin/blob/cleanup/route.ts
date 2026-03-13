import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { list, del } from '@vercel/blob';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

// 清理孤立文件
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { dryRun = true } = body;

    console.log(`[Admin Blob Cleanup] Starting cleanup (dryRun: ${dryRun})...`);

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
    console.log(`[Admin Blob Cleanup] Found ${allBlobs.length} total files`);

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

    console.log(`[Admin Blob Cleanup] Found ${dbUrls.size} referenced URLs in database`);

    // 找出孤立文件
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

    console.log(`[Admin Blob Cleanup] Found ${orphanedFiles.length} orphaned files (${(orphanedSize / (1024 * 1024)).toFixed(2)} MB)`);

    // 如果不是 dry run，执行删除
    let deletedCount = 0;
    if (!dryRun && orphanedFiles.length > 0) {
      const urlsToDelete = orphanedFiles.map(blob => blob.url);
      
      // 分批删除（每批 100 个）
      const batchSize = 100;
      for (let i = 0; i < urlsToDelete.length; i += batchSize) {
        const batch = urlsToDelete.slice(i, i + batchSize);
        await del(batch);
        deletedCount += batch.length;
        console.log(`[Admin Blob Cleanup] Deleted batch ${Math.floor(i / batchSize) + 1}: ${batch.length} files`);
      }

      console.log(`[Admin Blob Cleanup] Successfully deleted ${deletedCount} orphaned files`);
    }

    return NextResponse.json({
      success: true,
      data: {
        dryRun,
        orphanedFiles: orphanedFiles.length,
        orphanedSize,
        orphanedSizeMB: (orphanedSize / (1024 * 1024)).toFixed(2),
        deletedCount,
        files: orphanedFiles.map(blob => ({
          url: blob.url,
          pathname: blob.pathname,
          size: blob.size,
          uploadedAt: blob.uploadedAt,
        })),
      },
    });
  } catch (error) {
    console.error('[Admin Blob Cleanup] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cleanup orphaned files' },
      { status: 500 }
    );
  }
}
