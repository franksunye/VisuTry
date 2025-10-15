import { DefaultSession, DefaultUser } from "next-auth"
import { JWT, DefaultJWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      username?: string | null
      freeTrialsUsed: number
      creditsBalance: number
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
    freeTrialsUsed: number
    creditsBalance: number
    isPremium: boolean
    premiumExpiresAt?: Date | null
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string
    username?: string | null
    freeTrialsUsed?: number
    creditsBalance?: number
    isPremium?: boolean
    premiumExpiresAt?: Date | null
    isPremiumActive?: boolean
    remainingTrials?: number
  }
}

