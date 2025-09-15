/**
 * Image utility functions for VisuTry
 */

export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: '请选择一个文件' }
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { valid: false, error: '只支持 JPEG、PNG 和 WebP 格式的图片' }
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: '文件大小不能超过 5MB' }
  }

  return { valid: true }
}

export function compressImage(file: File, maxWidth: number = 1024, quality: number = 0.8): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      // Calculate new dimensions
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height)
      const newWidth = img.width * ratio
      const newHeight = img.height * ratio

      canvas.width = newWidth
      canvas.height = newHeight

      // Draw and compress
      ctx?.drawImage(img, 0, 0, newWidth, newHeight)
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            })
            resolve(compressedFile)
          } else {
            reject(new Error('图片压缩失败'))
          }
        },
        file.type,
        quality
      )
    }

    img.onerror = () => reject(new Error('图片加载失败'))
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
        reject(new Error('无法创建图片预览'))
      }
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsDataURL(file)
  })
}
