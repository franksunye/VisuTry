import { NextAuthOptions } from "next-auth"
import TwitterProvider from "next-auth/providers/twitter"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import { MockCredentialsProvider, isMockMode } from "@/lib/mocks/auth"

export const authOptions: NextAuthOptions = {
  // 暂时使用 JWT 策略避免数据库连接问题
  adapter: undefined, // isMockMode ? undefined : PrismaAdapter(prisma),
  providers: [
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      version: "2.0",
    }),
    ...(isMockMode ? [MockCredentialsProvider] : [])
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user && token) {
        // 使用 JWT 策略，从 token 中获取用户信息
        session.user.id = token.sub || token.id || "unknown"
        session.user.freeTrialsUsed = 0 // 默认值，后续可以从数据库同步
        session.user.isPremium = false
        session.user.premiumExpiresAt = null
        session.user.isPremiumActive = false
        session.user.remainingTrials = 3 // 默认免费试用次数

        // 如果有用户名信息，添加到会话中
        if (token.username) {
          session.user.username = token.username as string
        }
      }
      return session
    },
    async jwt({ token, user, account, profile }) {
      // 首次登录时，从 Twitter profile 获取信息
      if (user && account && profile) {
        token.id = user.id
        token.username = (profile as any).data?.username || (profile as any).username

        // 尝试在数据库中创建或更新用户（可选，不阻塞登录）
        try {
          // 这里可以异步创建用户记录，但不阻塞登录流程
          console.log('User logged in:', {
            id: user.id,
            email: user.email,
            name: user.name,
            username: token.username
          })
        } catch (error) {
          console.error('Failed to sync user to database:', error)
          // 不抛出错误，允许登录继续
        }
      }
      return token
    },
    async redirect({ url, baseUrl }) {
      // 确保授权成功后重定向到主页
      console.log('Redirect callback:', { url, baseUrl })
      if (url.startsWith("/")) return `${baseUrl}${url}`
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl + "/"
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt", // 使用 JWT 策略避免数据库依赖
  },
  debug: process.env.NODE_ENV === "development",
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
