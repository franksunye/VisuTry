/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://visutry.com',
  generateRobotsTxt: false, // 我们已经手动创建了 robots.txt
  generateIndexSitemap: true, // 生成索引站点地图
  
  // 排除不需要索引的页面
  exclude: [
    '/api/*',
    '/admin/*',
    '/debug/*',
    '/test/*',
    '/private/*',
    '/_next/*',
    '/404',
    '/500'
  ],

  // 包含动态路由
  additionalPaths: async (config) => {
    const result = []
    
    // 添加静态页面
    const staticPages = [
      '/',
      '/about',
      '/privacy',
      '/terms',
      '/contact'
    ]
    
    staticPages.forEach(page => {
      result.push({
        loc: page,
        changefreq: 'weekly',
        priority: page === '/' ? 1.0 : 0.8,
        lastmod: new Date().toISOString(),
      })
    })

    return result
  },

  // 默认配置
  changefreq: 'daily',
  priority: 0.7,
  sitemapSize: 5000,
  
  // 自定义转换函数
  transform: async (config, path) => {
    // 自定义页面优先级
    let priority = 0.7
    let changefreq = 'daily'
    
    if (path === '/') {
      priority = 1.0
      changefreq = 'daily'
    } else if (path.startsWith('/blog/')) {
      priority = 0.8
      changefreq = 'weekly'
    } else if (path.startsWith('/try/')) {
      priority = 0.9
      changefreq = 'weekly'
    } else if (path.startsWith('/share/')) {
      priority = 0.6
      changefreq = 'monthly'
    } else if (path.startsWith('/user/')) {
      priority = 0.5
      changefreq = 'monthly'
    }

    return {
      loc: path,
      changefreq,
      priority,
      lastmod: new Date().toISOString(),
    }
  },

  // 机器人文件配置
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/_next/', '/debug/', '/test/', '/private/']
      }
    ],
    additionalSitemaps: [
      `${process.env.NEXT_PUBLIC_SITE_URL || 'https://visutry.com'}/sitemap.xml`,
    ],
  }
}
