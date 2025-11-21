import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Get Prisma Client version
    const prismaVersion = require('@prisma/client/package.json').version

    // Test Account table query (the one that's failing in NextAuth)
    let accountQueryError = null
    try {
      await prisma.account.findUnique({
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

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'VisuTry',
      version: '0.1.0',
      environment: process.env.NODE_ENV || 'development',
      prisma: {
        clientVersion: prismaVersion,
        accountQueryTest: accountQueryError === null ? 'success' : 'failed',
        accountQueryError: accountQueryError
      },
      database: {
        url: process.env.DATABASE_URL?.substring(0, 50) + '...'
      }
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
