import { Resend } from 'resend'
import { logger } from '@/lib/logger'

// Initialize Resend client
const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY)
  : null

// Template aliases
const TEMPLATES = {
  WELCOME: 'simple-html-welcome-email-template-for-visutrycom',
  RETENTION_3DAY: 'dataretention-upgrade-reminder-email-',
  RETENTION_24H: '-24-1day-24h-notice-before-deletion',
  RETENTION_DELETED: '-after-deletion',
} as const

/**
 * Extract first name from various name formats
 * Handles: "John Smith", "@johnsmith", "john@example.com", null
 */
function extractFirstName(name: string | null, email: string | null): string {
  if (name) {
    // Remove @ prefix if it's a Twitter handle
    const cleanName = name.startsWith('@') ? name.slice(1) : name
    // Get first part (before space)
    const firstName = cleanName.split(' ')[0]
    // Return if it looks like a name (not empty, not just numbers)
    if (firstName && !/^\d+$/.test(firstName)) {
      return firstName
    }
  }

  // Fallback: extract from email (before @)
  if (email) {
    const emailPrefix = email.split('@')[0]
    // Clean up common separators and get first part
    const firstPart = emailPrefix.split(/[._-]/)[0]
    if (firstPart && firstPart.length > 1) {
      // Capitalize first letter
      return firstPart.charAt(0).toUpperCase() + firstPart.slice(1).toLowerCase()
    }
  }

  return 'there'
}

/**
 * Send welcome email to new user using Resend template
 */
export async function sendWelcomeEmail(user: {
  id: string
  email: string | null
  name: string | null
}): Promise<{ success: boolean; emailId?: string; error?: string }> {
  // Skip if no API key configured
  if (!resend) {
    logger.warn('email', 'Resend API key not configured, skipping welcome email', { userId: user.id })
    return { success: false, error: 'Resend API key not configured' }
  }

  // Skip if user has no email
  if (!user.email) {
    logger.warn('email', 'User has no email address, skipping welcome email', { userId: user.id })
    return { success: false, error: 'User has no email address' }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'VisuTry <noreply@visutry.com>',
      to: user.email,
      subject: 'Welcome to VisuTry! 🎉',
      // Use template with alias
      // @ts-ignore - Resend supports template_id with alias
      template_id: TEMPLATES.WELCOME,
      // Template variables - matches {{FIRST_NAME}} in template
      // @ts-ignore
      template_data: {
        FIRST_NAME: extractFirstName(user.name, user.email),
      },
    })

    if (error) {
      logger.error('email', 'Failed to send welcome email', new Error(error.message), { 
        userId: user.id,
        email: user.email,
        errorName: error.name
      })
      return { success: false, error: error.message }
    }

    logger.info('email', 'Welcome email sent successfully', { 
      userId: user.id,
      email: user.email,
      emailId: data?.id
    })

    return { success: true, emailId: data?.id }
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err))
    logger.error('email', 'Exception while sending welcome email', error, { 
      userId: user.id,
      email: user.email
    })
    return { success: false, error: error.message }
  }
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
 * Send 3-day retention reminder email
 * Template params: {{FIRST_NAME}}, {{USER_PLAN}}, {{EXPIRY_DATE}}
 */
export async function sendRetention3DayEmail(user: {
  id: string
  email: string | null
  name: string | null
  planDisplayName: string
  expiryDate: Date
}): Promise<{ success: boolean; emailId?: string; error?: string }> {
  if (!resend) {
    logger.warn('email', 'Resend API key not configured, skipping 3-day retention email', { userId: user.id })
    return { success: false, error: 'Resend API key not configured' }
  }

  if (!user.email) {
    logger.warn('email', 'User has no email address, skipping 3-day retention email', { userId: user.id })
    return { success: false, error: 'User has no email address' }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'VisuTry <noreply@visutry.com>',
      to: user.email,
      subject: 'Your Try-On Results Will Expire Soon',
      // @ts-ignore
      template_id: TEMPLATES.RETENTION_3DAY,
      // @ts-ignore
      template_data: {
        FIRST_NAME: extractFirstName(user.name, user.email),
        USER_PLAN: user.planDisplayName,
        EXPIRY_DATE: formatDateForEmail(user.expiryDate),
      },
    })

    if (error) {
      logger.error('email', 'Failed to send 3-day retention email', new Error(error.message), {
        userId: user.id,
        email: user.email,
      })
      return { success: false, error: error.message }
    }

    logger.info('email', '3-day retention email sent', {
      userId: user.id,
      email: user.email,
      emailId: data?.id,
    })

    return { success: true, emailId: data?.id }
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err))
    logger.error('email', 'Exception sending 3-day retention email', error, { userId: user.id })
    return { success: false, error: error.message }
  }
}

/**
 * Send 24-hour final reminder email
 * Template params: {{FIRST_NAME}}, {{EXPIRY_DATE}}
 */
export async function sendRetention24HEmail(user: {
  id: string
  email: string | null
  name: string | null
  expiryDate: Date
}): Promise<{ success: boolean; emailId?: string; error?: string }> {
  if (!resend) {
    logger.warn('email', 'Resend API key not configured, skipping 24h retention email', { userId: user.id })
    return { success: false, error: 'Resend API key not configured' }
  }

  if (!user.email) {
    logger.warn('email', 'User has no email address, skipping 24h retention email', { userId: user.id })
    return { success: false, error: 'User has no email address' }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'VisuTry <noreply@visutry.com>',
      to: user.email,
      subject: '⚠️ Final Notice: Your Try-On Results Will Be Deleted Tomorrow',
      // @ts-ignore
      template_id: TEMPLATES.RETENTION_24H,
      // @ts-ignore
      template_data: {
        FIRST_NAME: extractFirstName(user.name, user.email),
        EXPIRY_DATE: formatDateForEmail(user.expiryDate),
      },
    })

    if (error) {
      logger.error('email', 'Failed to send 24h retention email', new Error(error.message), {
        userId: user.id,
        email: user.email,
      })
      return { success: false, error: error.message }
    }

    logger.info('email', '24h retention email sent', {
      userId: user.id,
      email: user.email,
      emailId: data?.id,
    })

    return { success: true, emailId: data?.id }
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err))
    logger.error('email', 'Exception sending 24h retention email', error, { userId: user.id })
    return { success: false, error: error.message }
  }
}

/**
 * Send deletion confirmation email
 * Template params: {{FIRST_NAME}}, {{EXPIRY_DATE}}
 */
export async function sendRetentionDeletedEmail(user: {
  id: string
  email: string | null
  name: string | null
  expiryDate: Date
}): Promise<{ success: boolean; emailId?: string; error?: string }> {
  if (!resend) {
    logger.warn('email', 'Resend API key not configured, skipping deletion email', { userId: user.id })
    return { success: false, error: 'Resend API key not configured' }
  }

  if (!user.email) {
    logger.warn('email', 'User has no email address, skipping deletion email', { userId: user.id })
    return { success: false, error: 'User has no email address' }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'VisuTry <noreply@visutry.com>',
      to: user.email,
      subject: 'Your Try-On Results Have Been Deleted',
      // @ts-ignore
      template_id: TEMPLATES.RETENTION_DELETED,
      // @ts-ignore
      template_data: {
        FIRST_NAME: extractFirstName(user.name, user.email),
        EXPIRY_DATE: formatDateForEmail(user.expiryDate),
      },
    })

    if (error) {
      logger.error('email', 'Failed to send deletion email', new Error(error.message), {
        userId: user.id,
        email: user.email,
      })
      return { success: false, error: error.message }
    }

    logger.info('email', 'Deletion confirmation email sent', {
      userId: user.id,
      email: user.email,
      emailId: data?.id,
    })

    return { success: true, emailId: data?.id }
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err))
    logger.error('email', 'Exception sending deletion email', error, { userId: user.id })
    return { success: false, error: error.message }
  }
}
