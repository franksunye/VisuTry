import { AlertCircle, ArrowLeft, Glasses, Search, Home } from "lucide-react"
import Link from "next/link"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: '404 - Page Not Found | VisuTry',
  description: 'The page you are looking for could not be found.',
  robots: {
    index: false, // Don't index 404 pages
    follow: false,
  },
}

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <Glasses className="w-12 h-12 text-blue-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">VisuTry</h1>
        </div>

        {/* 404 Icon */}
        <div className="flex items-center justify-center mb-6">
          <AlertCircle className="w-20 h-20 text-gray-400" />
        </div>

        {/* Error Message */}
        <div className="mb-8">
          <h2 className="text-6xl font-bold text-gray-900 mb-4">404</h2>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Page Not Found
          </h3>
          <p className="text-gray-600">
            Sorry, the page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>

        {/* Helpful Links */}
        <div className="space-y-3">
          <Link
            href="/"
            className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
          >
            <Home className="w-5 h-5 mr-2" />
            Back to Home
          </Link>

          <Link
            href="/try-on"
            className="w-full flex items-center justify-center px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <Glasses className="w-5 h-5 mr-2" />
            Try AI Virtual Try-On
          </Link>

          <Link
            href="/blog"
            className="w-full flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Search className="w-5 h-5 mr-2" />
            Browse Blog
          </Link>
        </div>

        {/* Popular Pages */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">Popular Pages:</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link
              href="/blog/how-to-choose-glasses-for-your-face"
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              Face Shape Guide
            </Link>
            <span className="text-gray-300">•</span>
            <Link
              href="/blog/best-ai-virtual-glasses-tryon-tools-2025"
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              AI Try-On Tools
            </Link>
            <span className="text-gray-300">•</span>
            <Link
              href="/pricing"
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              Pricing
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

