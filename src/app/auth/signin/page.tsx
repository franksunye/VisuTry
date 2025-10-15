import { Glasses, Twitter, Shield, Zap } from "lucide-react"
import { LoginButton } from "@/components/auth/LoginButton"
import { Metadata } from 'next'
import { generateSEO } from '@/lib/seo'

export const metadata: Metadata = generateSEO({
  title: 'Sign In - AI Glasses Try-On | VisuTry',
  description: 'Sign in to VisuTry to start your AI glasses try-on experience. Get 3 free trials and find the perfect glasses for your face shape.',
  url: '/auth/signin',
})

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Title */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Glasses className="w-12 h-12 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">VisuTry</h1>
          </div>
          <h2 className="text-xl text-gray-600 mb-2">
            Sign In to Start AI Glasses Try-On
          </h2>
          <p className="text-sm text-gray-500">
            Sign in with your Twitter account to experience smart try-on features
          </p>
        </div>

        {/* Sign In Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="space-y-6">
            {/* Features */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Zap className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Free Try-On</h3>
                  <p className="text-sm text-gray-500">Enjoy 3 free AI try-ons per account</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Shield className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Secure & Reliable</h3>
                  <p className="text-sm text-gray-500">Sign in securely with Twitter OAuth</p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Get Started</span>
              </div>
            </div>

            {/* Sign In Button */}
            <div className="space-y-4">
              <LoginButton className="w-full justify-center py-3" />

              <p className="text-xs text-gray-500 text-center">
                By signing in, you agree to our{' '}
                <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a>
                {' '}and{' '}
                <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom note */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Don&apos;t have an account? One will be created automatically when you sign in
          </p>
        </div>
      </div>
    </div>
  )
}
