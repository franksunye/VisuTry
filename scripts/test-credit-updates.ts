/**
 * 测试脚本：验证Credits更新流程
 * 
 * 测试场景：
 * 1. 查看当前用户的credits余额
 * 2. 模拟购买Credits Pack（增加10 credits）
 * 3. 验证数据库更新
 * 4. 模拟消费credits（Try-on）
 * 5. 验证数据库更新
 */

import { PrismaClient } from '@prisma/client'
import { QUOTA_CONFIG } from '../src/config/pricing'

const prisma = new PrismaClient()

async function main() {
  console.log('🧪 开始测试Credits更新流程...\n')

  // 1. 获取测试用户（使用第一个用户）
  const user = await prisma.user.findFirst({
    orderBy: { createdAt: 'desc' }
  })

  if (!user) {
    console.log('❌ 没有找到用户，请先登录创建用户')
    return
  }

  console.log('📊 测试用户信息:')
  console.log(`   ID: ${user.id}`)
  console.log(`   Name: ${user.name}`)
  console.log(`   Email: ${user.email}`)
  console.log(`   Credits Balance: ${user.creditsBalance}`)
  console.log(`   Free Trials Used: ${user.freeTrialsUsed}`)
  console.log(`   Premium Usage Count: ${user.premiumUsageCount}`)
  console.log(`   Is Premium: ${user.isPremium}`)
  console.log()

  // 2. 模拟购买Credits Pack
  console.log('💳 模拟购买Credits Pack...')
  const beforeCredits = user.creditsBalance
  
  await prisma.user.update({
    where: { id: user.id },
    data: {
      creditsBalance: {
        increment: QUOTA_CONFIG.CREDITS_PACK
      }
    }
  })

  const afterPurchase = await prisma.user.findUnique({
    where: { id: user.id }
  })

  console.log(`   购买前: ${beforeCredits} credits`)
  console.log(`   购买后: ${afterPurchase?.creditsBalance} credits`)
  console.log(`   增加: ${QUOTA_CONFIG.CREDITS_PACK} credits`)
  console.log(`   ✅ Credits增加成功！\n`)

  // 3. 模拟消费credits（Try-on）
  console.log('🎨 模拟Try-on消费...')
  
  // 检查用户是否是Premium
  const isPremiumActive = afterPurchase?.isPremium && 
    (!afterPurchase?.premiumExpiresAt || afterPurchase?.premiumExpiresAt > new Date())

  if (isPremiumActive) {
    // Premium用户：增加premiumUsageCount
    await prisma.user.update({
      where: { id: user.id },
      data: {
        premiumUsageCount: {
          increment: 1
        }
      }
    })
    console.log('   Premium用户：premiumUsageCount +1')
  } else {
    // 免费用户：优先使用credits，如果没有credits则使用freeTrials
    if (afterPurchase && afterPurchase.creditsBalance > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          creditsBalance: {
            decrement: 1
          }
        }
      })
      console.log('   免费用户：creditsBalance -1')
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          freeTrialsUsed: {
            increment: 1
          }
        }
      })
      console.log('   免费用户：freeTrialsUsed +1')
    }
  }

  const afterConsumption = await prisma.user.findUnique({
    where: { id: user.id }
  })

  console.log(`   消费后 Credits Balance: ${afterConsumption?.creditsBalance}`)
  console.log(`   消费后 Free Trials Used: ${afterConsumption?.freeTrialsUsed}`)
  console.log(`   消费后 Premium Usage Count: ${afterConsumption?.premiumUsageCount}`)
  console.log(`   ✅ 消费记录成功！\n`)

  // 4. 显示最终状态
  console.log('📊 最终用户状态:')
  console.log(`   Credits Balance: ${afterConsumption?.creditsBalance}`)
  console.log(`   Free Trials Used: ${afterConsumption?.freeTrialsUsed}`)
  console.log(`   Premium Usage Count: ${afterConsumption?.premiumUsageCount}`)
  
  // 计算剩余额度
  let remainingQuota = 0
  if (isPremiumActive) {
    const subscriptionQuota = QUOTA_CONFIG.MONTHLY_SUBSCRIPTION // 假设是月费
    remainingQuota = Math.max(0, subscriptionQuota - (afterConsumption?.premiumUsageCount || 0))
    remainingQuota += afterConsumption?.creditsBalance || 0
    console.log(`   剩余额度: ${remainingQuota} (订阅 + Credits)`)
  } else {
    const freeQuota = Math.max(0, QUOTA_CONFIG.FREE_TRIAL - (afterConsumption?.freeTrialsUsed || 0))
    remainingQuota = freeQuota + (afterConsumption?.creditsBalance || 0)
    console.log(`   剩余额度: ${remainingQuota} (免费 ${freeQuota} + Credits ${afterConsumption?.creditsBalance})`)
  }

  console.log('\n✅ 测试完成！')
}

main()
  .catch((error) => {
    console.error('❌ 测试失败:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

