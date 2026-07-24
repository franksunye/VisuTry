import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getTryOnResult } from "@/lib/tryon-service"
import { logger } from "@/lib/logger"
import { TaskStatus } from "@prisma/client"
import { settleTryOnTaskQuota } from "@/lib/quota"

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes

/**
 * Cron job to sync pending GrsAi tasks
 * Runs every 3 minutes to check for completed async tasks
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Verify this is a cron request (Vercel adds this header)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      logger.warn('cron', 'Unauthorized cron request attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    logger.info('cron', 'Starting sync of pending GrsAi tasks')

    // Find active GrsAi tasks plus completed tasks whose quota settlement needs retry.
    const pendingTasks = await prisma.tryOnTask.findMany({
      where: {
        OR: [
          {
            status: TaskStatus.PROCESSING,
            metadata: {
              path: ['serviceType'],
              equals: 'grsai'
            }
          },
          {
            status: TaskStatus.COMPLETED,
            quotaSettledAt: null,
          }
        ]
      },
      select: {
        id: true,
        userId: true,
        createdAt: true,
        metadata: true
      },
      orderBy: {
        createdAt: 'asc' // Process older tasks first
      }
    })

    if (pendingTasks.length === 0) {
      logger.info('cron', 'No pending GrsAi tasks found')
      return NextResponse.json({ 
        success: true, 
        message: 'No pending tasks',
        processed: 0,
        duration: Date.now() - startTime
      })
    }

    logger.info('cron', `Found ${pendingTasks.length} pending GrsAi tasks`)

    let successCount = 0
    let errorCount = 0
    const errors: string[] = []

    // Process a single pending task (preserves all logging/monitoring behavior)
    const processTask = async (task: typeof pendingTasks[number]) => {
      try {
        logger.info('cron', `Processing task ${task.id}`)
        
        const result = await getTryOnResult(task.id)
        
        if (result.status === TaskStatus.COMPLETED) {
          const settlement = await settleTryOnTaskQuota(task.id, task.userId)
          successCount++
          logger.info('cron', `Task ${task.id} completed successfully`, {
            isNewCompletion: result.isNewCompletion,
            quotaSettled: settlement.settled,
            quotaAlreadySettled: settlement.alreadySettled,
          })
        } else if (result.status === TaskStatus.FAILED) {
          errorCount++
          logger.warn('cron', `Task ${task.id} failed`, { error: result.error })
        } else {
          // Still processing, continue
          logger.debug('cron', `Task ${task.id} still processing`, { 
            progress: result.progress 
          })
        }
        
      } catch (error) {
        errorCount++
        const errorMsg = `Task ${task.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
        errors.push(errorMsg)
        logger.error('cron', `Error processing task ${task.id}`, error as Error)
      }
    }

    // Process tasks in parallel with concurrency limit
    // (Promise.allSettled ensures one failure doesn't stop others)
    const CONCURRENCY = 5
    for (let i = 0; i < pendingTasks.length; i += CONCURRENCY) {
      const batch = pendingTasks.slice(i, i + CONCURRENCY)
      await Promise.allSettled(
        batch.map(task => processTask(task))
      )
    }

    const duration = Date.now() - startTime
    
    logger.info('cron', 'Sync pending tasks completed', {
      total: pendingTasks.length,
      successful: successCount,
      errors: errorCount,
      duration
    })

    return NextResponse.json({
      success: true,
      message: 'Sync completed',
      stats: {
        total: pendingTasks.length,
        successful: successCount,
        errors: errorCount,
        duration
      },
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    const duration = Date.now() - startTime
    logger.error('cron', 'Sync pending tasks failed', error as Error, { duration })
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration
    }, { status: 500 })
  }
}
