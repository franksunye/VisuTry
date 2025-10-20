// IMPORTANT: Setup proxy BEFORE any other imports that make network requests
import "./proxy-setup"

import { NextAuthOptions } from "next-auth"
import TwitterProvider from "next-auth/providers/twitter"
import Auth0Provider from "next-auth/providers/auth0"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import { MockCredentialsProvider, isMockMode } from "@/lib/mocks/auth"
import { log } from "@/lib/logger"
import { perfLogger } from "@/lib/performance-logger"
import { clearUserCache } from "@/lib/cache"
import { QUOTA_CONFIG } from "@/config/pricing"

// Lightweight debug sink to file for local dev (so we can read errors without terminal access)
const __debugWrite = (label: string, data: any) => {
  if (process.env.NODE_ENV !== 'development') return
  try {
    const fs = require('fs') as typeof import('fs')
    const line = JSON.stringify({ ts: new Date().toISOString(), label, data }) + "\n"
    fs.mkdirSync('tmp', { recursive: true })
    fs.appendFileSync('tmp/nextauth-debug.log', line, 'utf8')
  } catch {}
}

// Validate critical environment variables at startup
const validateEnvVars = () => {
  const required = ['NEXTAUTH_SECRET']
  const missing = required.filter(key => !process.env[key])

  // At least one provider must be configured
  const hasTwitter = process.env.TWITTER_CLIENT_ID && process.env.TWITTER_CLIENT_SECRET
  const hasAuth0 = process.env.AUTH0_ID && process.env.AUTH0_SECRET && process.env.AUTH0_ISSUER_BASE_URL

  if (!hasTwitter && !hasAuth0) {
    console.error('❌ At least one OAuth provider must be configured (Twitter or Auth0)')
    throw new Error('No OAuth providers configured')
  }

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing)
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }

  // Log environment info (without sensitive data)
  console.log('✅ NextAuth Environment Check:')
  console.log('  - NODE_ENV:', process.env.NODE_ENV)
  console.log('  - NEXTAUTH_URL:', process.env.NEXTAUTH_URL || '(not set - will use default)')
  console.log('  - VERCEL:', process.env.VERCEL ? 'Yes' : 'No')
  console.log('  - VERCEL_URL:', process.env.VERCEL_URL || '(not set)')
  console.log('  - Database:', process.env.DATABASE_URL ? 'Configured' : 'Missing')
  console.log('  - Twitter OAuth:', hasTwitter ? 'Configured' : 'Not configured')
  console.log('  - Auth0:', hasAuth0 ? 'Configured' : 'Not configured')
}

// Run validation (only once at module load)
if (!isMockMode) {
  try {
    validateEnvVars()
  } catch (error) {
    console.error('Environment validation failed:', error)
  }
}

export const authOptions: NextAuthOptions = {
  // Use Prisma Adapter to ensure users are automatically created in database
  // In Vercel production environment, ensure adapter is properly initialized
  adapter: isMockMode ? undefined : PrismaAdapter(prisma),

  providers: [
    ...(isMockMode ? [MockCredentialsProvider] : []),
    // Twitter OAuth 2.0
    ...(process.env.TWITTER_CLIENT_ID && process.env.TWITTER_CLIENT_SECRET ? [
      TwitterProvider({
        clientId: process.env.TWITTER_CLIENT_ID,
        clientSecret: process.env.TWITTER_CLIENT_SECRET,
        version: "2.0",
        authorization: {
          params: {
            scope: "tweet.read users.read offline.access",
          },
        },
      }),
    ] : []),
    // Auth0 OAuth
    ...(process.env.AUTH0_ID && process.env.AUTH0_SECRET && process.env.AUTH0_ISSUER_BASE_URL ? [
      Auth0Provider({
        clientId: process.env.AUTH0_ID,
        clientSecret: process.env.AUTH0_SECRET,
        issuer: process.env.AUTH0_ISSUER_BASE_URL,
      }),
    ] : []),
  ],
  callbacks: {
    async session({ session, token, user }) {
      // 🔍 监控 session callback 性能
      perfLogger.start('auth:session-callback')

      // Optimization: Read data directly from token to avoid database queries on every request
      // Token is already updated in jwt callback
      if (session.user && token) {
        const userId = user?.id || (token.sub as string) || (token.id as string)

        if (userId && userId !== "unknown") {
          // Read cached user data directly from token
          session.user.id = userId
          session.user.name = (token.name as string) || session.user.name
          session.user.email = (token.email as string) || session.user.email
          session.user.image = (token.image as string) || session.user.image
          session.user.username = (token.username as string) || session.user.username
          session.user.freeTrialsUsed = (token.freeTrialsUsed as number) || 0
          // TypeScript workaround: premiumUsageCount and creditsBalance are defined in types/next-auth.d.ts
          ;(session.user as any).premiumUsageCount = (token.premiumUsageCount as number) || 0
          ;(session.user as any).creditsBalance = (token.creditsBalance as number) || 0
          session.user.isPremium = (token.isPremium as boolean) || false
          session.user.premiumExpiresAt = (token.premiumExpiresAt as Date) || null
          session.user.isPremiumActive = (token.isPremiumActive as boolean) || false
          session.user.remainingTrials = (token.remainingTrials as number) || 3
        }
      }

      perfLogger.end('auth:session-callback', { userId: session.user?.id })
      return session
    },
    async jwt({ token, user, account, profile, trigger }) {
      // 🔍 监控 JWT callback 性能
      perfLogger.start('auth:jwt-callback')

      // Set basic info on first login
      if (user) {
        token.id = user.id
        token.name = user.name
        token.email = user.email
        token.image = user.image
      }

      // Handle provider-specific profile data
      if (profile) {
        const p: any = profile

        // Twitter: extract username from profile
        if (account?.provider === 'twitter') {
          token.username = p?.data?.username ?? p?.username ?? p?.screen_name ?? token.username ?? user?.name
          if (!token.email) token.email = p?.data?.email ?? p?.email ?? token.email
        }

        // Auth0: extract nickname as username
        if (account?.provider === 'auth0') {
          token.username = p?.nickname ?? p?.name ?? token.username ?? user?.name
          if (!token.email) token.email = p?.email ?? token.email
        }
      }

      // 🔥 优化：改进同步策略，确保数据及时更新
      // 1. First login (user exists)
      // 2. Manual trigger update (trigger === 'update')
      // 3. Token has no user data (isPremium is undefined)
      // 4. Periodic sync: every 5 minutes to catch subscription changes
      const tokenAge = token.iat ? Date.now() - (Number(token.iat) * 1000) : Infinity
      const shouldSync = user ||
                        trigger === 'update' ||
                        token.isPremium === undefined ||
                        tokenAge > 5 * 60 * 1000  // 5 minutes

      if (token.sub && shouldSync) {
        try {
          // 🔍 监控数据库同步
          perfLogger.start('auth:jwt:db-sync')

          const dbUser = await prisma.user.findUnique({
            where: { id: token.sub },
            select: {
              name: true,
              email: true,
              image: true,
              username: true,
              freeTrialsUsed: true,
              premiumUsageCount: true,
              creditsBalance: true,
              isPremium: true,
              premiumExpiresAt: true,
            }
          })

          perfLogger.end('auth:jwt:db-sync', {
            userId: token.sub,
            userFound: !!dbUser,
            trigger
          })

          if (dbUser) {
            // Update all user info to token
            token.name = dbUser.name
            token.email = dbUser.email
            token.image = dbUser.image
            token.username = dbUser.username
            token.freeTrialsUsed = dbUser.freeTrialsUsed
            token.premiumUsageCount = dbUser.premiumUsageCount
            token.creditsBalance = dbUser.creditsBalance
            token.isPremium = dbUser.isPremium
            token.premiumExpiresAt = dbUser.premiumExpiresAt

            // Calculate active status
            token.isPremiumActive = dbUser.isPremium &&
              (!dbUser.premiumExpiresAt || dbUser.premiumExpiresAt > new Date())

            // Calculate remaining trials (using centralized config)
            // Priority: Premium quota > Credits Pack > Free trials
            if (token.isPremiumActive) {
              // Premium users: show their subscription quota
              token.remainingTrials = 999 // Will be calculated based on subscription type
            } else if (dbUser.creditsBalance > 0) {
              // Users with credits: show credits balance
              token.remainingTrials = dbUser.creditsBalance
            } else {
              // Free users: show free trial remaining
              token.remainingTrials = Math.max(0, QUOTA_CONFIG.FREE_TRIAL - dbUser.freeTrialsUsed)
            }

            // 清除用户缓存，确保Dashboard等页面使用最新数据
            // 特别是在重新登录或手动触发更新时
            if (trigger === 'update' || user) {
              try {
                clearUserCache(token.sub)
                log.debug('auth', 'User cache cleared after data sync', { userId: token.sub })
              } catch (cacheError) {
                log.warn('auth', 'Failed to clear user cache', { userId: token.sub, error: cacheError })
              }
            }
          }
        } catch (error) {
          perfLogger.end('auth:jwt:db-sync', { success: false, error: true })
          console.error('❌ Error syncing user data to token in jwt callback:', error)
          console.error('   This may indicate database connection issues in Vercel')
          __debugWrite('jwt.db_error', { error, userId: token.sub })
        }
      }

      perfLogger.end('auth:jwt-callback', {
        userId: token.sub,
        shouldSync,
        trigger
      })

      return token
    },
    async redirect({ url, baseUrl }) {
      // Handle post-login redirects intelligently
      log.debug('auth', 'Redirect callback', { url, baseUrl })

      let redirectUrl: string

      // If URL is relative, make it absolute
      if (url.startsWith("/")) {
        redirectUrl = `${baseUrl}${url}`
      }
      // If URL is from same origin, use it
      else if (new URL(url).origin === baseUrl) {
        redirectUrl = url
      }
      // For external URLs or invalid URLs, redirect to dashboard for authenticated users
      else {
        redirectUrl = `${baseUrl}/dashboard`
      }

      // Special handling for signin page - redirect to dashboard instead
      if (redirectUrl.includes('/auth/signin')) {
        redirectUrl = `${baseUrl}/dashboard`
      }

      log.info('auth', 'OAuth redirect completed', {
        originalUrl: url,
        finalUrl: redirectUrl
      })

      return redirectUrl
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt", // 使用 JWT 策略避免数据库依赖
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: process.env.NODE_ENV === "development",
  logger: {
    error(code, metadata) {
      console.error('NextAuth Error:', code, metadata)
      __debugWrite('logger.error', { code, metadata })
    },
    warn(code) {
      console.warn('NextAuth Warning:', code)
      __debugWrite('logger.warn', { code })
    },
    debug(code, metadata) {
      if (process.env.NODE_ENV === "development") {
        console.log('NextAuth Debug:', code, metadata)
        __debugWrite('logger.debug', { code, metadata })
      }
    }
  },
  events: ({
    async error(error: any) {
      const err = {
        name: (error as any)?.name,
        message: (error as any)?.message,
        stack: (error as any)?.stack,
        cause: (error as any)?.cause,
      }
      console.error('NextAuth Events Error:', err)
      __debugWrite('events.error', err)
    },
    async signIn({ user, account, isNewUser }: any) {
      const info = {
        user: { id: user?.id, name: user?.name },
        account: account?.provider,
        isNewUser,
      }
      console.log('NextAuth SignIn Event:', info)
      __debugWrite('events.signIn', info)
    },
    async signOut({ session }: any) {
      const info = { userId: session?.user?.id }
      console.log('NextAuth SignOut Event:', info)
      __debugWrite('events.signOut', info)
    },
    async createUser({ user }: any) {
      const info = { id: user.id, name: user.name }
      console.log('NextAuth CreateUser Event:', info)
      __debugWrite('events.createUser', info)
    },
    async session({ session }: any) {
      const info = { userId: session?.user?.id }
      console.log('NextAuth Session Event:', info)
      __debugWrite('events.session', info)
    },
  } as any),
}

// 扩展NextAuth类型
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      username?: string | null
      freeTrialsUsed: number
      isPremium: boolean
      premiumExpiresAt?: Date | null
      isPremiumActive: boolean
      remainingTrials: number
    }
  }

  interface User {
    id: string
    username?: string | null
    freeTrialsUsed: number
    isPremium: boolean
    premiumExpiresAt?: Date | null
  }
}
