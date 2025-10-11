// 列出所有用户
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function listUsers() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      isPremium: true,
      premiumExpiresAt: true,
      freeTrialsUsed: true,
      _count: {
        select: {
          payments: true,
          tryOnTasks: true,
        }
      }
    }
  })
  
  console.log('\n所有用户:\n')
  users.forEach((user, index) => {
    console.log(`${index + 1}. ${user.name} (ID: ${user.id})`)
    console.log(`   Email: ${user.email || 'null'}`)
    console.log(`   Premium: ${user.isPremium}`)
    if (user.premiumExpiresAt) {
      console.log(`   Expires: ${user.premiumExpiresAt.toLocaleString('zh-CN')}`)
    }
    console.log(`   Free Trials Used: ${user.freeTrialsUsed}`)
    console.log(`   Payments: ${user._count.payments}`)
    console.log(`   Try-Ons: ${user._count.tryOnTasks}`)
    console.log('')
  })
  
  await prisma.$disconnect()
}

listUsers()

