/**
 * Download and share utilities for client-side image handling.
 *
 * Extracted from duplicated logic in:
 * - StyleExplorerInterface.tsx
 * - TryOnHistoryList.tsx
 * - ResultDisplay.tsx
 * - ShareButton.tsx
 */

/**
 * Download an image from a URL to the user's device.
 * Fetches the image as a blob, creates a temporary object URL,
 * and triggers a download via an invisible anchor element.
 */
export async function downloadImage(
  imageUrl: string,
  filename: string,
): Promise<void> {
  const response = await fetch(imageUrl)
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`)
  }

  const blob = await response.blob()
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Clean up the object URL after a short delay to ensure download starts
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/**
 * Generate a standardized filename for a try-on result image.
 */
export function generateResultFilename(
  prefix: string,
  taskId: string,
): string {
  return `${prefix}-${taskId}.jpg`
}

/**
 * Share a URL using the Web Share API if available,
 * falling back to clipboard copy.
 *
 * Returns 'shared' if Web Share API was used,
 * 'copied' if clipboard fallback was used,
 * 'failed' if both methods failed.
 */
export async function shareOrCopy(
  shareUrl: string,
  options?: {
    title?: string
    text?: string
  },
): Promise<'shared' | 'copied' | 'failed'> {
  // Try Web Share API first
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title: options?.title || 'VisuTry',
        text: options?.text || 'Check out my virtual try-on!',
        url: shareUrl,
      })
      return 'shared'
    } catch {
      // User cancelled or share failed — fall through to clipboard
    }
  }

  // Fallback: copy to clipboard
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(shareUrl)
      return 'copied'
    } catch {
      return 'failed'
    }
  }

  return 'failed'
}
