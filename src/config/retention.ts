/**
 * Data Retention Configuration
 * Defines how long try-on results are stored based on user plan
 */

// Retention periods in days
export const RETENTION_CONFIG = {
  FREE_USER: 7,        // Free users: 7 days
  CREDITS_USER: 90,    // Credits pack users: 90 days
  PREMIUM_USER: 365,   // Premium/Standard users: 1 year
} as const

// Email notification timing
export const NOTIFICATION_CONFIG = {
  FIRST_REMINDER_DAYS: 3,   // Send first reminder 3 days before expiry
  FINAL_REMINDER_HOURS: 24, // Send final reminder 24 hours before expiry
} as const

// User plan display names for emails
export const PLAN_DISPLAY_NAMES = {
  FREE: 'Free',
  CREDITS: 'Credits Pack',
  PREMIUM_MONTHLY: 'Standard (Monthly)',
  PREMIUM_YEARLY: 'Standard (Annual)',
} as const

/**
 * Get user's plan type for display
 */
export function getUserPlanType(user: {
  isPremium: boolean
  currentSubscriptionType?: string | null
  creditsPurchased?: number
  creditsUsed?: number
}): keyof typeof PLAN_DISPLAY_NAMES {
  if (user.isPremium && user.currentSubscriptionType === 'PREMIUM_YEARLY') {
    return 'PREMIUM_YEARLY'
  }
  if (user.isPremium) {
    return 'PREMIUM_MONTHLY'
  }
  const hasCredits = ((user.creditsPurchased || 0) - (user.creditsUsed || 0)) > 0
  if (hasCredits) {
    return 'CREDITS'
  }
  return 'FREE'
}

/**
 * Calculate expiration date based on user's plan
 */
export function calculateExpiresAt(user: {
  isPremium: boolean
  creditsPurchased?: number
  creditsUsed?: number
}): Date {
  const now = new Date()
  const hasCredits = ((user.creditsPurchased || 0) - (user.creditsUsed || 0)) > 0

  let days: number
  if (user.isPremium) {
    days = RETENTION_CONFIG.PREMIUM_USER
  } else if (hasCredits) {
    days = RETENTION_CONFIG.CREDITS_USER
  } else {
    days = RETENTION_CONFIG.FREE_USER
  }

  const expiresAt = new Date(now)
  expiresAt.setDate(expiresAt.getDate() + days)
  return expiresAt
}

/**
 * Get retention days for a user type
 */
export function getRetentionDays(planType: keyof typeof PLAN_DISPLAY_NAMES): number {
  switch (planType) {
    case 'PREMIUM_MONTHLY':
    case 'PREMIUM_YEARLY':
      return RETENTION_CONFIG.PREMIUM_USER
    case 'CREDITS':
      return RETENTION_CONFIG.CREDITS_USER
    default:
      return RETENTION_CONFIG.FREE_USER
  }
}

