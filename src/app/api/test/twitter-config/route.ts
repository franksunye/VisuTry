import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // 检查基本的 Twitter OAuth 配置
    const config = {
      twitter_client_id: process.env.TWITTER_CLIENT_ID ? 'SET' : 'NOT_SET',
      twitter_client_secret: process.env.TWITTER_CLIENT_SECRET ? 'SET' : 'NOT_SET',
      nextauth_url: process.env.NEXTAUTH_URL,
      nextauth_secret: process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT_SET',
      node_env: process.env.NODE_ENV,
      
      // 构建预期的回调 URL
      expected_callback_url: `${process.env.NEXTAUTH_URL}/api/auth/callback/twitter`,
      
      // 当前请求信息
      current_host: request.headers.get('host'),
      current_url: request.url,
      
      // Twitter OAuth URLs
      twitter_auth_url: `${process.env.NEXTAUTH_URL}/api/auth/signin/twitter`,
      
      // 配置状态
      config_status: {
        has_twitter_client_id: !!process.env.TWITTER_CLIENT_ID,
        has_twitter_client_secret: !!process.env.TWITTER_CLIENT_SECRET,
        has_nextauth_url: !!process.env.NEXTAUTH_URL,
        has_nextauth_secret: !!process.env.NEXTAUTH_SECRET,
        nextauth_url_is_https: process.env.NEXTAUTH_URL?.startsWith('https://'),
      }
    }

    // 检查配置完整性
    const isConfigComplete = 
      config.config_status.has_twitter_client_id &&
      config.config_status.has_twitter_client_secret &&
      config.config_status.has_nextauth_url &&
      config.config_status.has_nextauth_secret &&
      config.config_status.nextauth_url_is_https

    return NextResponse.json({
      success: true,
      config_complete: isConfigComplete,
      config,
      recommendations: isConfigComplete ? [] : [
        !config.config_status.has_twitter_client_id && "Set TWITTER_CLIENT_ID environment variable",
        !config.config_status.has_twitter_client_secret && "Set TWITTER_CLIENT_SECRET environment variable", 
        !config.config_status.has_nextauth_url && "Set NEXTAUTH_URL environment variable",
        !config.config_status.has_nextauth_secret && "Set NEXTAUTH_SECRET environment variable",
        !config.config_status.nextauth_url_is_https && "NEXTAUTH_URL must use HTTPS in production"
      ].filter(Boolean),
      twitter_app_requirements: {
        callback_url: config.expected_callback_url,
        website_url: process.env.NEXTAUTH_URL,
        app_permissions: "Read and write",
        app_type: "Web App, Automated App or Bot"
      }
    })

  } catch (error) {
    console.error("Twitter config check failed:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Config check failed",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
