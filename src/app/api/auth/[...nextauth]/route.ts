// IMPORTANT: Setup proxy BEFORE NextAuth
import "@/lib/proxy-setup"

import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"
import { logger } from "@/lib/logger"

// CRITICAL: Force Node.js runtime (not Edge) for Prisma compatibility
// Edge Runtime requires prisma:// protocol, but we're using direct PostgreSQL connection
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const handler = NextAuth(authOptions)

type RouteContext = {
  params: {
    nextauth: string[]
  }
}

export async function GET(request: Request, context: RouteContext) {
  const { pathname, searchParams } = new URL(request.url)

  if (pathname.endsWith("/api/auth/signin/auth0")) {
    logger.info("auth", "OAuth sign-in request started", {
      provider: "auth0",
      entryMethod: "direct_auth_url",
      hasCallbackUrl: searchParams.has("callbackUrl"),
      callbackUrl: searchParams.get("callbackUrl") || null,
      path: pathname,
    })
  }

  return handler(request, context)
}

export async function POST(request: Request, context: RouteContext) {
  return handler(request, context)
}
