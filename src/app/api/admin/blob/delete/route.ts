import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { del } from '@vercel/blob';

// 删除 Blob 文件
export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const { urls } = body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid request - urls array required' },
        { status: 400 }
      );
    }

    // 限制批量删除数量
    if (urls.length > 100) {
      return NextResponse.json(
        { success: false, error: 'Too many files - maximum 100 files per request' },
        { status: 400 }
      );
    }

    console.log(`[Admin Blob Delete] Deleting ${urls.length} files...`);

    // 删除文件
    await del(urls);

    console.log(`[Admin Blob Delete] Successfully deleted ${urls.length} files`);

    return NextResponse.json({
      success: true,
      data: {
        deleted: urls.length,
      },
    });
  } catch (error) {
    console.error('[Admin Blob Delete] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete files' },
      { status: 500 }
    );
  }
}

