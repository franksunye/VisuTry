import { Resend } from 'resend'
import { logger } from '@/lib/logger'

// Initialize Resend client
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

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
  if (!resend) {
    logger.warn('email', 'Resend not configured', { userId: user.id })
    return { success: false, error: 'Resend not configured' }
  }
  if (!user.email) {
    logger.warn('email', 'User has no email', { userId: user.id })
    return { success: false, error: 'User has no email address' }
  }

  const firstName = extractFirstName(user.name, user.email)

  try {
    const { data, error } = await resend.emails.send({
      from: 'VisuTry <noreply@visutry.com>',
      to: user.email,
      subject: 'Welcome to VisuTry! 🎉',
      text: `Hi ${firstName},\n\nWelcome to VisuTry! We're excited to have you.\n\nStart trying on glasses virtually at https://www.visutry.com\n\nThank you,\nThe VisuTry Team`,
    })

    if (error) {
      logger.error('email', 'Failed to send welcome email', new Error(error.message), { userId: user.id })
      return { success: false, error: error.message }
    }

    logger.info('email', 'Welcome email sent', { userId: user.id, emailId: data?.id })
    return { success: true, emailId: data?.id }
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err))
    logger.error('email', 'Exception sending welcome email', error, { userId: user.id })
    return { success: false, error: error.message }
  }
}

/**
 * Send 3-day retention reminder email
 */
export async function sendRetention3DayEmail(user: {
  id: string
  email: string | null
  name: string | null
  planDisplayName: string
  expiryDate: Date
}): Promise<{ success: boolean; emailId?: string; error?: string }> {
  if (!resend) {
    logger.warn('email', 'Resend not configured', { userId: user.id })
    return { success: false, error: 'Resend not configured' }
  }
  if (!user.email) {
    logger.warn('email', 'User has no email', { userId: user.id })
    return { success: false, error: 'User has no email address' }
  }

  const firstName = extractFirstName(user.name, user.email)
  const expiryDate = formatDateForEmail(user.expiryDate)

  const textContent = `Hi ${firstName},

We hope you've enjoyed using Visutry. As part of our commitment to privacy and efficient resource use, we remove stored Try‑On images after a certain period depending on your plan. Here's how our storage retention works:

Plan type & storage retention
• Free users: data retained for 7 days
• Credits Pack users: data retained for 90 days
• Standard (or Paid) users: data retained for 1 year

Your current plan: ${user.planDisplayName}
Your stored Try‑On results will expire on ${expiryDate}.

To keep any images or history beyond that date, please log in to your dashboard at visutry.com and download any results you want to keep.

👉 Or — consider upgrading to a longer‑term plan: check our full pricing & storage options here: https://www.visutry.com/pricing

If you have any questions or need help, feel free to contact us at support@visutry.com.

Thank you for being with us,
The Visutry Team`

  try {
    const { data, error } = await resend.emails.send({
      from: 'Support <support@visutry.com>',
      to: user.email,
      subject: 'Your Visutry Try‑On data expiry coming up — choose how long to keep it',
      text: textContent,
    })

    if (error) {
      logger.error('email', 'Failed to send 3-day retention email', new Error(error.message), { userId: user.id })
      return { success: false, error: error.message }
    }

    logger.info('email', '3-day retention email sent', { userId: user.id, emailId: data?.id })
    return { success: true, emailId: data?.id }
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err))
    logger.error('email', 'Exception sending 3-day email', error, { userId: user.id })
    return { success: false, error: error.message }
  }
}

/**
 * Send 24-hour final reminder email
 */
export async function sendRetention24HEmail(user: {
  id: string
  email: string | null
  name: string | null
  expiryDate: Date
}): Promise<{ success: boolean; emailId?: string; error?: string }> {
  if (!resend) {
    logger.warn('email', 'Resend not configured', { userId: user.id })
    return { success: false, error: 'Resend not configured' }
  }
  if (!user.email) {
    logger.warn('email', 'User has no email', { userId: user.id })
    return { success: false, error: 'User has no email address' }
  }

  const firstName = extractFirstName(user.name, user.email)
  const expiryDate = formatDateForEmail(user.expiryDate)

  const textContent = `Hi ${firstName},

Just a friendly reminder — your Try‑On results stored on Visutry are set to be automatically deleted tomorrow (${expiryDate}).

If you'd like to keep any of your virtual try-on images, please log in now and download them before they're removed:
👉 https://www.visutry.com/dashboard

Want to keep your data longer? Consider upgrading your plan:
👉 https://www.visutry.com/pricing

If you have any questions, feel free to reach out at support@visutry.com.

Thank you,
The Visutry Team`

  try {
    const { data, error } = await resend.emails.send({
      from: 'Support <support@visutry.com>',
      to: user.email,
      subject: '⚠️ Final Notice: Your Try-On Results Will Be Deleted Tomorrow',
      text: textContent,
    })

    if (error) {
      logger.error('email', 'Failed to send 24h email', new Error(error.message), { userId: user.id })
      return { success: false, error: error.message }
    }

    logger.info('email', '24h retention email sent', { userId: user.id, emailId: data?.id })
    return { success: true, emailId: data?.id }
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err))
    logger.error('email', 'Exception sending 24h email', error, { userId: user.id })
    return { success: false, error: error.message }
  }
}

/**
 * Send deletion confirmation email
 */
export async function sendRetentionDeletedEmail(user: {
  id: string
  email: string | null
  name: string | null
  expiryDate: Date
}): Promise<{ success: boolean; emailId?: string; error?: string }> {
  if (!resend) {
    logger.warn('email', 'Resend not configured', { userId: user.id })
    return { success: false, error: 'Resend not configured' }
  }
  if (!user.email) {
    logger.warn('email', 'User has no email', { userId: user.id })
    return { success: false, error: 'User has no email address' }
  }

  const firstName = extractFirstName(user.name, user.email)
  const expiryDate = formatDateForEmail(user.expiryDate)

  const textContent = `Hi ${firstName},

As scheduled, we've permanently deleted your Try‑On results from Visutry (original expiry date: ${expiryDate}). This includes all images and history associated with your account.

If you'd like to start fresh with new try-ons, you're always welcome back:
👉 https://www.visutry.com

Want longer data retention next time? Check out our plans:
👉 https://www.visutry.com/pricing

If you have any questions, contact us at support@visutry.com.

Thank you for using Visutry,
The Visutry Team`

  try {
    const { data, error } = await resend.emails.send({
      from: 'Support <support@visutry.com>',
      to: user.email,
      subject: 'Your Try-On Results Have Been Deleted',
      text: textContent,
    })

    if (error) {
      logger.error('email', 'Failed to send deletion email', new Error(error.message), { userId: user.id })
      return { success: false, error: error.message }
    }

    logger.info('email', 'Deletion email sent', { userId: user.id, emailId: data?.id })
    return { success: true, emailId: data?.id }
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err))
    logger.error('email', 'Exception sending deletion email', error, { userId: user.id })
    return { success: false, error: error.message }
  }
}
