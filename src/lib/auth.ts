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

export const authOptions: NextAuthOptions = {
  // 使用 Prisma Adapter 确保用户自动创建到数据库
  adapter: isMockMode ? undefined : PrismaAdapter(prisma),

  providers: [
    ...(isMockMode ? [MockCredentialsProvider] : []),
    // 使用Twitter OAuth 2.0
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      version: "2.0",
    }),
  ],
  callbacks: {
    async session({ session, token, user }) {
      // 从数据库同步最新的用户数据
      if (session.user && token) {
        const userId = user?.id || (token.sub as string) || (token.id as string)

        if (userId && userId !== "unknown") {
          try {
            // 从数据库获取最新用户数据
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

              // 计算是否为活跃高级会员
              session.user.isPremiumActive = dbUser.isPremium &&
                (!dbUser.premiumExpiresAt || dbUser.premiumExpiresAt > new Date())

              // 计算剩余试用次数
              const freeTrialLimit = parseInt(process.env.FREE_TRIAL_LIMIT || "3")
              session.user.remainingTrials = Math.max(0, freeTrialLimit - dbUser.freeTrialsUsed)
            } else {
              // 用户不存在于数据库，使用 token 中的默认值
              session.user.id = userId
              session.user.freeTrialsUsed = 0
              session.user.isPremium = false
              session.user.premiumExpiresAt = null
              session.user.isPremiumActive = false
              session.user.remainingTrials = 3
            }
          } catch (error) {
            console.error('Error fetching user from database:', error)
            // 发生错误时使用 token 中的值作为后备
            session.user.id = userId
            session.user.freeTrialsUsed = (token.freeTrialsUsed as number) || 0
            session.user.isPremium = (token.isPremium as boolean) || false
            session.user.premiumExpiresAt = (token.premiumExpiresAt as Date) || null
            session.user.isPremiumActive = (token.isPremiumActive as boolean) || false
            session.user.remainingTrials = (token.remainingTrials as number) || 3
          }
        }

        // 从 token 补充用户名和邮箱（如果数据库中没有）
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
      // 首次登录时设置基本信息
      if (user) {
        token.id = user.id
        token.name = user.name
        token.email = user.email
        token.image = user.image
      }

      // 如果是Twitter登录，补充用户名与邮箱（兼容 v1.1/v2）
      if (account?.provider === 'twitter' && profile) {
        const p: any = profile
        token.username = p?.data?.username ?? p?.username ?? p?.screen_name ?? token.username ?? user?.name
        if (!token.email) token.email = p?.data?.email ?? p?.email ?? token.email
      }

      // 定期从数据库同步用户数据到 token（每次请求都同步）
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

            // 计算活跃状态和剩余次数
            token.isPremiumActive = dbUser.isPremium &&
              (!dbUser.premiumExpiresAt || dbUser.premiumExpiresAt > new Date())

            const freeTrialLimit = parseInt(process.env.FREE_TRIAL_LIMIT || "3")
            token.remainingTrials = Math.max(0, freeTrialLimit - dbUser.freeTrialsUsed)
          }
        } catch (error) {
          console.error('Error syncing user data to token:', error)
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
