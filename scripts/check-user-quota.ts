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
        creditsBalance: true,
        isPremium: true,
        premiumExpiresAt: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    console.log('📊 Recent Users:\n')
    
    for (const user of users) {
      const isPremiumActive = user.isPremium && (!user.premiumExpiresAt || user.premiumExpiresAt > new Date())
      const FREE_TRIAL_LIMIT = 3
      
      let remainingTrials = 0
      if (isPremiumActive) {
        remainingTrials = 999
      } else if (user.creditsBalance > 0) {
        remainingTrials = user.creditsBalance
      } else {
        remainingTrials = Math.max(0, FREE_TRIAL_LIMIT - user.freeTrialsUsed)
      }

      console.log(`👤 User: ${user.name || 'Unknown'} (${user.email})`)
      console.log(`   ID: ${user.id}`)
      console.log(`   Free Trials Used: ${user.freeTrialsUsed}`)
      console.log(`   Credits Balance: ${user.creditsBalance}`)
      console.log(`   Is Premium: ${user.isPremium}`)
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

