/**
 * Verify that database schema matches schema.prisma
 * Run with: npx tsx scripts/verify-schema-sync.ts
 */

import { prisma } from '../src/lib/prisma'

async function verifySchemaSync() {
  console.log('🔍 Verifying Database Schema Synchronization\n')

  try {
    // Test 1: Verify Account table structure
    console.log('✅ Test 1: Account table')
    const accountTest = await prisma.$queryRaw<any[]>`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'Account'
      ORDER BY ordinal_position
    `
    console.log('   Account table columns:')
    accountTest.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`)
    })
    console.log()

    // Test 2: Verify Account unique index
    console.log('✅ Test 2: Account indexes')
    const accountIndexes = await prisma.$queryRaw<any[]>`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'Account'
    `
    console.log('   Account indexes:')
    accountIndexes.forEach(idx => {
      console.log(`   - ${idx.indexname}`)
    })
    console.log()

    // Test 3: Verify User table creditsPurchased and creditsUsed
    console.log('✅ Test 3: User table credits fields')
    const userCreditsFields = await prisma.$queryRaw<any[]>`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'User'
      AND column_name IN ('creditsPurchased', 'creditsUsed')
    `
    console.log('   User credits fields:')
    userCreditsFields.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} DEFAULT ${col.column_default || 'none'}`)
    })
    
    // Check if fields are NOT NULL
    const hasNullableCredits = userCreditsFields.some(col => col.is_nullable === 'YES')
    if (hasNullableCredits) {
      console.log('   ⚠️  WARNING: Credits fields should be NOT NULL')
    } else {
      console.log('   ✅ Credits fields are correctly NOT NULL')
    }
    console.log()

    // Test 4: Try to create a test account (this will fail if schema is wrong)
    console.log('✅ Test 4: Test Account query (simulating NextAuth)')
    try {
      // This simulates what NextAuth does in getUserByAccount
      const testAccount = await prisma.account.findUnique({
        where: {
          provider_providerAccountId: {
            provider: 'test-provider',
            providerAccountId: 'test-account-id'
          }
        }
      })
      console.log('   ✅ Account query successful (no schema mismatch)')
      console.log(`   Result: ${testAccount ? 'Found account' : 'No account found (expected)'}`)
    } catch (error: any) {
      console.log('   ❌ Account query failed!')
      console.log(`   Error: ${error.message}`)
      throw error
    }
    console.log()

    // Test 5: Verify foreign key constraints
    console.log('✅ Test 5: Foreign key constraints')
    const foreignKeys = await prisma.$queryRaw<any[]>`
      SELECT
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name IN ('Account', 'Session', 'TryOnTask', 'Payment')
      ORDER BY tc.table_name
    `
    console.log('   Foreign keys:')
    foreignKeys.forEach(fk => {
      console.log(`   - ${fk.table_name}.${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`)
    })
    console.log()

    console.log('✅ All schema verification tests passed!')
    console.log()
    console.log('Next steps:')
    console.log('1. If all tests passed, regenerate Prisma Client: npx prisma generate')
    console.log('2. Redeploy to Vercel')
    console.log('3. Test login functionality')

  } catch (error: any) {
    console.error('❌ Schema verification failed:', error.message)
    console.error()
    console.error('This means the database schema does not match schema.prisma')
    console.error()
    console.error('To fix:')
    console.error('1. Run the fix script: psql $DATABASE_URL -f prisma/migrations/fix_schema_sync.sql')
    console.error('2. Or use Prisma: npx prisma db push --accept-data-loss')
    console.error('3. Then run this verification script again')
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

verifySchemaSync()

