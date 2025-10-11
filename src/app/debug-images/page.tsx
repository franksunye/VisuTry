import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Image from "next/image"

export default async function DebugImagesPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect("/auth/signin")
  }

  // 获取最近的试戴记录
  const tryOns = await prisma.tryOnTask.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 3,
    select: {
      id: true,
      userImageUrl: true,
      resultImageUrl: true,
    },
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">图片调试页面</h1>
      
      <div className="space-y-8">
        {tryOns.map((tryOn, index) => (
          <div key={tryOn.id} className="border p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">试戴记录 #{index + 1}</h2>
            
            {/* 原始 URL */}
            <div className="mb-4">
              <h3 className="font-medium mb-2">原始图片 URL：</h3>
              <div className="bg-gray-100 p-2 rounded text-xs break-all">
                {tryOn.resultImageUrl || tryOn.userImageUrl}
              </div>
            </div>

            {/* 使用 Next.js Image 组件 */}
            <div className="mb-4">
              <h3 className="font-medium mb-2">Next.js Image 组件（quality=40, width=300）：</h3>
              <div className="w-[300px] h-[300px] relative border">
                <Image
                  src={tryOn.resultImageUrl || tryOn.userImageUrl}
                  alt="Test"
                  fill
                  sizes="300px"
                  quality={40}
                  className="object-cover"
                />
              </div>
            </div>

            {/* 使用原生 img 标签 */}
            <div className="mb-4">
              <h3 className="font-medium mb-2">原生 img 标签（直接加载）：</h3>
              <div className="w-[300px] h-[300px] border">
                <img
                  src={tryOn.resultImageUrl || tryOn.userImageUrl}
                  alt="Test"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* 检查说明 */}
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
              <h3 className="font-medium mb-2">🔍 检查步骤：</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>打开 Chrome DevTools (F12)</li>
                <li>切换到 Network 标签</li>
                <li>刷新页面</li>
                <li>查找图片请求</li>
                <li>检查 URL 是否包含 <code className="bg-gray-200 px-1">/_next/image?url=...</code></li>
                <li>检查 Response Headers 中的 Content-Type</li>
                <li>检查文件大小（应该 &lt; 100 KB）</li>
              </ol>
            </div>
          </div>
        ))}
      </div>

      {tryOns.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          没有试戴记录。请先创建一个试戴任务。
        </div>
      )}
    </div>
  )
}

