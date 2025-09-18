import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // 检查环境变量
    const envCheck = {
      TWITTER_CLIENT_ID: !!process.env.TWITTER_CLIENT_ID,
      TWITTER_CLIENT_SECRET: !!process.env.TWITTER_CLIENT_SECRET,
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      NODE_ENV: process.env.NODE_ENV,
    }

    // 检查会话
    let session = null
    let sessionError = null
    try {
      session = await getServerSession(req, res, authOptions)
    } catch (error) {
      sessionError = error instanceof Error ? error.message : 'Unknown session error'
    }

    // 检查数据库连接
    let dbStatus = 'unknown'
    try {
      // 简单的数据库连接测试
      const { prisma } = await import('@/lib/prisma')
      await prisma.$queryRaw`SELECT 1`
      dbStatus = 'connected'
    } catch (error) {
      dbStatus = error instanceof Error ? error.message : 'connection failed'
    }

    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: envCheck,
      session: session,
      sessionError: sessionError,
      databaseStatus: dbStatus,
      authConfig: {
        adapter: authOptions.adapter ? 'configured' : 'none',
        providers: authOptions.providers?.length || 0,
        session: authOptions.session,
        pages: authOptions.pages,
      }
    }

    res.status(200).json(debugInfo)
  } catch (error) {
    res.status(500).json({
      error: 'Debug endpoint failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
