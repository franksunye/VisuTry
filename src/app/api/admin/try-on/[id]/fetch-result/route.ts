import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getTryOnResult } from '@/lib/tryon-service';
import { TaskStatus } from '@prisma/client';
import { logger, getRequestContext } from '@/lib/logger';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/try-on/[id]/fetch-result
 * 
 * Admin endpoint to manually trigger fetching result for a pending/processing task.
 * This is useful when async tasks (GrsAi) are stuck in PENDING/PROCESSING status.
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const ctx = getRequestContext(request);
    const taskId = params.id;
    const startTime = Date.now();

    logger.info('api', `[Admin Fetch Result] Request received`, {
        taskId,
        ...ctx,
    });

    try {
        // 1. Verify admin permissions
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            logger.warn('api', `[Admin Fetch Result] Unauthorized access attempt`, {
                taskId,
                ...ctx,
            });
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        if (session.user.role !== 'ADMIN') {
            logger.warn('api', `[Admin Fetch Result] Non-admin access attempt`, {
                taskId,
                userId: session.user.id,
                userEmail: session.user.email,
                ...ctx,
            });
            return NextResponse.json(
                { success: false, error: 'Forbidden - Admin access required' },
                { status: 403 }
            );
        }

        const adminEmail = session.user.email;
        logger.info('api', `[Admin Fetch Result] Admin authenticated`, {
            taskId,
            adminEmail,
        });

        // 2. Check if task exists
        const task = await prisma.tryOnTask.findUnique({
            where: { id: taskId },
            select: {
                id: true,
                status: true,
                metadata: true,
                userId: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!task) {
            logger.warn('api', `[Admin Fetch Result] Task not found`, {
                taskId,
                adminEmail,
            });
            return NextResponse.json(
                { success: false, error: 'Task not found' },
                { status: 404 }
            );
        }

        const metadata = task.metadata as any;
        logger.info('api', `[Admin Fetch Result] Task found`, {
            taskId,
            currentStatus: task.status,
            serviceType: metadata?.serviceType,
            externalTaskId: metadata?.externalTaskId,
            taskUserId: task.userId,
            createdAt: task.createdAt,
            updatedAt: task.updatedAt,
            adminEmail,
        });

        // 3. Check if task is eligible for result fetching
        if (task.status === TaskStatus.COMPLETED) {
            logger.info('api', `[Admin Fetch Result] Task already completed, skipping`, {
                taskId,
                status: task.status,
            });
            return NextResponse.json({
                success: true,
                data: {
                    message: 'Task is already completed',
                    status: task.status,
                    noChange: true,
                },
            });
        }

        if (task.status === TaskStatus.FAILED) {
            logger.info('api', `[Admin Fetch Result] Task already failed, skipping`, {
                taskId,
                status: task.status,
            });
            return NextResponse.json({
                success: true,
                data: {
                    message: 'Task has already failed, cannot fetch result',
                    status: task.status,
                    noChange: true,
                },
            });
        }

        // 4. Check if this is a GrsAi task with external ID
        if (!metadata?.externalTaskId) {
            logger.warn('api', `[Admin Fetch Result] Task has no external ID`, {
                taskId,
                metadata: metadata,
            });
            return NextResponse.json({
                success: false,
                error: 'Task has no external ID, cannot poll for result',
            }, { status: 400 });
        }

        logger.info('grsai', `[Admin Fetch Result] Starting GrsAi polling`, {
            taskId,
            externalTaskId: metadata.externalTaskId,
            serviceType: metadata.serviceType,
            currentStatus: task.status,
        });

        // 5. Call getTryOnResult to poll and update the task
        const pollStartTime = Date.now();
        const result = await getTryOnResult(taskId);
        const pollDuration = Date.now() - pollStartTime;

        logger.info('grsai', `[Admin Fetch Result] GrsAi polling completed`, {
            taskId,
            externalTaskId: metadata.externalTaskId,
            pollDuration: `${pollDuration}ms`,
            resultStatus: result.status,
            hasResultImage: !!result.resultImageUrl,
            progress: result.progress,
            error: result.error,
            isNewCompletion: result.isNewCompletion,
        });

        // 6. Fetch updated task to return current state
        const updatedTask = await prisma.tryOnTask.findUnique({
            where: { id: taskId },
            select: {
                id: true,
                status: true,
                resultImageUrl: true,
                errorMessage: true,
                updatedAt: true,
            },
        });

        const totalDuration = Date.now() - startTime;
        const statusChanged = task.status !== updatedTask?.status;

        logger.info('api', `[Admin Fetch Result] Request completed`, {
            taskId,
            externalTaskId: metadata.externalTaskId,
            previousStatus: task.status,
            currentStatus: updatedTask?.status,
            statusChanged,
            hasResultImage: !!updatedTask?.resultImageUrl,
            totalDuration: `${totalDuration}ms`,
            pollDuration: `${pollDuration}ms`,
            adminEmail,
        });

        return NextResponse.json({
            success: true,
            data: {
                message: statusChanged
                    ? `Task status changed from ${task.status} to ${updatedTask?.status}`
                    : `Task result fetched successfully (status unchanged: ${task.status})`,
                previousStatus: task.status,
                currentStatus: updatedTask?.status,
                statusChanged,
                resultImageUrl: updatedTask?.resultImageUrl,
                error: updatedTask?.errorMessage,
                pollResult: result,
                timing: {
                    totalDuration: `${totalDuration}ms`,
                    pollDuration: `${pollDuration}ms`,
                },
            },
        });
    } catch (error) {
        const totalDuration = Date.now() - startTime;
        logger.error('api', `[Admin Fetch Result] Error occurred`, error as Error, {
            taskId,
            totalDuration: `${totalDuration}ms`,
            ...ctx,
        });
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Failed to fetch task result' },
            { status: 500 }
        );
    }
}
