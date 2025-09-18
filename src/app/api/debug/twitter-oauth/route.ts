import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // 检查环境变量
    const envCheck = {
      TWITTER_CLIENT_ID: process.env.TWITTER_CLIENT_ID ? 'SET' : 'NOT_SET',
      TWITTER_CLIENT_SECRET: process.env.TWITTER_CLIENT_SECRET ? 'SET' : 'NOT_SET',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT_SET',
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
      VERCEL_URL: process.env.VERCEL_URL,
    }

    // 构建预期的 URLs
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const expectedUrls = {
      callback_url: `${baseUrl}/api/auth/callback/twitter`,
      signin_url: `${baseUrl}/api/auth/signin/twitter`,
      signout_url: `${baseUrl}/api/auth/signout`,
      session_url: `${baseUrl}/api/auth/session`,
    }

    // 检查配置完整性
    const configIssues = []
    if (!process.env.TWITTER_CLIENT_ID) configIssues.push("TWITTER_CLIENT_ID not set")
    if (!process.env.TWITTER_CLIENT_SECRET) configIssues.push("TWITTER_CLIENT_SECRET not set")
    if (!process.env.NEXTAUTH_URL) configIssues.push("NEXTAUTH_URL not set")
    if (!process.env.NEXTAUTH_SECRET) configIssues.push("NEXTAUTH_SECRET not set")
    if (process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.startsWith('https://') && process.env.NODE_ENV === 'production') {
      configIssues.push("NEXTAUTH_URL must use HTTPS in production")
    }

    // Twitter 应用配置要求
    const twitterAppRequirements = {
      app_type: "Web App, Automated App or Bot",
      app_permissions: "Read and write",
      callback_urls: [expectedUrls.callback_url],
      website_url: baseUrl,
      terms_of_service: `${baseUrl}/terms`,
      privacy_policy: `${baseUrl}/privacy`,
    }

    // 常见问题诊断
    const commonIssues = [
      {
        issue: "Callback URL mismatch",
        description: "Twitter app callback URL doesn't match NextAuth callback URL",
        solution: `Set Twitter app callback URL to: ${expectedUrls.callback_url}`,
      },
      {
        issue: "App permissions insufficient",
        description: "Twitter app doesn't have read/write permissions",
        solution: "Set Twitter app permissions to 'Read and write'",
      },
      {
        issue: "Environment variables not synced",
        description: "Vercel environment variables don't match local .env",
        solution: "Update Vercel environment variables and redeploy",
      },
      {
        issue: "HTTPS requirement",
        description: "Production environment requires HTTPS URLs",
        solution: "Ensure NEXTAUTH_URL uses https:// in production",
      },
    ]

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: envCheck,
      urls: expectedUrls,
      config_issues: configIssues,
      config_complete: configIssues.length === 0,
      twitter_app_requirements: twitterAppRequirements,
      common_issues: commonIssues,
      next_steps: configIssues.length === 0 ? [
        "Test Twitter OAuth login",
        "Check browser network tab for errors",
        "Monitor server logs during login attempt"
      ] : [
        "Fix configuration issues listed above",
        "Update Vercel environment variables",
        "Redeploy application",
        "Test again"
      ]
    })

  } catch (error) {
    console.error("Twitter OAuth debug failed:", error)
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
