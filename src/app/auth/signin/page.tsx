import { Glasses, Twitter, Shield, Zap } from "lucide-react"
import { LoginButton } from "@/components/auth/LoginButton"

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Logo和标题 */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Glasses className="w-12 h-12 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">VisuTry</h1>
          </div>
          <h2 className="text-xl text-gray-600 mb-2">
            登录开始AI眼镜试戴
          </h2>
          <p className="text-sm text-gray-500">
            使用Twitter账户快速登录，体验智能试戴功能
          </p>
        </div>

        {/* 登录卡片 */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="space-y-6">
            {/* 功能特色 */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Zap className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">免费试戴</h3>
                  <p className="text-sm text-gray-500">每个账户享受3次免费AI试戴</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Shield className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">安全可靠</h3>
                  <p className="text-sm text-gray-500">使用Twitter OAuth安全登录</p>
                </div>
              </div>
            </div>

            {/* 分割线 */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">开始使用</span>
              </div>
            </div>

            {/* 登录按钮 */}
            <div className="space-y-4">
              <LoginButton className="w-full justify-center py-3" />
              
              <p className="text-xs text-gray-500 text-center">
                登录即表示您同意我们的
                <a href="/terms" className="text-blue-600 hover:underline">服务条款</a>
                和
                <a href="/privacy" className="text-blue-600 hover:underline">隐私政策</a>
              </p>
            </div>
          </div>
        </div>

        {/* 底部说明 */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            还没有账户？登录后将自动为您创建账户
          </p>
        </div>
      </div>
    </div>
  )
}
