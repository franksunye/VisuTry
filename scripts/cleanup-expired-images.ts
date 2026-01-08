
/**
 * Cleanup expired images and tasks
 * 
 * Usage:
 *   npx tsx scripts/cleanup-expired-images.ts [--dry-run]
 * 
 * Options:
 *   --dry-run    Preview deletions without removing data
 */

import { prisma } from '../src/lib/prisma'
import { del } from '@vercel/blob'
import { RETENTION_CONFIG, getUserPlanType, getRetentionDays, calculateExpiresAt } from '../src/config/retention'
import * as dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') })
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true })

const isDryRun = process.argv.includes('--dry-run')

async function main() {
    console.log('🧹 Cleanup Expired Images and Tasks')
    console.log(`   Mode: ${isDryRun ? 'DRY RUN (no deletions)' : 'LIVE'}`)
    console.log('')

    const now = new Date()

    // 1. Find tasks that are explicitly expired (expiresAt < now)
    const explicitlyExpiredTasks = await prisma.tryOnTask.findMany({
        where: {
            expiresAt: {
                lt: now
            }
        },
        select: {
            id: true,
            userImageUrl: true,
            itemImageUrl: true,
            resultImageUrl: true,
            expiresAt: true,
            userId: true
        }
    })

    // 2. Find tasks with NO expiresAt, calculate if they are expired
    // Note: limiting to a reasonable batch size if needed, but for cleanup we might want all.
    // We'll process these locally.
    const tasksWithoutExpiry = await prisma.tryOnTask.findMany({
        where: {
            expiresAt: null
        },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    isPremium: true,
                    creditsPurchased: true,
                    creditsUsed: true,
                    currentSubscriptionType: true
                }
            }
        }
    })

    const implicitlyExpiredTasks = []

    for (const task of tasksWithoutExpiry) {
        const planType = getUserPlanType(task.user)
        const retentionDays = getRetentionDays(planType)

        // Calculate expiration date based on creation time + retention days
        const expiresAt = new Date(task.createdAt)
        expiresAt.setDate(expiresAt.getDate() + retentionDays)

        if (expiresAt < now) {
            implicitlyExpiredTasks.push({
                id: task.id,
                userImageUrl: task.userImageUrl,
                itemImageUrl: task.itemImageUrl,
                resultImageUrl: task.resultImageUrl,
                expiresAt: expiresAt, // Calculated
                userId: task.userId
            })
        }
    }

    const allExpiredTasks = [...explicitlyExpiredTasks, ...implicitlyExpiredTasks]

    console.log(`📊 Found ${explicitlyExpiredTasks.length} tasks explicitly expired (expiresAt < now)`)
    console.log(`📊 Found ${implicitlyExpiredTasks.length} tasks implicitly expired (calculated)`)
    console.log(` Total tasks to cleanup: ${allExpiredTasks.length}`)
    console.log('')

    if (allExpiredTasks.length === 0) {
        console.log('✅ No expired tasks found!')
        return
    }

    // Collect all URLs to delete
    const urlsToDelete: string[] = []
    const taskIdsToDelete: string[] = []

    for (const task of allExpiredTasks) {
        if (task.userImageUrl) urlsToDelete.push(task.userImageUrl)
        if (task.itemImageUrl) urlsToDelete.push(task.itemImageUrl)
        if (task.resultImageUrl) urlsToDelete.push(task.resultImageUrl)
        taskIdsToDelete.push(task.id)
    }

    // Filter out non-blob URLs if necessary (e.g., if we have some external URLs not hosted by us)
    // Typically Vercel Blob URLs contain 'blob.vercel-storage.com'
    const blobUrls = urlsToDelete.filter(url => url.includes('blob.vercel-storage.com'))
    const otherUrls = urlsToDelete.filter(url => !url.includes('blob.vercel-storage.com'))

    console.log(`📦 Blobs identified: ${blobUrls.length}`)
    if (otherUrls.length > 0) {
        console.log(`⚠️  Non-blob URLs (will not be deleted via blob api): ${otherUrls.length}`)
    }

    console.log(`🗃️  Database records to delete: ${taskIdsToDelete.length}`)
    console.log('')

    if (isDryRun) {
        console.log('🔸 DRY RUN - First 5 entries that would be deleted:')
        allExpiredTasks.slice(0, 5).forEach(task => {
            console.log(`   Task ID: ${task.id}, User ID: ${task.userId}, Expired: ${task.expiresAt?.toISOString()}`)
        })
        console.log('   ...')
        console.log('')
        console.log('🔸 DRY RUN - No changes made.')
        return
    }

    // Perform Deletion

    // 1. Delete blobs in batches
    if (blobUrls.length > 0) {
        console.log('🗑️  Deleting blobs...')
        // Vercel Blob del needs to be handled carefully with limits? 
        // Docs say strictly: del(urls). We'll assume it handles list.
        // To be safe, let's chunk it.
        const CHUNK_SIZE = 100 // Conservative chunk size
        for (let i = 0; i < blobUrls.length; i += CHUNK_SIZE) {
            const chunk = blobUrls.slice(i, i + CHUNK_SIZE)
            try {
                await del(chunk)
                console.log(`   Deleted blob chunk ${Math.floor(i / CHUNK_SIZE) + 1}/${Math.ceil(blobUrls.length / CHUNK_SIZE)}`)

                // Add delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 2000))
            } catch (e) {
                console.error(`   ❌ Failed to delete blob chunk`, e)
            }
        }
    }

    // 2. Delete tasks from DB
    console.log('🗃️  Deleting database records...')
    try {
        const result = await prisma.tryOnTask.deleteMany({
            where: {
                id: {
                    in: taskIdsToDelete
                }
            }
        })
        console.log(`   ✅ Deleted ${result.count} tasks from database.`)

        // Update User retention email flags? 
        // Actually, if they are deleted, we don't need to track 'lastRetentionDeletedEmailSent' on the user anymore 
        // FOR THIS TASK. But maybe we should have sent an email?
        // The requirement is just "clean up". We won't send emails here.

    } catch (e) {
        console.error('   ❌ Failed to delete database records', e)
    }

    console.log('')
    console.log('🎉 Cleanup complete!')
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
