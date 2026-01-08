
/**
 * Check references to 'try-on/' (with dash) folder
 * 
 * Usage:
 *   npx tsx scripts/check-legacy-folder.ts
 */

import { prisma } from '../src/lib/prisma'
import * as dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') })
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true })

async function main() {
    console.log('🔍 Checking database references for "try-on/" (with dash)...')

    // Check TryOnTask
    const tasks = await prisma.tryOnTask.findMany({
        where: {
            OR: [
                { userImageUrl: { contains: 'try-on/' } },
                { itemImageUrl: { contains: 'try-on/' } },
                { resultImageUrl: { contains: 'try-on/' } }
            ]
        },
        select: { id: true, createdAt: true }
    })

    console.log(`   Found ${tasks.length} tasks referencing 'try-on/' folder.`)
    if (tasks.length > 0) {
        console.log(`   Latest task: ${tasks[0].createdAt}`)
    }

    // Check User images
    const users = await prisma.user.findMany({
        where: {
            image: { contains: 'try-on/' }
        }
    })
    console.log(`   Found ${users.length} users referencing 'try-on/' folder.`)

    // Check GlassesFrame
    const frames = await prisma.glassesFrame.findMany({
        where: {
            imageUrl: { contains: 'try-on/' }
        }
    })
    console.log(`   Found ${frames.length} frames referencing 'try-on/' folder.`)

    console.log('')
    if (tasks.length === 0 && users.length === 0 && frames.length === 0) {
        console.log('✅ CONCLUSION: safely deletable. "try-on/" folder appears to be completely unused by current database.')
    } else {
        console.log('⚠️ CONCLUSION: in use. "try-on/" folder is still used by the database. Do not delete indiscriminately.')
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
