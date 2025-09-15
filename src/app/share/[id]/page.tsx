import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Glasses, Download, ArrowLeft } from "lucide-react"
import Link from "next/link"
import type { Metadata } from "next"

interface SharePageProps {
  params: {
    id: string
  }
}

// 生成动态元数据
export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const task = await prisma.tryOnTask.findUnique({
    where: { id: params.id },
    include: {
      user: {
        select: {
          name: true
        }
      }
    }
  })

  if (!task || task.status !== "COMPLETED" || !task.resultImageUrl) {
    return {
      title: "VisuTry - AI眼镜试戴",
      description: "使用AI技术体验虚拟眼镜试戴"
    }
  }

  const userName = task.user.name || "用户"
  
  return {
    title: `${userName}的AI眼镜试戴效果 - VisuTry`,
    description: `查看${userName}使用VisuTry AI技术的眼镜试戴效果`,
    openGraph: {
      title: `${userName}的AI眼镜试戴效果`,
      description: `查看${userName}使用VisuTry AI技术的眼镜试戴效果`,
      images: [
        {
          url: task.resultImageUrl,
          width: 800,
          height: 600,
          alt: "AI眼镜试戴效果"
        }
      ],
      type: "website"
    },
    twitter: {
      card: "summary_large_image",
      title: `${userName}的AI眼镜试戴效果`,
      description: `查看${userName}使用VisuTry AI技术的眼镜试戴效果`,
      images: [task.resultImageUrl]
    }
  }
}

export default async function SharePage({ params }: SharePageProps) {
  const task = await prisma.tryOnTask.findUnique({
    where: { id: params.id },
    include: {
      user: {
        select: {
          name: true,
          image: true
        }
      }
    }
  })

  if (!task || task.status !== "COMPLETED" || !task.resultImageUrl) {
    notFound()
  }

  const userName = task.user.name || "用户"
  const createdDate = new Date(task.createdAt).toLocaleDateString("zh-CN")

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 头部 */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Glasses className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">VisuTry</h1>
            </div>
            <Link
              href="/"
              className="flex items-center text-blue-600 hover:text-blue-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              体验AI试戴
            </Link>
          </div>
        </div>
      </header>

      {/* 主要内容 */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* 标题区域 */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              AI眼镜试戴效果
            </h2>
            <div className="flex items-center justify-center space-x-4 text-gray-600">
              {task.user.image && (
                <img
                  src={task.user.image}
                  alt={userName}
                  className="w-8 h-8 rounded-full"
                />
              )}
              <span>{userName}</span>
              <span>•</span>
              <span>{createdDate}</span>
            </div>
          </div>

          {/* 结果展示 */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
            <div className="relative">
              <img
                src={task.resultImageUrl}
                alt="AI眼镜试戴效果"
                className="w-full h-auto max-h-96 object-contain bg-gray-50"
              />
            </div>
            
            <div className="p-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href={task.resultImageUrl}
                  download={`visutry-result-${task.id}.jpg`}
                  className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-5 h-5 mr-2" />
                  下载图片
                </a>
                
                <Link
                  href="/try-on"
                  className="flex items-center justify-center px-6 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <Glasses className="w-5 h-5 mr-2" />
                  我也要试戴
                </Link>
              </div>
            </div>
          </div>

          {/* 产品介绍 */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              关于 VisuTry
            </h3>
            <p className="text-gray-600 mb-4">
              VisuTry 是一款基于AI技术的虚拟眼镜试戴应用。通过先进的人工智能算法，
              我们能够为您提供逼真的眼镜试戴体验，帮助您找到最适合的眼镜款式。
            </p>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Glasses className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-2">AI技术</h4>
                <p className="text-sm text-gray-600">
                  使用先进的AI算法实现逼真的试戴效果
                </p>
              </div>
              
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Download className="w-6 h-6 text-green-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-2">免费试用</h4>
                <p className="text-sm text-gray-600">
                  每个用户都可以免费体验3次AI试戴
                </p>
              </div>
              
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ArrowLeft className="w-6 h-6 text-purple-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-2">简单易用</h4>
                <p className="text-sm text-gray-600">
                  只需上传照片，选择眼镜，即可获得试戴效果
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 底部 */}
      <footer className="bg-white border-t mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 VisuTry. 使用AI技术让眼镜试戴更简单。</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
