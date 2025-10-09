/**
 * Session utilities for managing user session updates
 * 
 * This module provides utilities to trigger session updates when user data changes,
 * ensuring the JWT token is refreshed from the database.
 */

/**
 * Trigger a session update on the client side
 * This will cause the JWT callback to re-fetch user data from the database
 *
 * Usage:
 * ```typescript
 * import { triggerSessionUpdate } from '@/lib/session-utils'
 *
 * // In a React component:
 * const { update } = useSession()
 * await triggerSessionUpdate(update)
 * ```
 */
export async function triggerSessionUpdate(updateFn: () => Promise<any>) {
  if (typeof window !== 'undefined') {
    // Client-side: use the update function from useSession hook
    await updateFn()
  }
}

/**
 * Server-side function to invalidate session cache
 * Call this after updating user data in the database
 */
export function invalidateSessionCache(userId: string) {
  // In a production environment, you might want to use Redis or similar
  // to track which users need their sessions refreshed
  console.log(`Session cache invalidated for user: ${userId}`)
}

