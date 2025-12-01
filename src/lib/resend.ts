import { Resend } from 'resend'
import { logger } from '@/lib/logger'

// Initialize Resend client
const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY)
  : null

// Template alias for welcome email
const WELCOME_EMAIL_TEMPLATE_ALIAS = 'simple-html-welcome-email-template-for-visutrycom'

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
      template_id: WELCOME_EMAIL_TEMPLATE_ALIAS,
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

