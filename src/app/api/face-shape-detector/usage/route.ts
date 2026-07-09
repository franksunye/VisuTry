import { NextResponse } from 'next/server'
import { TaskStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { FACE_SHAPE_FAILURE_REASONS } from '@/config/face-analysis'

const ALLOWED_STATUSES = new Set<TaskStatus>([
  TaskStatus.COMPLETED,
  TaskStatus.FAILED,
])

const ALLOWED_FAILURE_REASONS = new Set<string>(FACE_SHAPE_FAILURE_REASONS)

export async function POST(request: Request) {
  try {
    const body = await request.json() as { status?: unknown; failureReason?: unknown }
    const status = body.status

    if (typeof status !== 'string' || !ALLOWED_STATUSES.has(status as TaskStatus)) {
      return NextResponse.json({ success: false }, { status: 400 })
    }

    // failureReason is only meaningful for FAILED records; ignore it for COMPLETED.
    const rawReason = body.failureReason
    const failureReason =
      status === TaskStatus.FAILED &&
      typeof rawReason === 'string' &&
      ALLOWED_FAILURE_REASONS.has(rawReason)
        ? rawReason
        : null

    await prisma.faceShapeDetection.create({
      data: {
        status: status as TaskStatus,
        failureReason,
      },
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch {
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
