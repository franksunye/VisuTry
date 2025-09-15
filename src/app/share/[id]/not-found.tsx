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

        {/* 错误图标 */}
        <div className="flex items-center justify-center mb-6">
          <AlertCircle className="w-16 h-16 text-gray-400" />
        </div>

        {/* 错误信息 */}
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          分享内容不存在
        </h2>
        <p className="text-gray-600 mb-8">
          抱歉，您要查看的试戴结果不存在或已被删除。
          可能的原因：
        </p>

        <ul className="text-left text-sm text-gray-600 mb-8 space-y-2">
          <li>• 分享链接已过期</li>
          <li>• 试戴任务未完成</li>
          <li>• 内容已被用户删除</li>
          <li>• 链接地址有误</li>
        </ul>

        {/* 操作按钮 */}
        <div className="space-y-3">
          <Link
            href="/try-on"
            className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Glasses className="w-5 h-5 mr-2" />
            开始AI试戴
          </Link>
          
          <Link
            href="/"
            className="w-full flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            返回首页
          </Link>
        </div>
      </div>
    </div>
  )
}
