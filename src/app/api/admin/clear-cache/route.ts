import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'

export async function POST(request: NextRequest) {
  try {
    // 清除所有用户相关的缓存
    revalidateTag('tryon')
    
    // 也可以清除特定用户的缓存
    const { userId } = await request.json().catch(() => ({}))
    
    if (userId) {
      revalidateTag(`user-${userId}`)
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Cache cleared successfully',
      clearedTags: userId ? ['tryon', `user-${userId}`] : ['tryon']
    })
  } catch (error) {
    console.error('Error clearing cache:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to clear cache' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // 清除所有try-on相关的缓存
    revalidateTag('tryon')
    
    return NextResponse.json({ 
      success: true, 
      message: 'All try-on cache cleared successfully' 
    })
  } catch (error) {
    console.error('Error clearing cache:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to clear cache' },
      { status: 500 }
    )
  }
}
