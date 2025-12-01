import { logger } from '@/lib/logger'

// Resend API configuration
const RESEND_API_KEY = process.env.RESEND_API_KEY
const RESEND_API_URL = 'https://api.resend.com/emails'

// Template IDs/aliases
const TEMPLATES = {
  WELCOME: 'simple-html-welcome-email-template-for-visutrycom',
  RETENTION_3DAY: 'dataretention-upgrade-reminder-email-',
  RETENTION_24H: '-24-1day-24h-notice-before-deletion',
  RETENTION_DELETED: '-after-deletion',
} as const

/**
 * Send email using Resend API with template support
 */
async function sendEmailWithTemplate(params: {
  from: string
  to: string
  templateId: string
  variables: Record<string, string | number>
}): Promise<{ success: boolean; emailId?: string; error?: string }> {
  if (!RESEND_API_KEY) {
    return { success: false, error: 'Resend API key not configured' }
  }

  try {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: params.from,
        to: params.to,
        template: {
          id: params.templateId,
          variables: params.variables,
        },
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return { success: false, error: data.message || JSON.stringify(data) }
    }

    return { success: true, emailId: data.id }
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err))
    return { success: false, error: error.message }
  }
}

/**
 * Extract first name from various name formats
 * Handles: "John Smith", "@johnsmith", "john@example.com", null
 */
function extractFirstName(name: string | null, email: string | null): string {
  if (name) {
    const cleanName = name.startsWith('@') ? name.slice(1) : name
    const firstName = cleanName.split(' ')[0]
    if (firstName && !/^\d+$/.test(firstName)) {
      return firstName
    }
  }
  if (email) {
    const emailPrefix = email.split('@')[0]
    const firstPart = emailPrefix.split(/[._-]/)[0]
    if (firstPart && firstPart.length > 1) {
      return firstPart.charAt(0).toUpperCase() + firstPart.slice(1).toLowerCase()
    }
  }
  return 'there'
}

/**
 * Format date for email display (e.g., "December 15, 2024")
 */
function formatDateForEmail(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(user: {
  id: string
  email: string | null
  name: string | null
}): Promise<{ success: boolean; emailId?: string; error?: string }> {
  if (!user.email) {
    logger.warn('email', 'User has no email', { userId: user.id })
    return { success: false, error: 'User has no email address' }
  }

  const result = await sendEmailWithTemplate({
    from: 'VisuTry <noreply@visutry.com>',
    to: user.email,
    templateId: TEMPLATES.WELCOME,
    variables: {
      FIRST_NAME: extractFirstName(user.name, user.email),
    },
  })

  if (result.success) {
    logger.info('email', 'Welcome email sent', { userId: user.id, emailId: result.emailId })
  } else {
    logger.error('email', 'Failed to send welcome email', new Error(result.error || 'Unknown'), { userId: user.id })
  }

  return result
}

/**
 * Send 3-day retention reminder email using Resend template
 */
export async function sendRetention3DayEmail(user: {
  id: string
  email: string | null
  name: string | null
  planDisplayName: string
  expiryDate: Date
}): Promise<{ success: boolean; emailId?: string; error?: string }> {
  if (!user.email) {
    logger.warn('email', 'User has no email', { userId: user.id })
    return { success: false, error: 'User has no email address' }
  }

  const result = await sendEmailWithTemplate({
    from: 'Support <support@visutry.com>',
    to: user.email,
    templateId: TEMPLATES.RETENTION_3DAY,
    variables: {
      FIRST_NAME: extractFirstName(user.name, user.email),
      USER_PLAN: user.planDisplayName,
      EXPIRY_DATE: formatDateForEmail(user.expiryDate),
    },
  })

  if (result.success) {
    logger.info('email', '3-day retention email sent', { userId: user.id, emailId: result.emailId })
  } else {
    logger.error('email', 'Failed to send 3-day retention email', new Error(result.error || 'Unknown'), { userId: user.id })
  }

  return result
}

/**
 * Send 24-hour final reminder email using Resend template
 */
export async function sendRetention24HEmail(user: {
  id: string
  email: string | null
  name: string | null
  expiryDate: Date
}): Promise<{ success: boolean; emailId?: string; error?: string }> {
  if (!user.email) {
    logger.warn('email', 'User has no email', { userId: user.id })
    return { success: false, error: 'User has no email address' }
  }

  const result = await sendEmailWithTemplate({
    from: 'Support <support@visutry.com>',
    to: user.email,
    templateId: TEMPLATES.RETENTION_24H,
    variables: {
      FIRST_NAME: extractFirstName(user.name, user.email),
      EXPIRY_DATE: formatDateForEmail(user.expiryDate),
    },
  })

  if (result.success) {
    logger.info('email', '24h retention email sent', { userId: user.id, emailId: result.emailId })
  } else {
    logger.error('email', 'Failed to send 24h email', new Error(result.error || 'Unknown'), { userId: user.id })
  }

  return result
}

/**
 * Send deletion confirmation email using Resend template
 */
export async function sendRetentionDeletedEmail(user: {
  id: string
  email: string | null
  name: string | null
  expiryDate: Date
}): Promise<{ success: boolean; emailId?: string; error?: string }> {
  if (!user.email) {
    logger.warn('email', 'User has no email', { userId: user.id })
    return { success: false, error: 'User has no email address' }
  }

  const result = await sendEmailWithTemplate({
    from: 'Support <support@visutry.com>',
    to: user.email,
    templateId: TEMPLATES.RETENTION_DELETED,
    variables: {
      FIRST_NAME: extractFirstName(user.name, user.email),
      EXPIRY_DATE: formatDateForEmail(user.expiryDate),
    },
  })

  if (result.success) {
    logger.info('email', 'Deletion email sent', { userId: user.id, emailId: result.emailId })
  } else {
    logger.error('email', 'Failed to send deletion email', new Error(result.error || 'Unknown'), { userId: user.id })
  }

  return result
}
