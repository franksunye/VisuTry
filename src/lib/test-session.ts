// Test Session Utilities for End-to-End Testing

export interface TestUser {
  id: string
  email: string
  name: string
  image: string
  username: string
  freeTrialsUsed: number
  creditsBalance: number
  premiumUsageCount: number
  isPremium: boolean
  premiumExpiresAt: Date | null
  currentSubscriptionType?: string | null
}

// Client-side function to get test session
export function getTestSession(): TestUser | null {
  if (typeof window === 'undefined') return null
  
  try {
    const testSessionCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('test-session='))
    
    if (!testSessionCookie) return null
    
    const sessionData = decodeURIComponent(testSessionCookie.split('=')[1])
    return JSON.parse(sessionData)
  } catch (error) {
    console.error('Failed to parse test session:', error)
    return null
  }
}

// Client-side function to clear test session
export function clearTestSession(): void {
  if (typeof window === 'undefined') return
  
  document.cookie = 'test-session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
}

// Server-side function to get test session from request
export function getTestSessionFromRequest(request: Request): TestUser | null {
  try {
    const cookieHeader = request.headers.get('cookie')
    if (!cookieHeader) return null
    
    const testSessionCookie = cookieHeader
      .split('; ')
      .find(row => row.startsWith('test-session='))
    
    if (!testSessionCookie) return null
    
    const sessionData = decodeURIComponent(testSessionCookie.split('=')[1])
    return JSON.parse(sessionData)
  } catch (error) {
    console.error('Failed to parse test session from request:', error)
    return null
  }
}

// Check if user is authenticated (either NextAuth or test session)
export function isTestAuthenticated(): boolean {
  return getTestSession() !== null
}

// Get current user (test session or NextAuth)
export function getCurrentTestUser(): TestUser | null {
  return getTestSession()
}
