'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function TestAuthPage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  const handleTestLogin = async () => {
    setLoading(true)
    setMessage('')
    
    try {
      const response = await fetch('/api/test/mock-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'test-user-twitter',
          name: 'Test User (Twitter)',
          email: 'test@twitter.com',
          username: 'franksunye',
          isPremium: false
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setMessage('✅ 测试登录成功！正在跳转...')
        setTimeout(() => {
          router.push('/')
        }, 1000)
      } else {
        setMessage('❌ 测试登录失败: ' + data.error)
      }
    } catch (error) {
      setMessage('❌ 请求失败: ' + (error instanceof Error ? error.message : '未知错误'))
    } finally {
      setLoading(false)
    }
  }

  const handleClearSession = async () => {
    try {
      const response = await fetch('/api/test/mock-login', {
        method: 'DELETE'
      })
      const data = await response.json()
      setMessage(data.success ? '✅ 会话已清除' : '❌ 清除失败')
    } catch (error) {
      setMessage('❌ 清除失败')
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md p-8 bg-white shadow-xl rounded-2xl">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-2xl font-bold text-gray-900">
            🧪 测试认证页面
          </h1>
          <p className="text-gray-600">
            用于测试和调试认证功能
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleTestLogin}
            disabled={loading}
            className="w-full px-4 py-3 font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
          >
            {loading ? '登录中...' : '🔑 测试登录 (模拟 Twitter)'}
          </button>

          <button
            onClick={handleClearSession}
            className="w-full px-4 py-3 font-medium text-white transition-colors bg-gray-600 rounded-lg hover:bg-gray-700"
          >
            🗑️ 清除会话
          </button>

          <div className="pt-4 border-t">
            <a
              href="/auth/signin"
              className="block w-full px-4 py-3 font-medium text-center text-white transition-colors bg-green-600 rounded-lg hover:bg-green-700"
            >
              🐦 真实 Twitter 登录
            </a>
          </div>
        </div>

        {message && (
          <div className="p-4 mt-6 rounded-lg bg-gray-50">
            <p className="text-sm text-gray-700">{message}</p>
          </div>
        )}

        <div className="mt-8 text-center">
          <a
            href="/"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            ← 返回首页
          </a>
        </div>
      </div>
    </div>
  )
}
