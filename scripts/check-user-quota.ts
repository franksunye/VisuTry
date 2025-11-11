import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkUserQuota() {
  try {
    console.log('🔍 Checking user quota data...\n')

    // 查找所有用户，按最近登录排序
    const users = await prisma.user.findMany({
      orderBy: {
        updatedAt: 'desc'
      },
      take: 5,
      select: {
        id: true,
        email: true,
        name: true,
        freeTrialsUsed: true,
        creditsPurchased: true,
        creditsUsed: true,
        premiumUsageCount: true,
        isPremium: true,
        premiumExpiresAt: true,
        currentSubscriptionType: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    console.log('📊 Recent Users:\n')
    
    for (const user of users) {
      const isPremiumActive = user.isPremium && (!user.premiumExpiresAt || user.premiumExpiresAt > new Date())
      const FREE_TRIAL_LIMIT = 3
      const MONTHLY_QUOTA = 30
      const YEARLY_QUOTA = 420

      const creditsRemaining = (user.creditsPurchased || 0) - (user.creditsUsed || 0)

      let remainingTrials = 0
      if (isPremiumActive && user.currentSubscriptionType) {
        const quota = user.currentSubscriptionType === 'PREMIUM_YEARLY' ? YEARLY_QUOTA : MONTHLY_QUOTA
        const subscriptionRemaining = Math.max(0, quota - (user.premiumUsageCount || 0))
        remainingTrials = subscriptionRemaining + creditsRemaining
      } else {
        const freeRemaining = Math.max(0, FREE_TRIAL_LIMIT - user.freeTrialsUsed)
        remainingTrials = freeRemaining + creditsRemaining
      }

      console.log(`👤 User: ${user.name || 'Unknown'} (${user.email})`)
      console.log(`   ID: ${user.id}`)
      console.log(`   Free Trials Used: ${user.freeTrialsUsed}/${FREE_TRIAL_LIMIT}`)
      console.log(`   Credits: ${creditsRemaining}/${user.creditsPurchased || 0} (Purchased: ${user.creditsPurchased || 0}, Used: ${user.creditsUsed || 0})`)
      console.log(`   Is Premium: ${user.isPremium}`)
      console.log(`   Subscription Type: ${user.currentSubscriptionType || 'N/A'}`)
      console.log(`   Premium Usage: ${user.premiumUsageCount || 0}`)
      console.log(`   Premium Expires: ${user.premiumExpiresAt || 'N/A'}`)
      console.log(`   ✅ Calculated Remaining: ${remainingTrials}`)
      console.log(`   Last Updated: ${user.updatedAt}`)
      console.log('')

      // 查询最近的 try-on 任务
      const recentTryOns = await prisma.tryOnTask.findMany({
        where: {
          userId: user.id
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 3,
        select: {
          id: true,
          status: true,
          createdAt: true,
        }
      })

      if (recentTryOns.length > 0) {
        console.log(`   📝 Recent Try-Ons:`)
        recentTryOns.forEach((task, index) => {
          console.log(`      ${index + 1}. ${task.status} - ${task.createdAt}`)
        })
        console.log('')
      }
    }

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUserQuota()

