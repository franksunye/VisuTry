'use client'

import { Upload, Sparkles, Share2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useTestSession } from '@/hooks/useTestSession'

export default function Home() {
  const router = useRouter()
  const { data: session } = useSession()
  const { testSession } = useTestSession()

  const isAuthenticated = session || testSession

  const handleStartTryOn = () => {
    if (isAuthenticated) {
      router.push('/try-on')
    } else {
      router.push('/auth/signin?callbackUrl=' + encodeURIComponent('/try-on'))
    }
  }
  return (
    <main className="container px-4 py-8 mx-auto">
      {/* Hero Header */}
      <header className="mb-12 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          AI-Powered Virtual Glasses Try-On
        </h1>
        <p className="max-w-2xl mx-auto text-xl text-gray-600">
          Experience virtual glasses try-on with AI technology and find the perfect glasses style for you
        </p>
      </header>

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto mb-16">
        <h2 className="mb-12 text-3xl font-semibold text-center text-gray-800">
          Try On Glasses in 3 Easy Steps
        </h2>

        <div className="grid gap-8 mb-12 md:grid-cols-3">
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center w-16 h-16 mb-4 bg-blue-100 rounded-full">
              <Upload className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">Upload Photo</h3>
            <p className="text-center text-gray-600">Upload your front-facing photo</p>
          </div>

          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center w-16 h-16 mb-4 bg-purple-100 rounded-full">
              <Sparkles className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">AI Try-On</h3>
            <p className="text-center text-gray-600">Choose glasses style, AI tries them on for you</p>
          </div>

          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center w-16 h-16 mb-4 bg-green-100 rounded-full">
              <Share2 className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">Share Results</h3>
            <p className="text-center text-gray-600">Save and share your try-on results</p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <button
            onClick={handleStartTryOn}
            className="px-8 py-4 text-lg font-semibold text-white transition-colors duration-200 bg-blue-600 rounded-lg shadow-lg hover:bg-blue-700 hover:shadow-xl"
          >
            Start Try-On
          </button>
        </div>
      </section>
    </main>
  )
}
