import { DefaultSession, DefaultUser } from "next-auth"
import { JWT, DefaultJWT } from "next-auth/jwt"

import { UserRole } from "@prisma/client"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      username?: string | null
      role: UserRole
      freeTrialsUsed: number
      premiumUsageCount: number
      creditsPurchased: number
      creditsUsed: number
      isPremium: boolean
      premiumExpiresAt?: Date | null
      isPremiumActive: boolean
      remainingTrials: number
      subscriptionType?: string | null
      isYearlySubscription?: boolean
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    username?: string | null
    role: UserRole
    freeTrialsUsed: number
    premiumUsageCount: number
    creditsPurchased: number
    creditsUsed: number
    isPremium: boolean
    premiumExpiresAt?: Date | null
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string
    username?: string | null
    role?: UserRole
    freeTrialsUsed?: number
    premiumUsageCount?: number
    creditsPurchased?: number
    creditsUsed?: number
    isPremium?: boolean
    premiumExpiresAt?: Date | null
    isPremiumActive?: boolean
    remainingTrials?: number
    subscriptionType?: string | null
  }
}

