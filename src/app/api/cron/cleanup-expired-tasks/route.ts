import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { del } from '@vercel/blob'
import { logger } from '@/lib/logger'
import { sendRetentionDeletedEmail } from '@/lib/resend'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Cron job to cleanup expired try-on tasks and send deletion notifications
 * 
 * 1. Find all expired tasks
 * 2. Group by user for sending deletion emails
 * 3. Delete blob storage files
 * 4. Delete database records
 * 5. Send deletion notification emails
 * 
 * Runs daily at 2:00 AM UTC
 */
export async function GET(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    logger.warn('api', 'Unauthorized cron access attempt', { endpoint: 'cleanup-expired-tasks' })
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const results = {
    tasksDeleted: 0,
    blobsDeleted: 0,
    emailsSent: 0,
    emailsFailed: 0,
  }

  try {
    // Find expired tasks with user info
    const expiredTasks = await prisma.tryOnTask.findMany({
      where: {
        expiresAt: { lte: now },
      },
      select: {
        id: true,
        userId: true,
        userImageUrl: true,
        itemImageUrl: true,
        glassesImageUrl: true,
        resultImageUrl: true,
        expiresAt: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            lastRetentionDeletedEmailSent: true,
          },
        },
      },
    })

    if (expiredTasks.length === 0) {
      logger.info('api', 'No expired tasks to cleanup')
      return NextResponse.json({
        success: true,
        timestamp: now.toISOString(),
        message: 'No expired tasks',
        results,
      })
    }

    console.log(`[Cleanup] Found ${expiredTasks.length} expired tasks`)

    // Collect blob URLs to delete
    const urlsToDelete: string[] = []
    expiredTasks.forEach(task => {
      if (task.userImageUrl) urlsToDelete.push(task.userImageUrl)
      if (task.itemImageUrl) urlsToDelete.push(task.itemImageUrl)
      if (task.glassesImageUrl) urlsToDelete.push(task.glassesImageUrl)
      if (task.resultImageUrl) urlsToDelete.push(task.resultImageUrl)
    })

    // Group tasks by user for email notifications
    const userTaskMap = new Map<string, {
      user: typeof expiredTasks[0]['user']
      expiryDate: Date
    }>()

    expiredTasks.forEach(task => {
      if (!userTaskMap.has(task.userId) && task.user.email) {
        userTaskMap.set(task.userId, {
          user: task.user,
          expiryDate: task.expiresAt || now,
        })
      }
    })

    // Delete database records
    const deleteResult = await prisma.tryOnTask.deleteMany({
      where: { id: { in: expiredTasks.map(t => t.id) } },
    })
    results.tasksDeleted = deleteResult.count

    // Delete blob files
    if (urlsToDelete.length > 0) {
      try {
        await del(urlsToDelete)
        results.blobsDeleted = urlsToDelete.length
        console.log(`[Cleanup] Deleted ${urlsToDelete.length} blob files`)
      } catch (blobError) {
        logger.error('api', 'Failed to delete some blob files', 
          blobError instanceof Error ? blobError : new Error(String(blobError)))
      }
    }

    // Send deletion notification emails
    const userEntries = Array.from(userTaskMap.entries())
    for (const [userId, { user, expiryDate }] of userEntries) {
      // Skip if already sent deletion email recently (within 24 hours)
      const lastSent = user.lastRetentionDeletedEmailSent
      if (lastSent && (now.getTime() - lastSent.getTime()) < 24 * 60 * 60 * 1000) {
        continue
      }

      const result = await sendRetentionDeletedEmail({
        id: user.id,
        email: user.email,
        name: user.name,
        expiryDate,
      })

      if (result.success) {
        await prisma.user.update({
          where: { id: userId },
          data: { lastRetentionDeletedEmailSent: now },
        })
        results.emailsSent++
      } else {
        results.emailsFailed++
      }
    }

    logger.info('api', 'Cleanup expired tasks cron completed', results)

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      results,
    })
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    logger.error('api', 'Cleanup expired tasks cron failed', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

