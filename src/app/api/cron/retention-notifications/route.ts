import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import {
  sendRetention3DayEmail,
  sendRetention24HEmail,
} from '@/lib/resend'
import { getUserPlanType, PLAN_DISPLAY_NAMES } from '@/config/retention'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Cron job to send data retention reminder emails
 * - 3-day reminder: sent when user has tasks expiring in ~3 days
 * - 24-hour reminder: sent when user has tasks expiring in ~24 hours
 * 
 * Runs daily at 9:00 AM UTC
 */
export async function GET(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    logger.warn('api', 'Unauthorized cron access attempt', { endpoint: 'retention-notifications' })
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const results = {
    threeDayEmails: { sent: 0, failed: 0 },
    twentyFourHourEmails: { sent: 0, failed: 0 },
  }

  try {
    // Calculate date ranges
    const threeDaysFromNow = new Date(now)
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)
    const threeDaysFromNowEnd = new Date(threeDaysFromNow)
    threeDaysFromNowEnd.setDate(threeDaysFromNowEnd.getDate() + 1)

    const oneDayFromNow = new Date(now)
    oneDayFromNow.setDate(oneDayFromNow.getDate() + 1)
    const oneDayFromNowEnd = new Date(oneDayFromNow)
    oneDayFromNowEnd.setDate(oneDayFromNowEnd.getDate() + 1)

    // Find users with tasks expiring in 3 days (who haven't been notified)
    const usersFor3DayReminder = await prisma.user.findMany({
      where: {
        email: { not: null },
        tryOnTasks: {
          some: {
            expiresAt: {
              gte: threeDaysFromNow,
              lt: threeDaysFromNowEnd,
            },
          },
        },
        OR: [
          { lastRetention3DayEmailSent: null },
          { lastRetention3DayEmailSent: { lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } },
        ],
      },
      select: {
        id: true,
        email: true,
        name: true,
        isPremium: true,
        currentSubscriptionType: true,
        creditsPurchased: true,
        creditsUsed: true,
        tryOnTasks: {
          where: {
            expiresAt: {
              gte: threeDaysFromNow,
              lt: threeDaysFromNowEnd,
            },
          },
          select: { expiresAt: true },
          take: 1,
        },
      },
    })

    // Send 3-day reminder emails
    for (const user of usersFor3DayReminder) {
      const expiryDate = user.tryOnTasks[0]?.expiresAt
      if (!expiryDate) continue

      const planType = getUserPlanType(user)
      const result = await sendRetention3DayEmail({
        id: user.id,
        email: user.email,
        name: user.name,
        planDisplayName: PLAN_DISPLAY_NAMES[planType],
        expiryDate,
      })

      if (result.success) {
        await prisma.user.update({
          where: { id: user.id },
          data: { lastRetention3DayEmailSent: now },
        })
        results.threeDayEmails.sent++
      } else {
        results.threeDayEmails.failed++
      }
    }

    // Find users with tasks expiring in 24 hours (who haven't been notified)
    const usersFor24HReminder = await prisma.user.findMany({
      where: {
        email: { not: null },
        tryOnTasks: {
          some: {
            expiresAt: {
              gte: oneDayFromNow,
              lt: oneDayFromNowEnd,
            },
          },
        },
        OR: [
          { lastRetention24HEmailSent: null },
          { lastRetention24HEmailSent: { lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } },
        ],
      },
      select: {
        id: true,
        email: true,
        name: true,
        tryOnTasks: {
          where: {
            expiresAt: {
              gte: oneDayFromNow,
              lt: oneDayFromNowEnd,
            },
          },
          select: { expiresAt: true },
          take: 1,
        },
      },
    })

    // Send 24-hour reminder emails
    for (const user of usersFor24HReminder) {
      const expiryDate = user.tryOnTasks[0]?.expiresAt
      if (!expiryDate) continue

      const result = await sendRetention24HEmail({
        id: user.id,
        email: user.email,
        name: user.name,
        expiryDate,
      })

      if (result.success) {
        await prisma.user.update({
          where: { id: user.id },
          data: { lastRetention24HEmailSent: now },
        })
        results.twentyFourHourEmails.sent++
      } else {
        results.twentyFourHourEmails.failed++
      }
    }

    logger.info('api', 'Retention notification cron completed', results)

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      results,
    })
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    logger.error('api', 'Retention notification cron failed', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

