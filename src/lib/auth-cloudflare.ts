import Auth0Provider from 'next-auth/providers/auth0'
import type { NextAuthOptions } from 'next-auth'
import { getCloudflareAuthUser, createCloudflareAuthAdapter } from '@/data/auth-cloudflare'
import { getJwtSyncDecision } from './auth-sync'
import { normalizeAuth0Issuer } from './auth0-issuer'
import { QUOTA_CONFIG } from '@/config/pricing'

const auth0Issuer = normalizeAuth0Issuer(process.env.AUTH0_ISSUER_BASE_URL)

function logAuthError(code: string, metadata: unknown) {
  const record = metadata && typeof metadata === 'object'
    ? metadata as Record<string, unknown>
    : undefined
  const error = record?.error && typeof record.error === 'object'
    ? record.error as Record<string, unknown>
    : undefined

  console.error('[Cloudflare Auth]', JSON.stringify({
    code,
    errorName: typeof error?.name === 'string' ? error.name : undefined,
    errorMessage: typeof error?.message === 'string' ? error.message : undefined,
  }))
}

const auth0Configured = Boolean(
  process.env.AUTH0_ID &&
  process.env.AUTH0_SECRET &&
  auth0Issuer,
)

function syncUserFields(token: Record<string, unknown>, user: Awaited<ReturnType<typeof getCloudflareAuthUser>>) {
  if (!user) return
  token.name = user.name
  token.email = user.email
  token.image = user.image
  token.username = user.username
  token.role = user.role
  token.freeTrialsUsed = user.freeTrialsUsed
  token.premiumUsageCount = user.premiumUsageCount
  token.creditsPurchased = user.creditsPurchased
  token.creditsUsed = user.creditsUsed
  token.isPremium = user.isPremium
  token.premiumExpiresAt = user.premiumExpiresAt
  token.isPremiumActive = user.isPremium && (!user.premiumExpiresAt || user.premiumExpiresAt > new Date())

  if (token.isPremiumActive && user.currentSubscriptionType) {
    const quota = user.currentSubscriptionType === 'PREMIUM_YEARLY'
      ? QUOTA_CONFIG.YEARLY_SUBSCRIPTION
      : QUOTA_CONFIG.MONTHLY_SUBSCRIPTION
    token.remainingTrials = Math.max(0, quota - user.premiumUsageCount) + Math.max(0, user.creditsPurchased - user.creditsUsed)
    token.subscriptionType = user.currentSubscriptionType
  } else {
    token.remainingTrials = Math.max(0, QUOTA_CONFIG.FREE_TRIAL - user.freeTrialsUsed) + Math.max(0, user.creditsPurchased - user.creditsUsed)
    token.subscriptionType = null
  }
}

const providers = auth0Configured
  ? [Auth0Provider({
      clientId: process.env.AUTH0_ID!,
      clientSecret: process.env.AUTH0_SECRET!,
      issuer: auth0Issuer!,
    })]
  : []

export const authOptions: NextAuthOptions = {
  adapter: createCloudflareAuthAdapter(),
  providers,
  callbacks: {
    async jwt({ token, user, trigger }) {
      const tokenRecord = token as Record<string, unknown>
      if (user) {
        tokenRecord.id = user.id
        tokenRecord.name = user.name
        tokenRecord.email = user.email
        tokenRecord.image = user.image
        tokenRecord.role = (user as typeof user & { role?: string }).role || 'USER'
      }

      const now = Date.now()
      const syncDecision = getJwtSyncDecision({
        hasUser: Boolean(user),
        trigger,
        hasRequiredUserData: tokenRecord.isPremium !== undefined,
        lastSyncTime: Number(tokenRecord.lastSyncTime ?? 0),
        lastSyncAttemptTime: Number(tokenRecord.lastSyncAttemptTime ?? 0),
        now,
      })

      const userId = String(tokenRecord.sub || tokenRecord.id || '')
      if (userId && syncDecision.shouldSync) {
        tokenRecord.lastSyncAttemptTime = now
        try {
          const dbUser = await getCloudflareAuthUser(userId)
          if (dbUser) {
            syncUserFields(tokenRecord, dbUser)
            tokenRecord.lastSyncTime = now
            tokenRecord.lastSyncAttemptTime = now
          }
        } catch (error) {
          console.error('[Cloudflare Auth] user token sync failed:', error instanceof Error ? error.message : String(error))
        }
      }
      return token
    },
    async session({ session, token }) {
      const tokenRecord = token as Record<string, unknown>
      if (session.user) {
        session.user.id = String(tokenRecord.sub || tokenRecord.id || '')
        session.user.name = (tokenRecord.name as string | null) || null
        session.user.email = (tokenRecord.email as string | null) || null
        session.user.image = (tokenRecord.image as string | null) || null
        session.user.username = (tokenRecord.username as string | null) || null
        session.user.role = (tokenRecord.role as 'USER' | 'ADMIN') || 'USER'
        session.user.freeTrialsUsed = Number(tokenRecord.freeTrialsUsed || 0)
        session.user.premiumUsageCount = Number(tokenRecord.premiumUsageCount || 0)
        session.user.creditsPurchased = Number(tokenRecord.creditsPurchased || 0)
        session.user.creditsUsed = Number(tokenRecord.creditsUsed || 0)
        session.user.isPremium = Boolean(tokenRecord.isPremium)
        session.user.premiumExpiresAt = (tokenRecord.premiumExpiresAt as Date | null) || null
        session.user.isPremiumActive = Boolean(tokenRecord.isPremiumActive)
        session.user.remainingTrials = Number(tokenRecord.remainingTrials ?? 3)
        session.user.subscriptionType = (tokenRecord.subscriptionType as string | null) || null
        session.user.isYearlySubscription = tokenRecord.subscriptionType === 'PREMIUM_YEARLY'
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) return `${baseUrl}${url}`
      try {
        return new URL(url).origin === baseUrl ? url : `${baseUrl}/try-on`
      } catch {
        return `${baseUrl}/try-on`
      }
    },
  },
  pages: { signIn: '/auth/signin', error: '/auth/error' },
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  logger: {
    error: logAuthError,
  },
}
