'use client'

import { useState, useEffect } from 'react'

interface TestUser {
  id: string
  email: string
  name: string
  image: string
  username: string
  freeTrialsUsed: number
  isPremium: boolean
  premiumExpiresAt: Date | null
}

interface TestSession {
  user: TestUser
  source: 'test'
}

export function useTestSession() {
  const [testSession, setTestSession] = useState<TestSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkTestSession = () => {
      try {
        // Check for test session cookie
        const cookies = document.cookie.split(';')
        const testSessionCookie = cookies.find(cookie => 
          cookie.trim().startsWith('test-session=')
        )

        if (testSessionCookie) {
          const cookieValue = testSessionCookie.split('=')[1]
          const decodedValue = decodeURIComponent(cookieValue)
          const testUser = JSON.parse(decodedValue)
          
          setTestSession({
            user: testUser,
            source: 'test'
          })
        } else {
          setTestSession(null)
        }
      } catch (error) {
        console.error('Failed to parse test session:', error)
        setTestSession(null)
      } finally {
        setLoading(false)
      }
    }

    checkTestSession()

    // Listen for cookie changes (when test login/logout happens)
    const interval = setInterval(checkTestSession, 1000)
    
    return () => clearInterval(interval)
  }, [])

  const clearTestSession = () => {
    // Clear the test session cookie
    document.cookie = 'test-session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
    setTestSession(null)
  }

  return {
    testSession,
    loading,
    clearTestSession
  }
}
