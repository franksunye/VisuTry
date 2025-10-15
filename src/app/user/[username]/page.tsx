import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { UserPublicProfile } from "@/components/user/UserPublicProfile"
import { PublicTryOnGallery } from "@/components/user/PublicTryOnGallery"
import { Glasses, Calendar, Star } from "lucide-react"
import type { Metadata } from "next"

interface UserPageProps {
  params: {
    username: string
  }
}

// Generate dynamic metadata
export async function generateMetadata({ params }: UserPageProps): Promise<Metadata> {
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { username: params.username },
        { name: params.username }
      ]
    }
  })

  if (!user) {
    return {
      title: "User Not Found - VisuTry",
      description: "This user does not exist or has deleted their account"
    }
  }

  const displayName = user.name || user.username || "User"

  return {
    title: `${displayName}'s Try-On Gallery - VisuTry`,
    description: `View ${displayName}'s AI glasses try-on gallery on VisuTry`,
    openGraph: {
      title: `${displayName}'s Try-On Gallery`,
      description: `View ${displayName}'s AI glasses try-on gallery on VisuTry`,
      images: user.image ? [user.image] : [],
      type: "profile"
    },
    twitter: {
      card: "summary",
      title: `${displayName}'s Try-On Gallery`,
      description: `View ${displayName}'s AI glasses try-on gallery on VisuTry`,
      images: user.image ? [user.image] : []
    }
  }
}

export default async function UserPage({ params }: UserPageProps) {
  // 查找用户
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { username: params.username },
        { name: params.username }
      ]
    },
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
      createdAt: true,
      isPremium: true,
      _count: {
        select: {
          tryOnTasks: {
            where: {
              status: "COMPLETED",
              // 只计算公开的试戴记录
              metadata: {
                path: ["isPublic"],
                equals: true
              }
            }
          }
        }
      }
    }
  })

  if (!user) {
    notFound()
  }

  // 获取用户的公开试戴记录
  const publicTryOns = await prisma.tryOnTask.findMany({
    where: {
      userId: user.id,
      status: "COMPLETED",
      resultImageUrl: {
        not: null
      },
      // 只显示公开的试戴记录
      metadata: {
        path: ["isPublic"],
        equals: true
      }
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 12,
    select: {
      id: true,
      resultImageUrl: true,
      userImageUrl: true,
      glassesImageUrl: true,
      createdAt: true,
      metadata: true
    }
  })

  const displayName = user.name || user.username || "User"
  const joinDate = new Date(user.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long"
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部导航 */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Glasses className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">VisuTry</h1>
            </div>
            <a
              href="/"
              className="flex items-center text-blue-600 hover:text-blue-700 transition-colors"
            >
              体验AI试戴
            </a>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* 用户资料卡片 */}
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden mb-8">
          <div className="relative h-32 bg-gradient-to-r from-blue-500 to-purple-600">
            {/* 装饰性图案 */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-4 left-4">
                <Glasses className="w-8 h-8 text-white" />
              </div>
              <div className="absolute top-8 right-8">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div className="absolute bottom-4 left-1/3">
                <div className="w-4 h-4 bg-white rounded-full" />
              </div>
            </div>
          </div>
          
          <div className="relative px-6 pb-6">
            {/* 头像 */}
            <div className="absolute -top-16 left-6">
              <div className="w-32 h-32 bg-white rounded-full p-2 shadow-lg">
                {user.image ? (
                  <img
                    src={user.image}
                    alt={displayName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-2xl font-bold text-gray-600">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* User Info */}
            <div className="pt-20">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {displayName}
                    {user.isPremium && (
                      <Star className="w-6 h-6 text-yellow-500 inline ml-2" />
                    )}
                  </h2>
                  <div className="flex items-center text-gray-600 mb-4">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>Joined {joinDate}</span>
                  </div>
                </div>
              </div>

              {/* 统计信息 */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {user._count.tryOnTasks}
                  </div>
                  <div className="text-sm text-gray-600">Public Works</div>
                </div>
                
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {user.isPremium ? "Premium" : "Free"}
                  </div>
                  <div className="text-sm text-gray-600">Membership</div>
                </div>
                
                <div className="text-center p-4 bg-gray-50 rounded-lg col-span-2 md:col-span-1">
                  <div className="text-2xl font-bold text-gray-900">
                    {publicTryOns.length > 0 ? "活跃" : "新手"}
                  </div>
                  <div className="text-sm text-gray-600">用户状态</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Works showcase */}
        <div className="bg-white rounded-2xl shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900">
              {displayName}&apos;s Try-On Gallery
            </h3>
            <p className="text-gray-600 mt-1">
              {publicTryOns.length > 0
                ? `${publicTryOns.length} public works`
                : "No public works yet"
              }
            </p>
          </div>
          
          <PublicTryOnGallery tryOns={publicTryOns} />
        </div>

        {/* 底部提示 */}
        <div className="mt-8 text-center">
          <div className="bg-blue-50 rounded-xl border border-blue-200 p-6 inline-block">
            <Glasses className="w-8 h-8 text-blue-600 mx-auto mb-3" />
            <h4 className="font-semibold text-blue-900 mb-2">想要体验AI试戴？</h4>
            <p className="text-blue-800 text-sm mb-4">
              使用VisuTry的AI技术，轻松试戴各种眼镜款式
            </p>
            <a
              href="/try-on"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Glasses className="w-5 h-5 mr-2" />
              Start Try-On
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}
