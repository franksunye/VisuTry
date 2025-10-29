const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

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
    optimizePackageImports: ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-select'], // 优化图标库和组件库导入
  },

  // 优化字体加载
  optimizeFonts: true,

  // 启用 HTTP/2 Server Push
  generateEtags: true,

  // 优化 CSS
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
    // 移除 React 属性
    reactRemoveProperties: process.env.NODE_ENV === 'production',
  },

  // 现代浏览器目标 - 移除不必要的 polyfills
  // 支持 ES2020+ 特性，减少 11.6 KiB 的 legacy JavaScript
  transpilePackages: [],

  // 优化输出
  output: 'standalone',

  // 优化 CSS 加载
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
    },
  },
}

module.exports = withBundleAnalyzer(nextConfig)
