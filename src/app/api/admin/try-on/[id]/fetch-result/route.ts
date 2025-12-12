import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getTryOnResult } from '@/lib/tryon-service';
import { TaskStatus } from '@prisma/client';

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
    try {
        // 1. Verify admin permissions
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        if (session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, error: 'Forbidden - Admin access required' },
                { status: 403 }
            );
        }

        const taskId = params.id;

        // 2. Check if task exists
        const task = await prisma.tryOnTask.findUnique({
            where: { id: taskId },
            select: {
                id: true,
                status: true,
                metadata: true,
                userId: true,
            },
        });

        if (!task) {
            return NextResponse.json(
                { success: false, error: 'Task not found' },
                { status: 404 }
            );
        }

        // 3. Check if task is eligible for result fetching
        // Only PENDING or PROCESSING tasks should be polled
        if (task.status === TaskStatus.COMPLETED) {
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
        const metadata = task.metadata as any;
        if (!metadata?.externalTaskId) {
            return NextResponse.json({
                success: false,
                error: 'Task has no external ID, cannot poll for result',
            }, { status: 400 });
        }

        console.log(`[Admin Fetch Result] Fetching result for task ${taskId}, external ID: ${metadata.externalTaskId}`);

        // 5. Call getTryOnResult to poll and update the task
        const result = await getTryOnResult(taskId);

        console.log(`[Admin Fetch Result] Result for task ${taskId}:`, result);

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

        return NextResponse.json({
            success: true,
            data: {
                message: `Task result fetched successfully`,
                previousStatus: task.status,
                currentStatus: updatedTask?.status,
                resultImageUrl: updatedTask?.resultImageUrl,
                error: updatedTask?.errorMessage,
                pollResult: result,
            },
        });
    } catch (error) {
        console.error('[Admin Fetch Result] Error:', error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Failed to fetch task result' },
            { status: 500 }
        );
    }
}
