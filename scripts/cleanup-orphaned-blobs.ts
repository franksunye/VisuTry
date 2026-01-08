
/**
 * Cleanup Orphaned Blobs
 * 
 * This script finds blobs in Vercel Blob storage that are NOT referenced 
 * in the database (orphans) and deletes them to free up space.
 * 
 * This is useful when database records are deleted but associated blobs 
 * failed to delete (e.g. due to rate limits or errors).
 * 
 * Usage:
 *   npx tsx scripts/cleanup-orphaned-blobs.ts [--dry-run]
 */

import { prisma } from '../src/lib/prisma'
import { list, del } from '@vercel/blob'
import * as dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') })
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true })

const isDryRun = process.argv.includes('--dry-run')

async function getAllDatabaseUrls(): Promise<Set<string>> {
    console.log('🔍 Fetching all valid image URLs from database...')
    const validUrls = new Set<string>()

    // 1. TryOnTasks
    console.log('   Fetching TryOnTask images...')
    const tasks = await prisma.tryOnTask.findMany({
        select: {
            userImageUrl: true,
            itemImageUrl: true,
            resultImageUrl: true
        }
    })

    for (const task of tasks) {
        if (task.userImageUrl) validUrls.add(task.userImageUrl)
        if (task.itemImageUrl) validUrls.add(task.itemImageUrl)
        if (task.resultImageUrl) validUrls.add(task.resultImageUrl)
    }
    console.log(`   Found ${tasks.length} tasks, contributing to valid URLs.`)

    // 2. Users (profile images)
    console.log('   Fetching User profile images...')
    const users = await prisma.user.findMany({
        where: { image: { not: null } },
        select: { image: true }
    })
    for (const user of users) {
        if (user.image && user.image.includes('blob.vercel-storage.com')) {
            validUrls.add(user.image)
        }
    }

    // 3. GlassesFrames
    console.log('   Fetching GlassesFrame images...')
    const frames = await prisma.glassesFrame.findMany({
        select: { imageUrl: true }
    })
    for (const frame of frames) {
        if (frame.imageUrl && frame.imageUrl.includes('blob.vercel-storage.com')) {
            validUrls.add(frame.imageUrl)
        }
    }

    console.log(`✅ Total unique valid URLs in database: ${validUrls.size}`)
    return validUrls
}

async function main() {
    console.log('🧹 Cleanup Orphaned Blobs')
    console.log(`   Mode: ${isDryRun ? 'DRY RUN (no deletions)' : 'LIVE'}`)
    console.log('')

    try {
        const validUrls = await getAllDatabaseUrls()

        console.log('🔍 Listing all blobs from storage...')
        let cursor: string | undefined
        let hasMore = true
        const orphanedUrls: string[] = []
        let totalBlobs = 0

        while (hasMore) {
            const response = await list({
                cursor,
                limit: 1000 // Max limit per request
            })

            const blobs = response.blobs
            hasMore = response.hasMore
            cursor = response.cursor

            totalBlobs += blobs.length

            for (const blob of blobs) {
                // We care about both 'tryon/' (new) and 'try-on/' (legacy/variant) folders.
                const isTargetFolder = blob.pathname.startsWith('tryon/') || blob.pathname.startsWith('try-on/')

                if (isTargetFolder && !validUrls.has(blob.url)) {
                    orphanedUrls.push(blob.url)
                }
            }

            process.stdout.write(`   Scanned ${totalBlobs} blobs... Found ${orphanedUrls.length} orphans so far.\r`)
        }
        console.log('')
        console.log(`📊 Scan Complete. Total Blobs: ${totalBlobs}`)
        console.log(`🗑️  Orphaned Blobs (in 'tryon/' path and not in DB): ${orphanedUrls.length}`)
        console.log('')

        if (orphanedUrls.length === 0) {
            console.log('✅ No orphaned blobs found.')
            return
        }

        if (isDryRun) {
            console.log('🔸 DRY RUN - First 5 blobs that would be deleted:')
            orphanedUrls.slice(0, 5).forEach(url => console.log(`   ${url}`))
            console.log('   ...')
            return
        }

        // Delete orphans
        console.log('🚀 Starting deletion...')
        const CHUNK_SIZE = 50 // Smaller chunk size to be safe
        const DELAY_MS = 2000

        for (let i = 0; i < orphanedUrls.length; i += CHUNK_SIZE) {
            const chunk = orphanedUrls.slice(i, i + CHUNK_SIZE)
            try {
                await del(chunk)
                console.log(`   Deleted chunk ${Math.floor(i / CHUNK_SIZE) + 1}/${Math.ceil(orphanedUrls.length / CHUNK_SIZE)} (${chunk.length} files)`)

                if (i + CHUNK_SIZE < orphanedUrls.length) {
                    await new Promise(resolve => setTimeout(resolve, DELAY_MS))
                }
            } catch (e) {
                console.error(`   ❌ Failed to delete chunk`, e)
                // Wait longer on error
                await new Promise(resolve => setTimeout(resolve, 5000))
            }
        }

        console.log('🎉 Cleanup complete!')

    } catch (error) {
        console.error('❌ Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
