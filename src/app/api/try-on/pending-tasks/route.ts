import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getRequestContext, logger } from "@/lib/logger"
import { TaskStatus } from "@prisma/client"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const ctx = getRequestContext(request)
  try {
    // 1. Authentication
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access" },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      )
    }

    // 2. Find latest active or recent task
    // Logic:
    // - If status is PENDING or PROCESSING: Return it (User waiting for result)
    // - If status is COMPLETED or FAILED: Return only if very recent (< 5 mins) (User refreshed right after completion)
    // - Global safety cutoff: Don't return anything older than 30 minutes to avoid zombies
    
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)

    const latestTask = await prisma.tryOnTask.findFirst({
      where: {
        userId: user.id,
        createdAt: {
          gt: thirtyMinutesAgo
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (!latestTask) {
      return NextResponse.json([])
    }

    // Filter based on status logic
    let shouldRecover = false

    if (latestTask.status === TaskStatus.PENDING || latestTask.status === TaskStatus.PROCESSING) {
      shouldRecover = true
    } else if (latestTask.createdAt > fiveMinutesAgo) {
      // It's COMPLETED or FAILED, but very recent, so we show it
      shouldRecover = true
    }

    if (shouldRecover) {
      return NextResponse.json([{
        taskId: latestTask.id,
        status: latestTask.status,
        resultImageUrl: latestTask.resultImageUrl,
        createdAt: latestTask.createdAt,
        // Pass minimal metadata needed for UI
        serviceType: (latestTask.metadata as any)?.serviceType,
        isAsync: (latestTask.metadata as any)?.isAsync,
        error: latestTask.errorMessage
      }])
    }

    return NextResponse.json([])

  } catch (error) {
    console.error("Pending Tasks API error:", error)
    logger.error('api', 'Pending Tasks API error', error as Error, ctx)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
