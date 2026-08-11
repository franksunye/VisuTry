const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const withNextIntl = require('next-intl/plugin')(
  './src/i18n/request.ts'
)

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.public.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: 'mock-blob-storage.vercel.app',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'pbs.twimg.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.shopify.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn11.bigcommerce.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 3600,
  },
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  },
  poweredByHeader: false,
  reactStrictMode: true,

  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-select'],
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
    reactRemoveProperties: process.env.NODE_ENV === 'production',
  },

  transpilePackages: [],

  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/mediapipe/wasm/:path*',
        destination: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm/:path*',
      },
      {
        source: '/mediapipe/models/face_landmarker.task',
        destination: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
      },
    ]
  },
  async redirects() {
    return [
      { source: '/:locale/oval-face-shape', destination: '/:locale/face-shapes/oval', permanent: true },
      { source: '/:locale/round-face-shape', destination: '/:locale/face-shapes/round', permanent: true },
      { source: '/:locale/square-face-shape', destination: '/:locale/face-shapes/square', permanent: true },
      { source: '/:locale/heart-face-shape', destination: '/:locale/face-shapes/heart', permanent: true },
      { source: '/:locale/diamond-face-shape', destination: '/:locale/face-shapes/diamond', permanent: true },
      { source: '/:locale/oblong-face-shape', destination: '/:locale/face-shapes/oblong', permanent: true },
      { source: '/:locale/glasses-for-round-face', destination: '/:locale/style/round-face', permanent: true },
      { source: '/:locale/glasses-for-oval-face', destination: '/:locale/style/oval-face', permanent: true },
      { source: '/:locale/glasses-for-square-face', destination: '/:locale/style/square-face', permanent: true },
      { source: '/:locale/glasses-for-heart-shaped-face', destination: '/:locale/style/heart-face', permanent: true },
      { source: '/:locale/glasses-for-diamond-face', destination: '/:locale/style/diamond-face', permanent: true },
      { source: '/:locale/glasses-for-long-face', destination: '/:locale/style/oblong-face', permanent: true },
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
