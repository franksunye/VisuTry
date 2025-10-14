const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixUserData() {
  try {
    console.log('🔧 修复用户数据...')
    
    // 查找所有freeTrialsUsed为负数的用户
    const abnormalUsers = await prisma.user.findMany({
      where: {
        freeTrialsUsed: { lt: 0 }
      },
      select: {
        id: true,
        name: true,
        email: true,
        freeTrialsUsed: true,
      }
    })

    console.log(`\n发现 ${abnormalUsers.length} 个异常用户:`)
    
    for (const user of abnormalUsers) {
      console.log(`\n修复用户: ${user.name || 'Unknown'} (${user.email})`)
      console.log(`  当前 freeTrialsUsed: ${user.freeTrialsUsed}`)
      
      // 将负数重置为0
      const result = await prisma.user.update({
        where: { id: user.id },
        data: { freeTrialsUsed: 0 },
        select: { freeTrialsUsed: true }
      })
      
      console.log(`  修复后 freeTrialsUsed: ${result.freeTrialsUsed}`)
    }

    // 验证修复结果
    const verifyUsers = await prisma.user.findMany({
      where: {
        freeTrialsUsed: { lt: 0 }
      }
    })

    if (verifyUsers.length === 0) {
      console.log('\n✅ 所有异常数据已修复!')
    } else {
      console.log(`\n❌ 仍有 ${verifyUsers.length} 个异常用户`)
    }

    // 显示修复后的统计
    const stats = await prisma.user.aggregate({
      _count: { id: true },
      _min: { freeTrialsUsed: true },
      _max: { freeTrialsUsed: true },
      _avg: { freeTrialsUsed: true }
    })

    console.log('\n📈 修复后统计:')
    console.log(`总用户数: ${stats._count.id}`)
    console.log(`最小试用次数: ${stats._min.freeTrialsUsed}`)
    console.log(`最大试用次数: ${stats._max.freeTrialsUsed}`)
    console.log(`平均试用次数: ${stats._avg.freeTrialsUsed?.toFixed(2)}`)

  } catch (error) {
    console.error('❌ 修复失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixUserData()
