/**
 * Send 3-day retention reminder emails to all users with historical data
 * and mark them as having received the notification
 * 
 * Usage:
 *   npx tsx scripts/send-historical-retention-emails.ts [--dry-run]
 * 
 * Options:
 *   --dry-run    Preview emails without sending or updating database
 */

import { PrismaClient } from '@prisma/client'
import { sendRetention3DayEmail } from '../src/lib/resend'
import { getUserPlanType, PLAN_DISPLAY_NAMES } from '../src/config/retention'

const prisma = new PrismaClient()

const isDryRun = process.argv.includes('--dry-run')

async function main() {
  console.log('📧 Send Historical Retention Emails')
  console.log(`   Mode: ${isDryRun ? 'DRY RUN (no emails sent)' : 'LIVE'}`)
  console.log('')

  const now = new Date()

  // Find all users who have tasks with expiresAt but haven't received 3-day reminder
  const usersWithTasks = await prisma.user.findMany({
    where: {
      email: { not: null },
      tryOnTasks: {
        some: {
          expiresAt: { not: null },
        },
      },
      // Only users who haven't received 3-day reminder yet
      lastRetention3DayEmailSent: null,
    },
    select: {
      id: true,
      email: true,
      name: true,
      isPremium: true,
      currentSubscriptionType: true,
      creditsPurchased: true,
      creditsUsed: true,
      tryOnTasks: {
        where: {
          expiresAt: { not: null },
        },
        select: {
          expiresAt: true,
        },
        orderBy: {
          expiresAt: 'desc', // Get the latest expiry date
        },
        take: 1,
      },
    },
  })

  console.log(`📊 Found ${usersWithTasks.length} users with historical tasks`)
  console.log('')

  if (usersWithTasks.length === 0) {
    console.log('✅ No users to process!')
    return
  }

  const results = {
    emailsSent: 0,
    emailsFailed: 0,
    usersUpdated: 0,
  }

  // Group by plan type for summary
  const planStats = new Map<string, number>()

  for (const user of usersWithTasks) {
    const latestExpiryDate = user.tryOnTasks[0]?.expiresAt
    if (!latestExpiryDate) continue

    const planType = getUserPlanType(user)
    const planDisplayName = PLAN_DISPLAY_NAMES[planType]
    
    // Update stats
    planStats.set(planDisplayName, (planStats.get(planDisplayName) || 0) + 1)

    console.log(`📤 Processing: ${user.email} (${planDisplayName})`)
    console.log(`   Latest expiry: ${latestExpiryDate.toLocaleDateString()}`)

    if (isDryRun) {
      console.log('   🔸 DRY RUN - Would send email and update user')
      results.emailsSent++
      results.usersUpdated++
      continue
    }

    // Send 3-day retention email
    const emailResult = await sendRetention3DayEmail({
      id: user.id,
      email: user.email,
      name: user.name,
      planDisplayName,
      expiryDate: latestExpiryDate,
    })

    if (emailResult.success) {
      // Mark user as having received 3-day reminder
      await prisma.user.update({
        where: { id: user.id },
        data: { lastRetention3DayEmailSent: now },
      })
      
      console.log(`   ✅ Email sent (ID: ${emailResult.emailId})`)
      results.emailsSent++
      results.usersUpdated++
    } else {
      console.log(`   ❌ Email failed: ${emailResult.error}`)
      results.emailsFailed++
    }

    // Delay to avoid rate limiting (Resend allows 2 requests/second)
    await new Promise(resolve => setTimeout(resolve, 600))
  }

  console.log('')
  console.log('📋 Summary by Plan:')
  console.log('─'.repeat(40))
  for (const [plan, count] of Array.from(planStats.entries())) {
    console.log(`   ${plan}: ${count} users`)
  }

  console.log('')
  console.log('📊 Results:')
  console.log(`   Emails sent: ${results.emailsSent}`)
  console.log(`   Emails failed: ${results.emailsFailed}`)
  console.log(`   Users updated: ${results.usersUpdated}`)

  if (isDryRun) {
    console.log('')
    console.log('🔸 DRY RUN - No emails sent or database changes made')
    console.log('   Run without --dry-run to send actual emails')
  } else {
    console.log('')
    console.log('✅ Done! All users have been notified and marked.')
    console.log('   Future cron jobs will handle new expiry notifications normally.')
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
