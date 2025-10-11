/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // 允许的图片域名
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.public.blob.vercel-storage.com', // Vercel Blob Storage
      },
      {
        protocol: 'https',
        hostname: 'mock-blob-storage.vercel.app', // Mock Blob Storage (测试环境)
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com', // Mock 占位图
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Google OAuth 头像
      },
      {
        protocol: 'https',
        hostname: 'pbs.twimg.com', // Twitter 头像
      },
    ],
    // 图片优化配置
    formats: ['image/webp'], // 优先使用 WebP
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60, // 缓存 60 秒
  },
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  },
  // 性能优化
  compress: true, // 启用 gzip 压缩
  poweredByHeader: false, // 移除 X-Powered-By 头
  reactStrictMode: true, // 启用严格模式
  swcMinify: true, // 使用 SWC 压缩（更快）

  // 优化生产构建
  experimental: {
    optimizePackageImports: ['lucide-react'], // 优化图标库导入
  },
}

module.exports = nextConfig
