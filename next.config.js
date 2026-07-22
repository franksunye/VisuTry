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
    formats: ['image/avif', 'image/webp'], // AVIF + WebP
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 3600, // 1 hour
  },
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  },
  poweredByHeader: false,
  reactStrictMode: true,

  // 优化生产构建
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-select'],
  },

  // 移除 console.log（生产环境保留 error/warn）
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
    reactRemoveProperties: process.env.NODE_ENV === 'production',
  },

  transpilePackages: [],

  output: 'standalone',
  async redirects() {
    return [
      // Clean up legacy non-locale SEO URLs that Google already discovered.
      // The app uses locale-prefixed routes, so keep old blog/tag/share URLs
      // from becoming long-lived 404 examples in Search Console.
      { source: '/blog/tag/:tag', destination: '/en/blog/tag/:tag', permanent: true },
      { source: '/blog/:slug', destination: '/en/blog/:slug', permanent: true },
      { source: '/tag/:tag', destination: '/en/blog/tag/:tag', permanent: true },
      { source: '/share/:id', destination: '/en/share/:id', permanent: true },
      { source: '/:locale/tag/:tag', destination: '/:locale/blog/tag/:tag', permanent: true },
      { source: '/:locale/blog/best-glasses-for-face-shapes-guide', destination: '/:locale/blog/how-to-choose-glasses-for-your-face', permanent: true },
      { source: '/:locale/how-to-choose-glasses-for-your-face', destination: '/:locale/blog/how-to-choose-glasses-for-your-face', permanent: true },
      { source: '/:locale/best-glasses-for-face-shapes-guide', destination: '/:locale/blog/how-to-choose-glasses-for-your-face', permanent: true },
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
      { source: '/:locale/virtual-try-on-reduce-eyewear-returns', destination: '/:locale/blog/virtual-try-on-reduce-eyewear-returns', permanent: true },
    ]
  },
}

module.exports = withBundleAnalyzer(withNextIntl(nextConfig))
