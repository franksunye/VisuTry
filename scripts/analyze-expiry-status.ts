
import * as dotenv from 'dotenv'
import path from 'path'
import { PrismaClient } from '@prisma/client'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const prisma = new PrismaClient()

async function main() {
  const now = new Date()
  console.log(`Current Time: ${now.toISOString()}`)

  try {
    const allTasks = await prisma.tryOnTask.findMany({
      include: {
        user: true
      }
    })

    console.log(`Total Tasks: ${allTasks.length}`)

    const stats = {
      total: allTasks.length,
      expired: 0,
      shouldBeExpired: 0
    }

    const RETENTION = {
      FREE: 7,
      CREDITS: 90,
      PREMIUM: 365
    }

    for (const task of allTasks) {
      if (task.expiresAt && task.expiresAt <= now) {
        stats.expired++
      }

      let retentionDays = RETENTION.FREE
      if (task.user.isPremium) {
        retentionDays = RETENTION.PREMIUM
      } else if ((task.user.creditsPurchased - task.user.creditsUsed) > 0) {
        retentionDays = RETENTION.CREDITS
      }

      const shouldExpireAt = new Date(task.createdAt)
      shouldExpireAt.setDate(shouldExpireAt.getDate() + retentionDays)

      if (shouldExpireAt <= now) {
        stats.shouldBeExpired++
      }
    }

    console.log('Results:', stats)
  } catch (err) {
    console.error('Error:', err)
  } finally {
    await prisma.$disconnect()
  }
}

main()
