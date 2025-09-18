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
      authorization: {
        url: "https://twitter.com/i/oauth2/authorize",
        params: {
          scope: "users.read tweet.read offline.access",
          response_type: "code",
        },
      },
      token: "https://api.twitter.com/2/oauth2/token",
      userinfo: "https://api.twitter.com/2/users/me?user.fields=id,name,username,profile_image_url",
    }),
    ...(isMockMode ? [MockCredentialsProvider] : [])
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user && token) {
        // 使用 JWT 策略，从 token 中获取用户信息
        session.user.id = (token.sub as string) || (token.id as string) || "unknown"
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
      try {
        // 首次登录时，从 Twitter profile 获取信息
        if (user && account && profile) {
          console.log('JWT callback - user login:', {
            userId: user.id,
            accountProvider: account.provider,
            profileData: profile
          })

          token.id = user.id
          token.username = (profile as any).data?.username || (profile as any).username || user.name

          // 尝试在数据库中创建或更新用户（可选，不阻塞登录）
          try {
            console.log('User logged in successfully:', {
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
      } catch (error) {
        console.error('JWT callback error:', error)
        // 返回基本 token 以避免登录失败
        return token
      }
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
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: process.env.NODE_ENV === "development",
  logger: {
    error(code, metadata) {
      console.error('NextAuth Error:', code, metadata)
    },
    warn(code) {
      console.warn('NextAuth Warning:', code)
    },
    debug(code, metadata) {
      if (process.env.NODE_ENV === "development") {
        console.log('NextAuth Debug:', code, metadata)
      }
    }
  },
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
