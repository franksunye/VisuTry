// IMPORTANT: Setup proxy BEFORE any other imports that make network requests
import "./proxy-setup"

import { NextAuthOptions } from "next-auth"
import TwitterProvider from "next-auth/providers/twitter"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import { MockCredentialsProvider, isMockMode } from "@/lib/mocks/auth"
import { log } from "@/lib/logger"

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
  const required = ['TWITTER_CLIENT_ID', 'TWITTER_CLIENT_SECRET', 'NEXTAUTH_SECRET']
  const missing = required.filter(key => !process.env[key])

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
  console.log('  - Twitter OAuth:', process.env.TWITTER_CLIENT_ID ? 'Configured' : 'Missing')
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
    // Use Twitter OAuth 2.0
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      version: "2.0",
      // Explicitly specify authorization params to ensure Vercel environment handles correctly
      authorization: {
        params: {
          scope: "tweet.read users.read offline.access",
        },
      },
    }),
  ],
  callbacks: {
    async session({ session, token, user }) {
      // Sync latest user data from database
      if (session.user && token) {
        const userId = user?.id || (token.sub as string) || (token.id as string)

        if (userId && userId !== "unknown") {
          try {
            // Fetch latest user data from database
            const dbUser = await prisma.user.findUnique({
              where: { id: userId },
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                username: true,
                freeTrialsUsed: true,
                isPremium: true,
                premiumExpiresAt: true,
              }
            })

            if (dbUser) {
              session.user.id = dbUser.id
              session.user.name = dbUser.name
              session.user.email = dbUser.email
              session.user.image = dbUser.image
              session.user.username = dbUser.username
              session.user.freeTrialsUsed = dbUser.freeTrialsUsed
              session.user.isPremium = dbUser.isPremium
              session.user.premiumExpiresAt = dbUser.premiumExpiresAt

              // Calculate if premium is active
              session.user.isPremiumActive = dbUser.isPremium &&
                (!dbUser.premiumExpiresAt || dbUser.premiumExpiresAt > new Date())

              // Calculate remaining trial count
              const freeTrialLimit = parseInt(process.env.FREE_TRIAL_LIMIT || "3")
              session.user.remainingTrials = Math.max(0, freeTrialLimit - dbUser.freeTrialsUsed)
            } else {
              // User doesn't exist in database, use default values from token
              session.user.id = userId
              session.user.freeTrialsUsed = 0
              session.user.isPremium = false
              session.user.premiumExpiresAt = null
              session.user.isPremiumActive = false
              session.user.remainingTrials = 3
            }
          } catch (error) {
            console.error('❌ Error fetching user from database in session callback:', error)
            console.error('   This may indicate database connection issues in Vercel')
            console.error('   Falling back to token data')
            __debugWrite('session.db_error', { error, userId })

            // Use token values as fallback when error occurs
            session.user.id = userId
            session.user.freeTrialsUsed = (token.freeTrialsUsed as number) || 0
            session.user.isPremium = (token.isPremium as boolean) || false
            session.user.premiumExpiresAt = (token.premiumExpiresAt as Date) || null
            session.user.isPremiumActive = (token.isPremiumActive as boolean) || false
            session.user.remainingTrials = (token.remainingTrials as number) || 3
          }
        }

        // Supplement username and email from token (if not in database)
        if (token.username && !session.user.username) {
          session.user.username = token.username as string
        }
        if (token.email && !session.user.email) {
          session.user.email = token.email as string
        }
      }
      return session
    },
    async jwt({ token, user, account, profile }) {
      // Set basic info on first login
      if (user) {
        token.id = user.id
        token.name = user.name
        token.email = user.email
        token.image = user.image
      }

      // If Twitter login, supplement username and email (compatible with v1.1/v2)
      if (account?.provider === 'twitter' && profile) {
        const p: any = profile
        token.username = p?.data?.username ?? p?.username ?? p?.screen_name ?? token.username ?? user?.name
        if (!token.email) token.email = p?.data?.email ?? p?.email ?? token.email
      }

      // Periodically sync user data from database to token (sync on every request)
      if (token.sub) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.sub },
            select: {
              freeTrialsUsed: true,
              isPremium: true,
              premiumExpiresAt: true,
            }
          })

          if (dbUser) {
            token.freeTrialsUsed = dbUser.freeTrialsUsed
            token.isPremium = dbUser.isPremium
            token.premiumExpiresAt = dbUser.premiumExpiresAt

            // Calculate active status and remaining count
            token.isPremiumActive = dbUser.isPremium &&
              (!dbUser.premiumExpiresAt || dbUser.premiumExpiresAt > new Date())

            const freeTrialLimit = parseInt(process.env.FREE_TRIAL_LIMIT || "3")
            token.remainingTrials = Math.max(0, freeTrialLimit - dbUser.freeTrialsUsed)
          }
        } catch (error) {
          console.error('❌ Error syncing user data to token in jwt callback:', error)
          console.error('   This may indicate database connection issues in Vercel')
          __debugWrite('jwt.db_error', { error, userId: token.sub })
        }
      }

      return token
    },
    async redirect({ url, baseUrl }) {
      // 确保授权成功后重定向到主页
      log.debug('auth', 'Redirect callback', { url, baseUrl })

      let redirectUrl: string
      if (url.startsWith("/")) {
        redirectUrl = `${baseUrl}${url}`
      } else if (new URL(url).origin === baseUrl) {
        redirectUrl = url
      } else {
        redirectUrl = baseUrl + "/"
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
