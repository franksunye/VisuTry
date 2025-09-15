import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { TryOnHistoryList } from "@/components/dashboard/TryOnHistoryList"
import { ArrowLeft, History } from "lucide-react"
import Link from "next/link"

interface SearchParams {
  page?: string
  status?: string
}

interface HistoryPageProps {
  searchParams: SearchParams
}

export default async function HistoryPage({ searchParams }: HistoryPageProps) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  const page = parseInt(searchParams.page || "1")
  const status = searchParams.status
  const limit = 12

  // 构建查询条件
  const where: any = {
    userId: session.user.id
  }

  if (status && status !== "all") {
    where.status = status.toUpperCase()
  }

  // 获取试戴历史记录
  const [tasks, total] = await Promise.all([
    prisma.tryOnTask.findMany({
      where,
      orderBy: {
        createdAt: "desc"
      },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        status: true,
        userImageUrl: true,
        glassesImageUrl: true,
        resultImageUrl: true,
        errorMessage: true,
        createdAt: true,
        updatedAt: true,
        metadata: true
      }
    }),
    prisma.tryOnTask.count({ where })
  ])

  const totalPages = Math.ceil(total / limit)

  // 统计数据
  const stats = await prisma.tryOnTask.groupBy({
    by: ["status"],
    where: { userId: session.user.id },
    _count: {
      id: true
    }
  })

  const statusCounts = {
    total: total,
    completed: stats.find(s => s.status === "COMPLETED")?._count.id || 0,
    processing: stats.find(s => s.status === "PROCESSING")?._count.id || 0,
    failed: stats.find(s => s.status === "FAILED")?._count.id || 0,
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <Link
            href="/dashboard"
            className="flex items-center text-blue-600 hover:text-blue-700 mr-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            返回个人中心
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">试戴历史</h1>
            <p className="text-gray-600 mt-1">查看您的所有AI试戴记录</p>
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <History className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">总计</p>
              <p className="text-2xl font-semibold text-gray-900">{statusCounts.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <div className="w-6 h-6 bg-green-600 rounded-full" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">已完成</p>
              <p className="text-2xl font-semibold text-gray-900">{statusCounts.completed}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <div className="w-6 h-6 bg-yellow-600 rounded-full animate-pulse" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">处理中</p>
              <p className="text-2xl font-semibold text-gray-900">{statusCounts.processing}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <div className="w-6 h-6 bg-red-600 rounded-full" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">失败</p>
              <p className="text-2xl font-semibold text-gray-900">{statusCounts.failed}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 筛选器 */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">筛选状态：</span>
          <div className="flex space-x-2">
            {[
              { value: "all", label: "全部" },
              { value: "completed", label: "已完成" },
              { value: "processing", label: "处理中" },
              { value: "failed", label: "失败" }
            ].map((filter) => (
              <Link
                key={filter.value}
                href={`/dashboard/history?status=${filter.value}&page=1`}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  (status || "all") === filter.value
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {filter.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* 历史记录列表 */}
      <TryOnHistoryList
        tasks={tasks}
        currentPage={page}
        totalPages={totalPages}
        currentStatus={status || "all"}
      />
    </div>
  )
}
