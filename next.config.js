const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const withNextIntl = require('next-intl/plugin')(
  // Specify the path to the request config
  './src/i18n/request.ts'
)

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
  async redirects() {
    return [
      { source: '/:locale/how-to-choose-glasses-for-your-face', destination: '/:locale/blog/how-to-choose-glasses-for-your-face', permanent: true },
      { source: '/:locale/best-ai-virtual-glasses-tryon-tools-2025', destination: '/:locale/blog/best-ai-virtual-glasses-tryon-tools-2025', permanent: true },
      { source: '/:locale/rayban-glasses-virtual-tryon-guide', destination: '/:locale/blog/rayban-glasses-virtual-tryon-guide', permanent: true },
      { source: '/:locale/celebrity-glasses-style-guide-2025', destination: '/:locale/blog/celebrity-glasses-style-guide-2025', permanent: true },
      { source: '/:locale/oliver-peoples-finley-vintage-review', destination: '/:locale/blog/oliver-peoples-finley-vintage-review', permanent: true },
      { source: '/:locale/tom-ford-luxury-eyewear-guide-2025', destination: '/:locale/blog/tom-ford-luxury-eyewear-guide-2025', permanent: true },
      { source: '/:locale/acetate-vs-plastic-eyeglass-frames-guide', destination: '/:locale/blog/acetate-vs-plastic-eyeglass-frames-guide', permanent: true },
      { source: '/:locale/browline-clubmaster-glasses-complete-guide', destination: '/:locale/blog/browline-clubmaster-glasses-complete-guide', permanent: true },
      { source: '/:locale/prescription-glasses-online-shopping-guide-2025', destination: '/:locale/blog/prescription-glasses-online-shopping-guide-2025', permanent: true },
      { source: '/:locale/prescription-glasses-virtual-tryon-guide', destination: '/:locale/blog/prescription-glasses-virtual-tryon-guide', permanent: true },
      { source: '/:locale/find-perfect-glasses-online-guide', destination: '/:locale/blog/find-perfect-glasses-online-guide', permanent: true },
    ]
  },
}

module.exports = withBundleAnalyzer(withNextIntl(nextConfig))
