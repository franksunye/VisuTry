import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { TryOnInterface } from "@/components/try-on/TryOnInterface"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { headers } from "next/headers"
import { Breadcrumbs } from "@/components/seo/Breadcrumbs"
import { generateStructuredData } from "@/lib/seo"

// 🔥 优化：不再使用缓存，直接使用 session 作为唯一数据源
export const revalidate = 60

export default async function TryOnPage() {
  const session = await getServerSession(authOptions)

  // Check for test session if no NextAuth session
  let testSession = null
  if (!session) {
    const headersList = headers()
    const cookieHeader = headersList.get('cookie')
    if (cookieHeader) {
      const testSessionCookie = cookieHeader
        .split('; ')
        .find(row => row.startsWith('test-session='))

      if (testSessionCookie) {
        try {
          const sessionData = decodeURIComponent(testSessionCookie.split('=')[1])
          testSession = JSON.parse(sessionData)
        } catch (error) {
          console.error('Failed to parse test session:', error)
        }
      }
    }
  }

  if (!session && !testSession) {
    redirect("/auth/signin")
  }

  // 🔥 优化：直接使用 session.user 作为唯一数据源
  // session.user 已经包含了所有必要的用户信息（来自 JWT token）
  // 不再从数据库读取，避免缓存不一致问题
  const user = session?.user || testSession

  // HowTo structured data for SEO
  const howToSchema = generateStructuredData('howTo', {
    name: 'How to Try On Glasses Virtually with AI',
    description: 'Step-by-step guide to using our AI-powered virtual glasses try-on tool',
    totalTime: 'PT3M',
    steps: [
      {
        name: 'Upload Your Photo',
        text: 'Upload a clear, front-facing photo of yourself. Make sure your face is well-lit and clearly visible.',
      },
      {
        name: 'Select Glasses Style',
        text: 'Browse our collection of designer glasses and select the style you want to try on.',
      },
      {
        name: 'AI Virtual Try-On',
        text: 'Our AI technology will instantly show you how the glasses look on your face with realistic rendering.',
      },
      {
        name: 'Save and Share',
        text: 'Save your favorite try-on results and share them with friends to get their opinions.',
      },
    ],
  })

  return (
    <div className="container mx-auto px-4 py-8">
      {/* HowTo Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />

      {/* Breadcrumbs */}
      <div className="mb-6">
        <Breadcrumbs
          items={[
            { name: 'Try-On' },
          ]}
        />
      </div>

      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Glasses Try-On</h1>
          <p className="text-gray-600 mt-1">Upload your photo, select glasses, and experience AI-powered virtual try-on</p>
        </div>
        <Link
          href="/dashboard"
          className="flex items-center text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Dashboard
        </Link>
      </div>

      {/* User Status Banner */}
      <div className="mb-8">
        {testSession ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="text-green-800">
                <strong>Test Mode</strong> - {testSession.isPremium ? 'Standard User' : 'Free User'} ({testSession.name})
                {!testSession.isPremium && ` - Used ${testSession.freeTrialsUsed}/3 try-ons`}
              </div>
            </div>
          </div>
        ) : user?.isPremiumActive ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="text-yellow-800">
                <strong>Standard Member</strong> - Enhanced AI try-ons available
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="text-blue-800">
                <strong>Free User</strong> - Remaining try-ons: {user?.remainingTrials || 0}
              </div>
              {(user?.remainingTrials === 0) && (
                <Link
                  href="/pricing"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Upgrade Now
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Try-On Interface */}
      <TryOnInterface />
    </div>
  )
}
