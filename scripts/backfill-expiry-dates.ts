/**
 * Backfill expiresAt for historical TryOnTask records
 * 
 * Usage:
 *   npx tsx scripts/backfill-expiry-dates.ts [--dry-run]
 * 
 * Options:
 *   --dry-run    Preview changes without updating database
 */

import { PrismaClient } from '@prisma/client'
import { RETENTION_CONFIG } from '../src/config/retention'

const prisma = new PrismaClient()

const isDryRun = process.argv.includes('--dry-run')

interface TaskWithUser {
  id: string
  createdAt: Date
  user: {
    id: string
    email: string | null
    isPremium: boolean
    creditsPurchased: number
    creditsUsed: number
  }
}

function getRetentionDays(user: TaskWithUser['user']): number {
  if (user.isPremium) {
    return RETENTION_CONFIG.PREMIUM_USER // 365 days
  }
  const hasCredits = (user.creditsPurchased - user.creditsUsed) > 0
  if (hasCredits) {
    return RETENTION_CONFIG.CREDITS_USER // 90 days
  }
  return RETENTION_CONFIG.FREE_USER // 7 days
}

function calculateExpiresAt(createdAt: Date, retentionDays: number): Date {
  const expiresAt = new Date(createdAt)
  expiresAt.setDate(expiresAt.getDate() + retentionDays)
  return expiresAt
}

async function main() {
  console.log('🔍 Backfill TryOnTask expiresAt')
  console.log(`   Mode: ${isDryRun ? 'DRY RUN (no changes)' : 'LIVE'}`)
  console.log('')

  // Find all tasks without expiresAt
  const tasksWithoutExpiry = await prisma.tryOnTask.findMany({
    where: {
      expiresAt: null,
    },
    select: {
      id: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          email: true,
          isPremium: true,
          creditsPurchased: true,
          creditsUsed: true,
        },
      },
    },
  })

  console.log(`📊 Found ${tasksWithoutExpiry.length} tasks without expiresAt`)
  console.log('')

  if (tasksWithoutExpiry.length === 0) {
    console.log('✅ Nothing to do!')
    return
  }

  // Group by user for summary
  const userStats = new Map<string, {
    email: string | null
    planType: string
    retentionDays: number
    taskCount: number
    alreadyExpired: number
  }>()

  const now = new Date()
  const updates: { id: string; expiresAt: Date }[] = []

  for (const task of tasksWithoutExpiry) {
    const retentionDays = getRetentionDays(task.user)
    const expiresAt = calculateExpiresAt(task.createdAt, retentionDays)
    const isExpired = expiresAt <= now

    updates.push({ id: task.id, expiresAt })

    // Update stats
    const userId = task.user.id
    if (!userStats.has(userId)) {
      const planType = task.user.isPremium 
        ? 'Premium' 
        : (task.user.creditsPurchased - task.user.creditsUsed) > 0 
          ? 'Credits' 
          : 'Free'
      userStats.set(userId, {
        email: task.user.email,
        planType,
        retentionDays,
        taskCount: 0,
        alreadyExpired: 0,
      })
    }
    const stats = userStats.get(userId)!
    stats.taskCount++
    if (isExpired) stats.alreadyExpired++
  }

  // Print summary by user
  console.log('📋 Summary by User:')
  console.log('─'.repeat(80))
  
  let totalExpired = 0
  for (const [userId, stats] of Array.from(userStats.entries())) {
    totalExpired += stats.alreadyExpired
    console.log(`   ${stats.email || userId}`)
    console.log(`      Plan: ${stats.planType} (${stats.retentionDays} days retention)`)
    console.log(`      Tasks: ${stats.taskCount}, Already expired: ${stats.alreadyExpired}`)
  }

  console.log('─'.repeat(80))
  console.log(`📊 Total: ${updates.length} tasks, ${totalExpired} already expired`)
  console.log('')

  if (isDryRun) {
    console.log('🔸 DRY RUN - No changes made')
    console.log('   Run without --dry-run to apply changes')
    return
  }

  // Apply updates
  console.log('💾 Updating database...')
  
  let updated = 0
  for (const { id, expiresAt } of updates) {
    await prisma.tryOnTask.update({
      where: { id },
      data: { expiresAt },
    })
    updated++
    if (updated % 100 === 0) {
      console.log(`   Updated ${updated}/${updates.length}...`)
    }
  }

  console.log('')
  console.log(`✅ Done! Updated ${updated} tasks`)
  console.log('')
  console.log('⚠️  Note: Some tasks are already "expired" based on the rules.')
  console.log('   Keep cleanup cron disabled for a few days to let notification emails go out first.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

