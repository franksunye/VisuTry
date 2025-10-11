/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'vercel.app'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
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
    optimizeCss: true, // 优化 CSS
    optimizePackageImports: ['lucide-react'], // 优化图标库导入
  },
}

module.exports = nextConfig
