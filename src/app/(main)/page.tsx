'use client'

import { Glasses, Upload, Sparkles, Share2 } from 'lucide-react'
import { LoginButton } from '@/components/auth/LoginButton'
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
    <main className="container mx-auto px-4 py-8">
      {/* Header */}
      <header className="text-center mb-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Glasses className="w-12 h-12 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-800">VisuTry - AI Virtual Glasses Try-On</h1>
          </div>
          <LoginButton />
        </div>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Experience <strong>virtual glasses try-on</strong> with <strong>AI-powered technology</strong>.
          Find the perfect <strong>eyewear for your face shape</strong> with our smart <strong>online glasses fitting tool</strong>.
          Try designer frames before you buy with intelligent recommendations.
        </p>
      </header>

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto mb-16">
        <div className="glass-effect rounded-2xl p-8 text-center">
          <h2 className="text-3xl font-semibold mb-6 text-gray-800">
            Try On Glasses Online in 3 Easy Steps
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Upload className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Upload Your Photo</h3>
              <p className="text-gray-600">Upload your front-facing photo for virtual eyewear fitting</p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">AI-Powered Try-On</h3>
              <p className="text-gray-600">Choose from designer glasses styles and let AI try them on instantly</p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Share2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Save & Share</h3>
              <p className="text-gray-600">Save your virtual try-on results and share with friends</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="max-w-4xl mx-auto mb-16">
        <div className="bg-white rounded-2xl p-8 shadow-md">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800 text-center">
            Why Choose Our Virtual Glasses Try-On Tool?
          </h2>
          <div className="grid md:grid-cols-2 gap-6 text-left">
            <div>
              <h3 className="font-semibold text-lg mb-2 text-gray-800">🎯 Smart Face Shape Matching</h3>
              <p className="text-gray-600">
                Our AI analyzes your face shape to recommend the best glasses styles that complement your features.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2 text-gray-800">👓 Try Designer Frames Online</h3>
              <p className="text-gray-600">
                Experience premium eyewear brands virtually before making a purchase decision.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2 text-gray-800">⚡ Instant Virtual Fitting</h3>
              <p className="text-gray-600">
                See how glasses look on you in seconds with our advanced virtual try-on technology.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2 text-gray-800">🛍️ Shop with Confidence</h3>
              <p className="text-gray-600">
                Make informed decisions about your eyewear purchase with realistic virtual previews.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center">
        <button
          onClick={handleStartTryOn}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
        >
          Start Virtual Try-On Now
        </button>
        <p className="text-sm text-gray-500 mt-4">
          3 free virtual try-ons • No credit card required • Instant results
        </p>
      </section>
    </main>
  )
}
