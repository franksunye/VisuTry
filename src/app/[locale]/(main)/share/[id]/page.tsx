import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Glasses, Download, ArrowLeft } from "lucide-react"
import Link from "next/link"
import type { Metadata } from "next"
import { TryOnResultImage } from "@/components/OptimizedImage"
import { getTryOnConfig, type TryOnType } from "@/config/try-on-types"

interface SharePageProps {
  params: {
    id: string
  }
}

// Generate dynamic metadata
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
      title: "VisuTry - AI Glasses Try-On",
      description: "Experience virtual glasses try-on with AI technology"
    }
  }

  const userName = task.user.name || "User"
  const taskType = (task as any).type as TryOnType || 'GLASSES'
  const config = getTryOnConfig(taskType)

  return {
    title: `${userName}'s AI ${config.name} Try-On Result - VisuTry`,
    description: `Check out ${userName}'s AI ${config.name.toLowerCase()} try-on result with VisuTry`,
    openGraph: {
      title: `${userName}'s AI ${config.name} Try-On Result`,
      description: `Check out ${userName}'s AI ${config.name.toLowerCase()} try-on result with VisuTry`,
      images: [
        {
          url: task.resultImageUrl,
          width: 800,
          height: 600,
          alt: "AI Glasses Try-On Result"
        }
      ],
      type: "website"
    },
    twitter: {
      card: "summary_large_image",
      title: `${userName}'s AI ${config.name} Try-On Result`,
      description: `Check out ${userName}'s AI ${config.name.toLowerCase()} try-on result with VisuTry`,
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

  const userName = task.user.name || "User"
  const taskType = (task as any).type as TryOnType || 'GLASSES'
  const config = getTryOnConfig(taskType)
  const createdDate = new Date(task.createdAt).toLocaleDateString("en-US")

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Title Section */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {config.icon} AI {config.name} Try-On Result
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

          {/* Result Display - Optimized with Next.js Image */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
            <div className="relative w-full aspect-square bg-gray-50">
              <TryOnResultImage
                src={task.resultImageUrl}
                alt="AI Glasses Try-On Result"
                priority={true}
                useFill={true}
                className="object-contain"
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
                  Download Image
                </a>

                <Link
                  href="/try-on"
                  className="flex items-center justify-center px-6 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <Glasses className="w-5 h-5 mr-2" />
                  Try It Yourself
                </Link>
              </div>
            </div>
          </div>

          {/* Product Introduction */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              About VisuTry
            </h3>
            <p className="text-gray-600 mb-4">
              VisuTry is an AI-powered virtual glasses try-on application. Using advanced artificial intelligence algorithms,
              we provide you with a realistic glasses try-on experience to help you find the perfect eyewear style.
            </p>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Glasses className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-2">AI Technology</h4>
                <p className="text-sm text-gray-600">
                  Advanced AI algorithms for realistic try-on effects
                </p>
              </div>

              <div className="text-center p-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Download className="w-6 h-6 text-green-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-2">Free Trial</h4>
                <p className="text-sm text-gray-600">
                  Every user gets 1 free AI try-on experience
                </p>
              </div>

              <div className="text-center p-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ArrowLeft className="w-6 h-6 text-purple-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-2">Easy to Use</h4>
                <p className="text-sm text-gray-600">
                  Simply upload a photo, select glasses, and get your try-on result
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 VisuTry. Making glasses try-on easier with AI technology.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
