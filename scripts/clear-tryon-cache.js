const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function clearTryOnCache() {
  const userId = 'cmgj1ii6h0000ti1h35uxukv7'
  
  try {
    console.log('🧹 清除Try-On页面缓存...')
    console.log('用户ID:', userId)
    
    // 这里我们无法直接清除Next.js的unstable_cache
    // 但我们可以检查缓存标签和重新验证时间
    console.log('缓存标签:', `tryon-data-${userId}`)
    console.log('缓存标签:', `user-${userId}`)
    console.log('缓存标签:', 'tryon')
    
    console.log('✅ 缓存信息已显示')
    console.log('💡 建议：重新部署应用或等待60秒让缓存自动过期')
    
  } catch (error) {
    console.error('❌ 错误:', error)
  } finally {
    await prisma.$disconnect()
  }
}

clearTryOnCache()
