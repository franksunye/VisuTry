/**
 * Check production database Account table structure
 * Run with: npx tsx scripts/check-production-db.ts
 */

import { prisma } from '../src/lib/prisma'

// Temporarily override DATABASE_URL for this script
process.env.DATABASE_URL = 'postgresql://neondb_owner:npg_QZepxrzP39mo@ep-wandering-union-ad43rx1s-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require'

async function checkDatabase() {
  try {
    console.log('✅ Connected to production database\n')

    // 1. Check Account table structure
    console.log('=== 1. Account Table Structure ===')
    const columns = await prisma.$queryRaw<any[]>`
      SELECT
        column_name::text,
        data_type::text,
        character_maximum_length,
        is_nullable::text,
        column_default::text
      FROM information_schema.columns
      WHERE table_name = 'Account'
      ORDER BY ordinal_position
    `
    console.table(columns)

    // 2. Check indexes
    console.log('\n=== 2. Account Table Indexes ===')
    const indexes = await prisma.$queryRaw<any[]>`
      SELECT
        indexname::text,
        indexdef::text
      FROM pg_indexes
      WHERE tablename = 'Account'
    `
    console.table(indexes)

    // 3. Check constraints
    console.log('\n=== 3. Account Table Constraints ===')
    const constraints = await prisma.$queryRaw<any[]>`
      SELECT
        conname::text AS constraint_name,
        contype::text AS constraint_type,
        pg_get_constraintdef(oid)::text AS constraint_definition
      FROM pg_constraint
      WHERE conrelid = 'public."Account"'::regclass
    `
    console.table(constraints)

    // 4. Check Account data count
    console.log('\n=== 4. Account Table Data ===')
    const count = await prisma.account.count()
    console.log(`Total accounts: ${count}`)

    // 5. Check sample data
    if (count > 0) {
      const sample = await prisma.account.findFirst()
      console.log('\nSample account:')
      console.log(sample)
    }

    // 6. Check migration status
    console.log('\n=== 5. Migration Status ===')
    const migrations = await prisma.$queryRaw<any[]>`
      SELECT migration_name::text, finished_at, applied_steps_count
      FROM "_prisma_migrations"
      ORDER BY finished_at
    `
    console.table(migrations)

    // 7. Test the exact query that NextAuth uses
    console.log('\n=== 6. Test NextAuth Query (Prisma) ===')
    try {
      const testQuery = await prisma.account.findUnique({
        where: {
          provider_providerAccountId: {
            provider: 'test-provider',
            providerAccountId: 'test-account'
          }
        }
      })
      console.log('✅ Prisma query executed successfully (no results expected)')
      console.log('Result:', testQuery)
    } catch (error: any) {
      console.error('❌ Prisma query failed:', error.message)
      console.error('Full error:', error)
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message)
    console.error('Full error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabase()

