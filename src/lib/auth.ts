import { NextAuthOptions } from "next-auth"
import TwitterProvider from "next-auth/providers/twitter"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      version: "2.0",
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
        
        // 获取用户的试用次数和付费状态
        const userData = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            freeTrialsUsed: true,
            isPremium: true,
            premiumExpiresAt: true,
          },
        })

        if (userData) {
          session.user.freeTrialsUsed = userData.freeTrialsUsed
          session.user.isPremium = userData.isPremium
          session.user.premiumExpiresAt = userData.premiumExpiresAt
          
          // 检查付费是否过期
          const isPremiumActive = userData.isPremium && 
            (!userData.premiumExpiresAt || userData.premiumExpiresAt > new Date())
          
          session.user.isPremiumActive = isPremiumActive
          session.user.remainingTrials = Math.max(0, 
            (process.env.FREE_TRIAL_LIMIT ? parseInt(process.env.FREE_TRIAL_LIMIT) : 3) - userData.freeTrialsUsed
          )
        }
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "database",
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
