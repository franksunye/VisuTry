import { prisma } from '@/lib/prisma'

export async function getAdminDashboardStats() {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const [
    totalUsers,
    todayUsers,
    totalFaceShapeDetections,
    todayFaceShapeDetections,
    totalFaceAnalyses,
    todayFaceAnalyses,
    recentOrders,
    recentUsers,
    recentFaceAnalyses,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.faceShapeDetection.count(),
    prisma.faceShapeDetection.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.faceAnalysisTask.count(),
    prisma.faceAnalysisTask.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.payment.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, userId: true, amount: true, status: true, user: { select: { name: true, email: true } } },
    }),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, image: true, name: true, email: true, createdAt: true },
    }),
    prisma.faceAnalysisTask.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userId: true,
        detectedShape: true,
        confidence: true,
        status: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
      },
    }),
  ])

  return { totalUsers, todayUsers, totalFaceShapeDetections, todayFaceShapeDetections, totalFaceAnalyses, todayFaceAnalyses, recentOrders, recentUsers, recentFaceAnalyses }
}
