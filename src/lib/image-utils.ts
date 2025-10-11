/**
 * 图片优化工具
 * 用于生成优化的图片 URL
 */

/**
 * 生成缩略图 URL
 * 使用 Vercel Image Optimization 或 Supabase Transform
 * 
 * @param originalUrl 原始图片 URL
 * @param width 目标宽度（像素）
 * @param quality 图片质量（1-100）
 * @returns 优化后的图片 URL
 */
export function getThumbnailUrl(
  originalUrl: string,
  width: number = 300,
  quality: number = 40
): string {
  // 如果是 Supabase Storage URL，使用 Supabase Transform
  if (originalUrl.includes('supabase.co/storage')) {
    // Supabase Transform API
    // https://supabase.com/docs/guides/storage/serving/image-transformations
    const url = new URL(originalUrl)
    url.searchParams.set('width', width.toString())
    url.searchParams.set('quality', quality.toString())
    return url.toString()
  }
  
  // 其他情况，返回原始 URL（Vercel Image Optimization 会自动处理）
  return originalUrl
}

/**
 * 生成响应式图片 sizes 属性
 * 
 * @param maxWidth 最大宽度（像素）
 * @returns sizes 字符串
 */
export function getResponsiveSizes(maxWidth: number = 300): string {
  return `(max-width: 768px) 50vw, (max-width: 1024px) 33vw, ${maxWidth}px`
}

/**
 * 预加载关键图片
 * 
 * @param imageUrls 图片 URL 数组
 * @param count 预加载数量
 */
export function preloadImages(imageUrls: string[], count: number = 3): void {
  if (typeof window === 'undefined') return
  
  imageUrls.slice(0, count).forEach(url => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = getThumbnailUrl(url)
    document.head.appendChild(link)
  })
}

