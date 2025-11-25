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

    // 获取所有 Blob 文件
    const { blobs } = await list();
    console.log(`[Admin Blob Cleanup] Found ${blobs.length} total files`);

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

    console.log(`[Admin Blob Cleanup] Found ${dbUrls.size} referenced URLs in database`);

    // 找出孤立文件
    const orphanedFiles = blobs.filter(blob => !dbUrls.has(blob.url));
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
