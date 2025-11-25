import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { list } from '@vercel/blob';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

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

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const prefix = searchParams.get('prefix') || undefined;
    const showOrphaned = searchParams.get('orphaned') === 'true';
    const search = searchParams.get('search') || '';
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
    const itemsPerPage = 50;

    console.log('[Admin Blob List] Fetching files...', { prefix, showOrphaned, search, page });

    // 获取所有 Blob 文件
    const { blobs } = await list({ prefix });

    // 如果需要显示孤立文件，获取数据库中的 URL
    let filteredBlobs = blobs;
    if (showOrphaned) {
      const [userUrls, itemUrls, glassesUrls, resultUrls] = await Promise.all([
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
      ]);

      const dbUrls = new Set<string>();
      userUrls.forEach(u => { if (u.userImageUrl) dbUrls.add(u.userImageUrl); });
      itemUrls.forEach(i => { if (i.itemImageUrl) dbUrls.add(i.itemImageUrl as string); });
      glassesUrls.forEach(g => { if (g.glassesImageUrl) dbUrls.add(g.glassesImageUrl as string); });
      resultUrls.forEach(r => { if (r.resultImageUrl) dbUrls.add(r.resultImageUrl as string); });

      filteredBlobs = blobs.filter(blob => !dbUrls.has(blob.url));
    }

    // 搜索过滤
    if (search) {
      filteredBlobs = filteredBlobs.filter(blob =>
        blob.pathname.toLowerCase().includes(search.toLowerCase()) ||
        blob.url.toLowerCase().includes(search.toLowerCase())
      );
    }

    // 计算分页
    const totalFiles = filteredBlobs.length;
    const totalPages = Math.ceil(totalFiles / itemsPerPage);
    const currentPage = Math.max(1, Math.min(page, totalPages || 1));
    const offset = (currentPage - 1) * itemsPerPage;

    // 获取当前页的文件
    const paginatedBlobs = filteredBlobs.slice(offset, offset + itemsPerPage);

    // 格式化文件信息
    const files = paginatedBlobs.map(blob => ({
      url: blob.url,
      pathname: blob.pathname,
      size: blob.size,
      sizeMB: (blob.size / (1024 * 1024)).toFixed(2),
      uploadedAt: blob.uploadedAt,
      downloadUrl: blob.downloadUrl,
    }));

    console.log(`[Admin Blob List] Found ${totalFiles} files, showing page ${currentPage}/${totalPages}`);

    return NextResponse.json({
      success: true,
      data: {
        files,
        total: totalFiles,
        currentPage,
        totalPages,
        itemsPerPage,
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
