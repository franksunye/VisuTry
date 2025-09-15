import { AlertCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface ErrorPageProps {
  searchParams: {
    error?: string
  }
}

export default function AuthErrorPage({ searchParams }: ErrorPageProps) {
  const error = searchParams.error

  const getErrorMessage = (error: string) => {
    switch (error) {
      case "Configuration":
        return "Server configuration error, please contact administrator"
      case "AccessDenied":
        return "Access denied, please check your permissions"
      case "Verification":
        return "Verification failed, please try again"
      case "Default":
      default:
        return "Unknown error occurred during login, please try again"
    }
  }

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
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                可能的解决方案
              </h2>
              <ul className="text-sm text-gray-600 space-y-2 text-left">
                <li>• 检查网络连接是否正常</li>
                <li>• 确认Twitter账户状态正常</li>
                <li>• 清除浏览器缓存后重试</li>
                <li>• 尝试使用其他浏览器</li>
              </ul>
            </div>

            <div className="space-y-3">
              <Link
                href="/auth/signin"
                className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                重新登录
              </Link>
              
              <Link
                href="/"
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                返回首页
              </Link>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-500">
            如果问题持续存在，请
            <a href="mailto:support@visutry.com" className="text-blue-600 hover:underline">
              联系客服
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
