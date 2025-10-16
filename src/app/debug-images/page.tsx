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

  // Get recent try-on records
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
      <h1 className="text-2xl font-bold mb-6">Image Debug Page</h1>

      <div className="space-y-8">
        {tryOns.map((tryOn, index) => (
          <div key={tryOn.id} className="border p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">Try-On Record #{index + 1}</h2>

            {/* Original URL */}
            <div className="mb-4">
              <h3 className="font-medium mb-2">Original Image URL:</h3>
              <div className="bg-gray-100 p-2 rounded text-xs break-all">
                {tryOn.resultImageUrl || tryOn.userImageUrl}
              </div>
            </div>

            {/* Using Next.js Image component */}
            <div className="mb-4">
              <h3 className="font-medium mb-2">Next.js Image Component (quality=40, width=300):</h3>
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

            {/* Using native img tag */}
            <div className="mb-4">
              <h3 className="font-medium mb-2">Native img Tag (Direct Load):</h3>
              <div className="w-[300px] h-[300px] border">
                <img
                  src={tryOn.resultImageUrl || tryOn.userImageUrl}
                  alt="Test"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* URL Analysis */}
            <div className="bg-blue-50 border border-blue-200 p-4 rounded mb-4">
              <h3 className="font-medium mb-2">📊 URL Analysis:</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Domain:</strong>
                  <code className="bg-gray-200 px-1 ml-2">
                    {new URL(tryOn.resultImageUrl || tryOn.userImageUrl).hostname}
                  </code>
                </div>
                <div>
                  <strong>In Whitelist:</strong>
                  <span className={`ml-2 px-2 py-1 rounded ${
                    (tryOn.resultImageUrl || tryOn.userImageUrl).includes('public.blob.vercel-storage.com')
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {(tryOn.resultImageUrl || tryOn.userImageUrl).includes('public.blob.vercel-storage.com')
                      ? '✅ Yes (Should be optimized)'
                      : '❌ No (May not be optimized)'}
                  </span>
                </div>
                <div>
                  <strong>Expected Optimized URL:</strong>
                  <code className="bg-gray-200 px-1 ml-2 text-xs break-all block mt-1">
                    /_next/image?url={encodeURIComponent(tryOn.resultImageUrl || tryOn.userImageUrl)}&w=384&q=40
                  </code>
                </div>
              </div>
            </div>

            {/* Check Instructions */}
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
              <h3 className="font-medium mb-2">🔍 Check Steps:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Open Chrome DevTools (F12)</li>
                <li>Switch to Network tab</li>
                <li>Refresh page</li>
                <li>Find image requests</li>
                <li>Check if URL contains <code className="bg-gray-200 px-1">/_next/image?url=...</code></li>
                <li>Check Content-Type in Response Headers</li>
                <li>Check file size (should be &lt; 100 KB)</li>
                <li><strong>If you see Base64</strong>: Right-click image → Open in new tab, check if it loads properly</li>
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

