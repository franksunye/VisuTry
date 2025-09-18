"use client"

import { useState, useEffect } from "react"
import { getTestSession, TestUser } from "@/lib/test-session"
import { TryOnInterface } from "@/components/try-on/TryOnInterface"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function TestTryOnPage() {
  const [testSession, setTestSession] = useState<TestUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const session = getTestSession()
    setTestSession(session)
    setLoading(false)
  }, [])

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  if (!testSession) {
    return (
      <div className="container mx-auto p-8 max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4">需要登录</h1>
        <p className="mb-4">请先进行 Mock 登录以测试试戴功能</p>
        <Link 
          href="/test-login"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          前往测试登录
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      {/* 返回按钮 */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回首页
        </Link>
      </div>

      {/* 页面标题 */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI眼镜试戴</h1>
        <p className="text-gray-600">上传您的照片，选择喜欢的眼镜，AI为您生成试戴效果</p>
      </div>

      {/* 测试用户状态提醒 */}
      <div className="mb-8">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-green-800">
              <strong>测试模式</strong> - {testSession.isPremium ? '高级用户' : '免费用户'} ({testSession.name})
              {!testSession.isPremium && ` - 已使用 ${testSession.freeTrialsUsed}/3 次试戴`}
            </div>
            <Link
              href="/test-login"
              className="text-green-600 hover:text-green-800 text-sm"
            >
              切换用户
            </Link>
          </div>
        </div>
      </div>

      {/* 试戴界面 */}
      <TryOnInterface />
    </div>
  )
}
