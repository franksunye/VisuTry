/**
 * 修复现有用户的 credits 数据
 * 将负数的 freeTrialsUsed 转换为正数的 creditsBalance
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('开始修复用户 credits 数据...\n')

  // 查找所有 freeTrialsUsed 为负数的用户
  const usersWithNegativeTrials = await prisma.user.findMany({
    where: {
      freeTrialsUsed: {
        lt: 0
      }
    },
    select: {
      id: true,
      name: true,
      email: true,
      freeTrialsUsed: true,
      creditsBalance: true,
    }
  })

  console.log(`找到 ${usersWithNegativeTrials.length} 个需要修复的用户\n`)

  for (const user of usersWithNegativeTrials) {
    const creditsToAdd = Math.abs(user.freeTrialsUsed)
    
    console.log(`修复用户: ${user.name} (${user.email})`)
    console.log(`  当前 freeTrialsUsed: ${user.freeTrialsUsed}`)
    console.log(`  当前 creditsBalance: ${user.creditsBalance}`)
    console.log(`  将增加 ${creditsToAdd} credits`)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        freeTrialsUsed: 0,
        creditsBalance: {
          increment: creditsToAdd
        }
      }
    })

    console.log(`  ✅ 修复完成\n`)
  }

  // 显示修复后的结果
  console.log('\n=== 修复后的用户数据 ===')
  const fixedUsers = await prisma.user.findMany({
    where: {
      id: {
        in: usersWithNegativeTrials.map(u => u.id)
      }
    },
    select: {
      id: true,
      name: true,
      email: true,
      freeTrialsUsed: true,
      creditsBalance: true,
    }
  })

  fixedUsers.forEach(user => {
    console.log(`\n${user.name} (${user.email})`)
    console.log(`  freeTrialsUsed: ${user.freeTrialsUsed}`)
    console.log(`  creditsBalance: ${user.creditsBalance}`)
  })

  console.log(`\n✅ 所有用户数据修复完成！`)
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

