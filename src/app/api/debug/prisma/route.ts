import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Get Prisma Client version
    const prismaVersion = require('@prisma/client/package.json').version
    
    // Test database connection
    await prisma.$connect()
    
    // Test Account table query (the one that's failing)
    let accountQueryResult = null
    let accountQueryError = null
    
    try {
      accountQueryResult = await prisma.account.findUnique({
        where: {
          provider_providerAccountId: {
            provider: 'test-provider',
            providerAccountId: 'test-account'
          }
        }
      })
    } catch (error: any) {
      accountQueryError = {
        message: error.message,
        code: error.code,
        meta: error.meta,
        clientVersion: error.clientVersion
      }
    }
    
    // Get Account table structure from database
    const accountColumns = await prisma.$queryRaw<any[]>`
      SELECT column_name::text, data_type::text, is_nullable::text
      FROM information_schema.columns
      WHERE table_name = 'Account'
      ORDER BY ordinal_position
    `
    
    // Get Account indexes
    const accountIndexes = await prisma.$queryRaw<any[]>`
      SELECT indexname::text, indexdef::text
      FROM pg_indexes
      WHERE tablename = 'Account'
    `
    
    // Get migration status
    const migrations = await prisma.$queryRaw<any[]>`
      SELECT migration_name::text, finished_at, applied_steps_count
      FROM "_prisma_migrations"
      ORDER BY finished_at DESC
      LIMIT 10
    `
    
    return NextResponse.json({
      success: true,
      environment: process.env.NODE_ENV,
      vercel: process.env.VERCEL === '1',
      prismaClientVersion: prismaVersion,
      databaseUrl: process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':***@'), // Hide password
      accountTable: {
        columns: accountColumns,
        indexes: accountIndexes
      },
      accountQueryTest: {
        success: accountQueryError === null,
        result: accountQueryResult,
        error: accountQueryError
      },
      migrations: migrations
    })
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: {
        message: error.message,
        stack: error.stack
      }
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

