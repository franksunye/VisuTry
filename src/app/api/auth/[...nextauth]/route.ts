// IMPORTANT: Setup proxy BEFORE NextAuth
import "@/lib/proxy-setup"

import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

// CRITICAL: Force Node.js runtime (not Edge) for Prisma compatibility
// Edge Runtime requires prisma:// protocol, but we're using direct PostgreSQL connection
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
