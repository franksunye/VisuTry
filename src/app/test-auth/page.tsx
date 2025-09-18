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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
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
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            {loading ? '登录中...' : '🔑 测试登录 (模拟 Twitter)'}
          </button>

          <button
            onClick={handleClearSession}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            🗑️ 清除会话
          </button>

          <div className="border-t pt-4">
            <a
              href="/auth/signin"
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors block text-center"
            >
              🐦 真实 Twitter 登录
            </a>
          </div>
        </div>

        {message && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">{message}</p>
          </div>
        )}

        <div className="mt-8 text-center">
          <a
            href="/"
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            ← 返回首页
          </a>
        </div>
      </div>
    </div>
  )
}
