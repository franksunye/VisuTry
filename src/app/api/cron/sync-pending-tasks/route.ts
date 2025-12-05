import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getTryOnResult } from "@/lib/tryon-service"
import { logger } from "@/lib/logger"
import { TaskStatus } from "@prisma/client"

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

    // Find all PROCESSING tasks that use GrsAi service
    const pendingTasks = await prisma.tryOnTask.findMany({
      where: {
        status: TaskStatus.PROCESSING,
        metadata: {
          path: ['serviceType'],
          equals: 'grsai'
        }
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

    // Process each pending task
    for (const task of pendingTasks) {
      try {
        logger.info('cron', `Processing task ${task.id}`)
        
        const result = await getTryOnResult(task.id)
        
        if (result.status === TaskStatus.COMPLETED) {
          successCount++
          logger.info('cron', `Task ${task.id} completed successfully`, {
            isNewCompletion: result.isNewCompletion
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
