/**
 * Navigation utilities for handling authentication-aware redirects
 */

/**
 * Generate a sign-in URL with proper callback handling
 */
export function getSignInUrl(callbackUrl?: string): string {
  const baseUrl = '/auth/signin'
  
  if (!callbackUrl) {
    return baseUrl
  }
  
  // Ensure callback URL is properly encoded
  const encodedCallback = encodeURIComponent(callbackUrl)
  return `${baseUrl}?callbackUrl=${encodedCallback}`
}

/**
 * Get the appropriate "back" navigation URL based on user authentication status
 */
export function getBackUrl(isAuthenticated: boolean, authenticatedUrl: string = '/dashboard', unauthenticatedUrl: string = '/'): string {
  return isAuthenticated ? authenticatedUrl : unauthenticatedUrl
}

/**
 * Get the appropriate "back" link text based on user authentication status
 */
export function getBackText(isAuthenticated: boolean, authenticatedText: string = 'Back to Dashboard', unauthenticatedText: string = 'Back to Home'): string {
  return isAuthenticated ? authenticatedText : unauthenticatedText
}

/**
 * Handle authentication-aware navigation for client components
 */
export function handleAuthNavigation(
  isAuthenticated: boolean,
  targetUrl: string,
  router: { push: (url: string) => void }
): void {
  if (isAuthenticated) {
    router.push(targetUrl)
  } else {
    router.push(getSignInUrl(targetUrl))
  }
}

/**
 * Common navigation patterns
 */
export const NAVIGATION_PATTERNS = {
  // For pages that require authentication
  PROTECTED_PAGE: {
    getBackUrl: (isAuthenticated: boolean) => getBackUrl(isAuthenticated),
    getBackText: (isAuthenticated: boolean) => getBackText(isAuthenticated),
  },
  
  // For pricing/subscription flows
  PRICING_FLOW: {
    getSignInUrl: () => getSignInUrl('/pricing'),
    getBackUrl: (isAuthenticated: boolean) => getBackUrl(isAuthenticated, '/dashboard', '/'),
    getBackText: (isAuthenticated: boolean) => getBackText(isAuthenticated),
  },
  
  // For try-on flows
  TRYON_FLOW: {
    getSignInUrl: () => getSignInUrl('/try-on'),
    getBackUrl: (isAuthenticated: boolean) => getBackUrl(isAuthenticated, '/dashboard', '/'),
    getBackText: (isAuthenticated: boolean) => getBackText(isAuthenticated),
  },
} as const
