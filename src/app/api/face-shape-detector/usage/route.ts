import { NextResponse } from 'next/server'
import { TaskStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'

const ALLOWED_STATUSES = new Set<TaskStatus>([
  TaskStatus.COMPLETED,
  TaskStatus.FAILED,
])

export async function POST(request: Request) {
  try {
    const body = await request.json() as { status?: unknown }
    const status = body.status

    if (typeof status !== 'string' || !ALLOWED_STATUSES.has(status as TaskStatus)) {
      return NextResponse.json({ success: false }, { status: 400 })
    }

    await prisma.faceShapeDetection.create({
      data: { status: status as TaskStatus },
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch {
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
