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
  // 暂时使用 JWT 策略避免数据库连接问题
  adapter: undefined, // isMockMode ? undefined : PrismaAdapter(prisma),

  providers: [
    ...(isMockMode ? [MockCredentialsProvider] : []),
    // 使用Twitter OAuth 1.0a (API Key and Secret)
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      version: "2.0", // 使用 OAuth 2.0（Twitter 已更新域名为 api.x.com）
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      // 简化的session callback
      if (session.user && token) {
        session.user.id = (token.sub as string) || (token.id as string) || "unknown"
        session.user.freeTrialsUsed = (token.freeTrialsUsed as number) || 0
        session.user.isPremium = (token.isPremium as boolean) || false
        session.user.premiumExpiresAt = (token.premiumExpiresAt as Date) || null
        session.user.isPremiumActive = (token.isPremiumActive as boolean) || false
        session.user.remainingTrials = (token.remainingTrials as number) || 3

        if (token.username) {
          session.user.username = token.username as string
        }
        if (token.email) {
          session.user.email = token.email as string
        }
      }
      return session
    },
    async jwt({ token, user, account, profile }) {
      // 简化的JWT callback，减少可能的错误点
      if (user) {
        // 首次登录，设置基本信息
        token.id = user.id
        token.name = user.name
        token.email = user.email
        token.image = user.image

        // 设置默认属性
        token.freeTrialsUsed = 0
        token.isPremium = false
        token.premiumExpiresAt = null
        token.isPremiumActive = false
        token.remainingTrials = 3
      }

      // 如果是Twitter登录，补充用户名与邮箱（兼容 v1.1/v2）
      if (account?.provider === 'twitter' && profile) {
        const p: any = profile
        token.username = p?.data?.username ?? p?.username ?? p?.screen_name ?? token.username ?? user?.name
        if (!token.email) token.email = p?.data?.email ?? p?.email ?? token.email
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
