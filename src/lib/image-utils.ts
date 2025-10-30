/**
 * 图片优化工具
 * 用于 Vercel Blob Storage + Next.js Image Optimization
 */

/**
 * 图片质量配置
 */
export const IMAGE_QUALITY = {
  THUMBNAIL: 40,      // 缩略图（列表、画廊）
  STANDARD: 75,       // 标准质量（一般展示）
  HIGH: 85,           // 高质量（结果展示）
  HERO: 90,           // 超高质量（首屏大图）
} as const

/**
 * Try-On 图片尺寸配置
 */
export const TRYON_IMAGE_SIZES = {
  THUMBNAIL: 300,     // 缩略图最大宽度
  RESULT: 800,        // 结果图片最大宽度
  FULL: 1200,         // 全尺寸图片最大宽度
} as const

/**
 * 生成缩略图 URL
 *
 * 注意：Vercel Blob Storage 的图片会自动通过 Next.js Image Optimization 处理
 * 只需要在 <Image> 组件中设置 quality 和 sizes 属性即可
 * Next.js 会自动：
 * - 生成多种尺寸的图片
 * - 转换为 WebP/AVIF 格式
 * - 通过 Vercel CDN 分发
 *
 * @param originalUrl 原始图片 URL
 * @param width 目标宽度（像素）- 仅用于文档说明，实际由 sizes 属性控制
 * @param quality 图片质量（1-100）- 仅用于文档说明，实际由 quality 属性控制
 * @returns 原始图片 URL（Next.js 会自动优化）
 */
export function getThumbnailUrl(
  originalUrl: string,
  width: number = 300,
  quality: number = 40
): string {
  // Vercel Blob Storage 的图片会自动通过 Next.js Image Optimization 处理
  // 不需要手动添加参数，Next.js <Image> 组件会自动优化
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
 * 生成 Try-On 缩略图的响应式 sizes 属性
 * 用于列表、画廊等场景
 *
 * @returns sizes 字符串
 */
export function getTryOnThumbnailSizes(): string {
  return `(max-width: 640px) 50vw, (max-width: 1024px) 33vw, ${TRYON_IMAGE_SIZES.THUMBNAIL}px`
}

/**
 * 生成 Try-On 结果图片的响应式 sizes 属性
 * 用于结果展示、分享页面等场景
 *
 * @returns sizes 字符串
 */
export function getTryOnResultSizes(): string {
  return `(max-width: 640px) 100vw, (max-width: 1024px) 80vw, ${TRYON_IMAGE_SIZES.RESULT}px`
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

