// 验证 Dashboard 修复的脚本
// 运行: node scripts/verify-dashboard-fix.js

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function verifyFix() {
  console.log('\n🔍 验证 Dashboard 修复...\n')
  console.log('='.repeat(80))

  try {
    // 1. 查询用户数据
    console.log('\n📊 查询用户数据:')
    console.log('-'.repeat(80))
    
    const user = await prisma.user.findFirst({
      where: {
        id: 'cmgj1ii6h0000ti1h35uxukv7' // Premium 用户
      },
      select: {
        id: true,
        name: true,
        email: true,
        isPremium: true,
        premiumExpiresAt: true,
        freeTrialsUsed: true,
        _count: {
          select: {
            tryOnTasks: true,
            payments: true,
          }
        }
      }
    })

    if (!user) {
      console.log('❌ 未找到用户')
      return
    }

    console.log(`✅ 用户: ${user.name}`)
    console.log(`   ID: ${user.id}`)
    console.log(`   Email: ${user.email || 'null'}`)
    console.log(`   高级会员: ${user.isPremium ? '✅ 是' : '❌ 否'}`)
    if (user.premiumExpiresAt) {
      console.log(`   过期时间: ${user.premiumExpiresAt.toLocaleString('zh-CN')}`)
      const isActive = user.premiumExpiresAt > new Date()
      console.log(`   会员状态: ${isActive ? '✅ 有效' : '❌ 已过期'}`)
    }
    console.log(`   已使用试戴次数: ${user.freeTrialsUsed}`)
    console.log(`   总试戴任务: ${user._count.tryOnTasks}`)
    console.log(`   支付记录: ${user._count.payments}`)

    // 2. 计算 Dashboard 应该显示的数据
    console.log('\n📈 Dashboard 应该显示的数据:')
    console.log('-'.repeat(80))

    const freeTrialLimit = 3
    const isPremiumActive = user.isPremium && 
      (!user.premiumExpiresAt || user.premiumExpiresAt > new Date())
    const remainingTrials = Math.max(0, freeTrialLimit - user.freeTrialsUsed)

    console.log(`Membership: ${isPremiumActive ? 'Premium' : 'Free'}`)
    console.log(`Remaining Uses: ${isPremiumActive ? 'Unlimited' : remainingTrials}`)
    console.log(`Try-ons Used: ${user.freeTrialsUsed} / ${freeTrialLimit}`)
    console.log(`Total Try-Ons: ${user._count.tryOnTasks}`)

    // 3. 查询试戴任务统计
    console.log('\n📊 试戴任务统计:')
    console.log('-'.repeat(80))

    const statusGroups = await prisma.tryOnTask.groupBy({
      by: ['status'],
      where: { userId: user.id },
      _count: {
        id: true,
      },
    })

    const totalTryOns = statusGroups.reduce((sum, group) => sum + group._count.id, 0)
    const completedTryOns = statusGroups.find(g => g.status === 'COMPLETED')?._count.id || 0

    console.log(`总试戴次数: ${totalTryOns}`)
    console.log(`成功完成: ${completedTryOns}`)
    
    statusGroups.forEach(group => {
      console.log(`  - ${group.status}: ${group._count.id}`)
    })

    // 4. 验证修复
    console.log('\n✅ 修复验证:')
    console.log('-'.repeat(80))
    
    if (isPremiumActive) {
      console.log('✅ 用户是 Premium 会员')
      console.log('✅ Dashboard 应该显示:')
      console.log('   - Membership: Premium')
      console.log('   - Remaining Uses: Unlimited')
      console.log('   - 右侧卡片: Premium Member (金色)')
    } else {
      console.log('❌ 用户不是 Premium 会员')
      console.log('📝 Dashboard 应该显示:')
      console.log('   - Membership: Free')
      console.log(`   - Remaining Uses: ${remainingTrials}`)
      console.log('   - 右侧卡片: Free User (蓝色)')
    }

    // 5. 最近的支付记录
    console.log('\n💳 最近的支付记录:')
    console.log('-'.repeat(80))

    const recentPayments = await prisma.payment.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 3,
    })

    if (recentPayments.length === 0) {
      console.log('没有支付记录')
    } else {
      recentPayments.forEach((payment, index) => {
        console.log(`${index + 1}. $${(payment.amount / 100).toFixed(2)} - ${payment.productType}`)
        console.log(`   状态: ${payment.status}`)
        console.log(`   时间: ${payment.createdAt.toLocaleString('zh-CN')}`)
      })
    }

  } catch (error) {
    console.error('\n❌ 错误:', error.message)
    console.error('\n详细错误信息:')
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }

  console.log('\n' + '='.repeat(80))
  console.log('\n✅ 验证完成!\n')
}

// 运行验证
verifyFix()

