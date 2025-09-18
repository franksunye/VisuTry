import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // 只在开发环境或特定条件下提供调试信息
    const isDev = process.env.NODE_ENV === 'development'
    const debugKey = request.nextUrl.searchParams.get('key')
    
    if (!isDev && debugKey !== 'debug-2025') {
      return NextResponse.json(
        { error: "Debug endpoint not available" },
        { status: 403 }
      )
    }

    const authConfig = {
      nextauth_url: process.env.NEXTAUTH_URL,
      nextauth_secret: process.env.NEXTAUTH_SECRET ? '***configured***' : 'NOT_SET',
      twitter_client_id: process.env.TWITTER_CLIENT_ID ? '***configured***' : 'NOT_SET',
      twitter_client_secret: process.env.TWITTER_CLIENT_SECRET ? '***configured***' : 'NOT_SET',
      node_env: process.env.NODE_ENV,
      vercel_url: process.env.VERCEL_URL,
      vercel_env: process.env.VERCEL_ENV,
      host: request.headers.get('host'),
      origin: request.headers.get('origin'),
      referer: request.headers.get('referer'),
      user_agent: request.headers.get('user-agent'),
      expected_callback_url: `${process.env.NEXTAUTH_URL}/api/auth/callback/twitter`,
      current_url: request.url,
    }

    return NextResponse.json({
      success: true,
      config: authConfig,
      timestamp: new Date().toISOString(),
      message: "Auth configuration debug info"
    })

  } catch (error) {
    console.error("Debug auth config failed:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Debug failed",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
