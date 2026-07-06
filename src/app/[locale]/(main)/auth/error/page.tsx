import { AlertCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { localizedPath } from "@/lib/localized-path"

interface ErrorPageProps {
  params: {
    locale: string
  }
  searchParams: {
    error?: string
    error_description?: string
    callbackUrl?: string
    code?: string
    state?: string
  }
}

const getErrorMessage = (error: string) => {
    switch (error) {
      case "Configuration":
        return "Server configuration error, please contact administrator"
      case "AccessDenied":
        return "Access denied, please check your permissions"
      case "Verification":
        return "Verification failed, please try again"
      case "Callback":
        return "OAuth callback error - this usually indicates a configuration mismatch between Twitter app and NextAuth"
      case "Default":
      default:
        return "Unknown error occurred during login, please try again"
    }
  }

const getErrorDetails = (error: string) => {
    switch (error) {
      case "Callback":
        return {
          description: "Twitter OAuth callback failed",
          possibleCauses: [
            "Twitter app callback URL doesn't match NextAuth callback URL",
            "Environment variables not properly set in Vercel",
            "Twitter app permissions insufficient",
            "NEXTAUTH_SECRET not set or incorrect",
            "Network connectivity issues during callback"
          ],
          solutions: [
            "Verify Twitter app callback URL: https://visutry.vercel.app/api/auth/callback/twitter",
            "Check Vercel environment variables are set correctly",
            "Ensure Twitter app has 'Read and write' permissions",
            "Verify NEXTAUTH_SECRET is set in Vercel",
            "Try clearing browser cache and cookies"
          ]
        }
      default:
        return null
    }
}

export default function AuthErrorPage({ params, searchParams }: ErrorPageProps) {
  const error = searchParams.error
  const errorDescription = searchParams.error_description
  const callbackUrl = searchParams.callbackUrl
  const code = searchParams.code
  const state = searchParams.state
  const errorDetails = error ? getErrorDetails(error) : null

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <AlertCircle className="w-16 h-16 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Login Failed
          </h1>
          <p className="text-gray-600">
            {error ? getErrorMessage(error) : "An error occurred during login"}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="space-y-6">
            {/* Error Details */}
            {errorDetails && (
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-semibold text-red-800 mb-2">Error Details</h3>
                  <p className="text-red-700 text-sm">{errorDetails.description}</p>
                  {error && (
                    <p className="text-red-600 text-xs mt-1 font-mono">Error Code: {error}</p>
                  )}
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-800 mb-2">Possible Causes</h3>
                  <ul className="text-yellow-700 text-sm space-y-1">
                    {errorDetails.possibleCauses.map((cause, index) => (
                      <li key={index}>• {cause}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 mb-2">Solutions</h3>
                  <ul className="text-blue-700 text-sm space-y-1">
                    {errorDetails.solutions.map((solution, index) => (
                      <li key={index}>• {solution}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* General Solutions */}
            {!errorDetails && (
              <div className="text-center">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Possible Solutions
                </h2>
                <ul className="text-sm text-gray-600 space-y-2 text-left">
                  <li>• Check your network connection</li>
                  <li>• Make sure your Twitter account is in good standing</li>
                  <li>• Clear your browser cache and try again</li>
                  <li>• Try using a different browser</li>
                </ul>
              </div>
            )}

            <div className="space-y-3">
              <Link
                href={localizedPath(params.locale, "/auth/signin")}
                className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Sign In Again
              </Link>

              <Link
                href={localizedPath(params.locale, "/")}
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
            </div>
          </div>
        </div>

        {/* Debug info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Debug Info (Development)</h3>
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">Error Type:</span> <span className="text-red-600">{error || 'Unknown'}</span></div>
              {errorDescription && <div><span className="font-medium">Error Description:</span> <span className="text-gray-700">{errorDescription}</span></div>}
              {callbackUrl && <div><span className="font-medium">Callback URL:</span> <span className="text-blue-600 break-all">{callbackUrl}</span></div>}
              {code && <div><span className="font-medium">Auth Code:</span> <span className="text-green-600 break-all">{code}</span></div>}
              {state && <div><span className="font-medium">State Parameter:</span> <span className="text-purple-600 break-all">{state}</span></div>}
              <div><span className="font-medium">Time:</span> <span className="text-gray-700">{new Date().toLocaleString()}</span></div>
            </div>
            <details className="mt-3">
              <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                Full URL Parameters
              </summary>
              <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto">
                {JSON.stringify(searchParams, null, 2)}
              </pre>
            </details>
          </div>
        )}

        <div className="text-center">
          <p className="text-sm text-gray-500">
            If the problem persists, please{' '}
            <a href="mailto:support@visutry.com" className="text-blue-600 hover:underline">
              contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
