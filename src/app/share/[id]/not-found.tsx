import { AlertCircle, ArrowLeft, Glasses } from "lucide-react"
import Link from "next/link"

export default function ShareNotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <Glasses className="w-12 h-12 text-blue-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">VisuTry</h1>
        </div>

        {/* Error Icon */}
        <div className="flex items-center justify-center mb-6">
          <AlertCircle className="w-16 h-16 text-gray-400" />
        </div>

        {/* Error Message */}
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Shared Content Not Found
        </h2>
        <p className="text-gray-600 mb-8">
          Sorry, the try-on result you&apos;re looking for doesn&apos;t exist or has been deleted.
          Possible reasons:
        </p>

        <ul className="text-left text-sm text-gray-600 mb-8 space-y-2">
          <li>• Share link has expired</li>
          <li>• Try-on task is not completed</li>
          <li>• Content has been deleted by user</li>
          <li>• Link address is incorrect</li>
        </ul>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link
            href="/try-on"
            className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Glasses className="w-5 h-5 mr-2" />
            Start AI Try-On
          </Link>

          <Link
            href="/"
            className="w-full flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
