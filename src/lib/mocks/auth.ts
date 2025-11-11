// Mock Authentication Service
import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import { mockUsers, isMockMode } from "./index"

// Mock Twitter Provider for testing
const MockTwitterProvider = {
  id: "twitter",
  name: "Twitter",
  type: "oauth" as const,
  authorization: {
    url: "http://localhost:3000/api/auth/mock/twitter",
    params: {
      scope: "users.read tweet.read",
    },
  },
  token: "http://localhost:3000/api/auth/mock/twitter/token",
  userinfo: "http://localhost:3000/api/auth/mock/twitter/userinfo",
  profile(profile: any) {
    return {
      id: profile.data.id,
      name: profile.data.name,
      email: profile.data.email || `${profile.data.username}@twitter.com`,
      image: profile.data.profile_image_url,
      username: profile.data.username,
    }
  },
  clientId: process.env.TWITTER_CLIENT_ID,
  clientSecret: process.env.TWITTER_CLIENT_SECRET,
}

// Mock Credentials Provider for easy testing
const MockCredentialsProvider = CredentialsProvider({
  id: "mock-credentials",
  name: "Mock Login",
  credentials: {
    email: { label: "Email", type: "email", placeholder: "test@example.com" },
    type: { label: "User Type", type: "select", options: ["free", "premium", "admin"] }
  },
  async authorize(credentials) {
    if (!credentials?.email) return null

    // Find or create mock user
    const userType = credentials.type || "free"
    const mockUser = userType === "admin" ? mockUsers[2] : userType === "premium" ? mockUsers[1] : mockUsers[0]

    return {
      id: mockUser.id,
      email: credentials.email,
      name: mockUser.name,
      image: mockUser.image,
      username: mockUser.username,
      role: mockUser.role,
      freeTrialsUsed: mockUser.freeTrialsUsed,
      premiumUsageCount: 0, // Mock users start with 0 premium usage
      creditsPurchased: 0, // Mock users start with 0 credits purchased
      creditsUsed: 0, // Mock users start with 0 credits used
      isPremium: mockUser.isPremium,
    } as any
  },
})

export function getMockAuthOptions(): NextAuthOptions {
  return {
    adapter: PrismaAdapter(prisma),
    providers: isMockMode ? [MockCredentialsProvider] : [],
    callbacks: {
      async session({ session, user, token }) {
        if (session.user) {
          session.user.id = user?.id || token?.sub || 'mock-user-1'

          // Get mock user data
          const mockUser = mockUsers.find(u => u.id === session.user.id) || mockUsers[0]

          session.user.role = mockUser.role as any
          session.user.freeTrialsUsed = mockUser.freeTrialsUsed
          session.user.isPremium = mockUser.isPremium
          session.user.premiumExpiresAt = mockUser.premiumExpiresAt
          session.user.username = mockUser.username
        }
        return session
      },
      async jwt({ token, user, account }) {
        if (user) {
          token.username = user.username
          // @ts-ignore
          token.role = user.role
        }
        return token
      },
    },
    pages: {
      signIn: '/auth/signin',
      error: '/auth/error',
    },
    session: {
      strategy: "jwt",
    },
    debug: process.env.NODE_ENV === "development",
  }
}

// Export the providers for use in auth.ts
export { MockCredentialsProvider, isMockMode }
