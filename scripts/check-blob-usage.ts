
/**
 * Check Blob Storage Usage
 * 
 * Lists all blobs in Vercel Blob storage and calculates current real-time usage.
 * Helps verify if cleanup was successful, as the Vercel dashboard metrics 
 * (like "Average Storage") may be delayed or calculated over a billing period.
 * 
 * Usage:
 *   npx tsx scripts/check-blob-usage.ts
 */

import { list } from '@vercel/blob'
import * as dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') })
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true })

async function main() {
    console.log('📊 Checking Real-time Blob Storage Usage...')
    console.log('   (Connecting to Vercel Blob via API...)')
    console.log('')

    try {
        let cursor: string | undefined
        let hasMore = true
        let totalBlobs = 0
        let totalSize = 0
        const folderStats = new Map<string, { count: number, size: number }>()

        while (hasMore) {
            const response = await list({
                cursor,
                limit: 1000
            })

            const blobs = response.blobs
            hasMore = response.hasMore
            cursor = response.cursor

            totalBlobs += blobs.length

            for (const blob of blobs) {
                totalSize += blob.size

                // Group by top-level folder
                const pathParts = blob.pathname.split('/')
                const folder = pathParts.length > 1 ? pathParts[0] + '/' : '(root)'

                const stats = folderStats.get(folder) || { count: 0, size: 0 }
                stats.count++
                stats.size += blob.size
                folderStats.set(folder, stats)
            }

            process.stdout.write(`   Scanned ${totalBlobs} blobs...\r`)
        }

        console.log('')
        console.log('✅ Scan Complete.')
        console.log('')

        // Convert bytes to MB
        const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2)

        console.log(`📈 Current Total Usage:`)
        console.log(`   Files: ${totalBlobs}`)
        console.log(`   Size:  ${totalSizeMB} MB`)
        console.log('')

        console.log('📂 Usage by Folder:')
        console.log('   ' + 'Folder'.padEnd(20) + 'Files'.padEnd(10) + 'Size (MB)')
        console.log('   ' + '-'.repeat(40))

        const sortedFolders = Array.from(folderStats.entries()).sort((a, b) => b[1].size - a[1].size)

        for (const [folder, stats] of sortedFolders) {
            const sizeMB = (stats.size / 1024 / 1024).toFixed(2)
            console.log(`   ${folder.padEnd(20)} ${stats.count.toString().padEnd(10)} ${sizeMB}`)
        }

        console.log('')
        console.log('ℹ️  Note: The Vercel Dashboard "Storage (average)" metric is a billing average over time.')
        console.log('   It will not drop immediately after deletion. The values above are the REAL-TIME usage.')

    } catch (error) {
        console.error('❌ Error:', error)
    }
}

main()
