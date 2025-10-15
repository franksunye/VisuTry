/**
 * 查询用户数据和支付记录
 * 用于调试 Credits Pack 购买问题
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // 查询最近的支付记录
  console.log('\n=== 最近的支付记录 ===')
  const recentPayments = await prisma.payment.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        }
      }
    }
  })

  recentPayments.forEach((payment, index) => {
    console.log(`\n${index + 1}. Payment ID: ${payment.id}`)
    console.log(`   User: ${payment.user.name} (${payment.user.email})`)
    console.log(`   Product: ${payment.productType}`)
    console.log(`   Amount: $${payment.amount / 100}`)
    console.log(`   Status: ${payment.status}`)
    console.log(`   Created: ${payment.createdAt}`)
    console.log(`   Stripe Payment ID: ${payment.stripePaymentId}`)
  })

  // 查询最近登录的用户（可能是测试用户）
  console.log('\n\n=== 最近活跃的用户 ===')
  const recentUsers = await prisma.user.findMany({
    orderBy: { updatedAt: 'desc' },
    take: 3,
    select: {
      id: true,
      name: true,
      email: true,
      isPremium: true,
      premiumExpiresAt: true,
      freeTrialsUsed: true,
      createdAt: true,
      updatedAt: true,
    }
  })

  recentUsers.forEach((user, index) => {
    console.log(`\n${index + 1}. User: ${user.name}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   ID: ${user.id}`)
    console.log(`   Premium: ${user.isPremium}`)
    console.log(`   Premium Expires: ${user.premiumExpiresAt}`)
    console.log(`   Free Trials Used: ${user.freeTrialsUsed}`)
    console.log(`   Last Updated: ${user.updatedAt}`)
  })

  // 查询特定用户的所有支付记录（如果有 email 参数）
  const userEmail = process.argv[2]
  if (userEmail) {
    console.log(`\n\n=== 用户 ${userEmail} 的所有支付记录 ===`)
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (user) {
      console.log(`\nUser: ${user.name}`)
      console.log(`Free Trials Used: ${user.freeTrialsUsed}`)
      console.log(`Premium: ${user.isPremium}`)

      console.log(`\nPayments (${user.payments.length} total):`)
      user.payments.forEach((payment, index) => {
        console.log(`\n  ${index + 1}. ${payment.productType} - $${payment.amount / 100}`)
        console.log(`     Status: ${payment.status}`)
        console.log(`     Date: ${payment.createdAt}`)
      })
    } else {
      console.log(`User not found: ${userEmail}`)
    }
  }
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

