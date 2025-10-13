/**
 * Image utility functions for VisuTry
 *
 * Performance optimization based on real-world testing:
 * - Optimal image size: 1200x1200
 * - Optimal quality: 85%
 * - This provides the best balance between quality and Gemini API performance
 */

export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

// Optimal settings based on performance testing
export const OPTIMAL_MAX_DIMENSION = 1200 // Best performance at 1200x1200
export const OPTIMAL_QUALITY = 0.85 // 85% quality for best balance
export const MAX_COMPRESSED_SIZE = 500 * 1024 // 500KB max after compression

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'Please select a file' }
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { valid: false, error: 'Only JPEG, PNG and WebP formats are supported' }
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File size cannot exceed 5MB' }
  }

  return { valid: true }
}

export function compressImage(
  file: File,
  maxWidth: number = OPTIMAL_MAX_DIMENSION,
  quality: number = OPTIMAL_QUALITY
): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    console.log(`🖼️ Compressing image: ${file.name}`)
    console.log(`   Original size: ${(file.size / 1024).toFixed(2)}KB`)

    img.onload = () => {
      console.log(`   Original dimensions: ${img.width}x${img.height}`)

      // Calculate new dimensions maintaining aspect ratio
      // Limit to maxWidth x maxWidth (1200x1200 by default)
      let newWidth = img.width
      let newHeight = img.height

      if (img.width > maxWidth || img.height > maxWidth) {
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height)
        newWidth = Math.round(img.width * ratio)
        newHeight = Math.round(img.height * ratio)
      }

      canvas.width = newWidth
      canvas.height = newHeight

      console.log(`   New dimensions: ${newWidth}x${newHeight}`)
      console.log(`   Quality: ${(quality * 100).toFixed(0)}%`)

      // Draw and compress
      ctx?.drawImage(img, 0, 0, newWidth, newHeight)

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            })

            console.log(`   ✅ Compressed size: ${(compressedFile.size / 1024).toFixed(2)}KB`)
            console.log(`   📊 Compression ratio: ${((1 - compressedFile.size / file.size) * 100).toFixed(1)}%`)

            // Check if compressed size is still too large
            if (compressedFile.size > MAX_COMPRESSED_SIZE) {
              console.warn(`   ⚠️ Compressed size (${(compressedFile.size / 1024).toFixed(2)}KB) exceeds limit (${(MAX_COMPRESSED_SIZE / 1024).toFixed(2)}KB)`)
              console.warn(`   💡 Consider reducing quality or dimensions further`)
            }

            resolve(compressedFile)
          } else {
            reject(new Error('Image compression failed'))
          }
        },
        file.type,
        quality
      )
    }

    img.onerror = () => reject(new Error('Image loading failed'))
    img.src = URL.createObjectURL(file)
  })
}

export function createImagePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string)
      } else {
        reject(new Error('Unable to create image preview'))
      }
    }
    reader.onerror = () => reject(new Error('File reading failed'))
    reader.readAsDataURL(file)
  })
}
