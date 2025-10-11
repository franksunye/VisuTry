#!/usr/bin/env node
/**
 * 重置用户状态以便重复测试支付功能
 * 
 * 用法:
 *   node scripts/reset-user-for-testing.js
 *   node scripts/reset-user-for-testing.js --user-id=cmgj1ii6h0000ti1h35uxukv7
 *   node scripts/reset-user-for-testing.js --quick
 *   node scripts/reset-user-for-testing.js --full
 */

const { PrismaClient } = require('@prisma/client')
const readline = require('readline')

const prisma = new PrismaClient()

// 创建命令行交互接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

// 提问函数
function question(query) {
  return new Promise(resolve => rl.question(query, resolve))
}

// 解析命令行参数
const args = process.argv.slice(2)
const params = {}
args.forEach(arg => {
  if (arg.startsWith('--')) {
    const [key, value] = arg.slice(2).split('=')
    params[key] = value || true
  }
})

async function showCurrentStatus(userId) {
  console.log('\n📊 当前用户状态:')
  console.log('='.repeat(80))
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
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

  if (!user) {
    console.log('❌ 用户不存在')
    return null
  }

  console.log(`用户: ${user.name} (ID: ${user.id})`)
  console.log(`Email: ${user.email || 'null'}`)
  console.log(`Premium: ${user.isPremium ? '✅ 是' : '❌ 否'}`)
  if (user.premiumExpiresAt) {
    const isActive = user.premiumExpiresAt > new Date()
    console.log(`过期时间: ${user.premiumExpiresAt.toLocaleString('zh-CN')} ${isActive ? '✅' : '❌'}`)
  }
  console.log(`已使用试戴次数: ${user.freeTrialsUsed}`)
  console.log(`支付记录数: ${user._count.payments}`)
  console.log(`试戴任务数: ${user._count.tryOnTasks}`)

  // 显示最近的支付记录
  const payments = await prisma.payment.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  if (payments.length > 0) {
    console.log('\n最近的支付记录:')
    payments.forEach((payment, index) => {
      console.log(`  ${index + 1}. $${(payment.amount / 100).toFixed(2)} - ${payment.productType} - ${payment.status}`)
      console.log(`     时间: ${payment.createdAt.toLocaleString('zh-CN')}`)
    })
  }

  console.log('='.repeat(80))
  return user
}

async function quickReset(userId) {
  console.log('\n🔄 执行快速重置...')
  console.log('  - 重置会员状态为 Free')
  console.log('  - 重置试戴次数为 0')
  console.log('  - 保留支付记录（仅供参考）')
  
  const result = await prisma.user.update({
    where: { id: userId },
    data: {
      isPremium: false,
      premiumExpiresAt: null,
      freeTrialsUsed: 0,
    }
  })

  console.log('✅ 快速重置完成！')
  return result
}

async function fullReset(userId) {
  console.log('\n🔄 执行完全重置...')
  console.log('  - 重置会员状态为 Free')
  console.log('  - 重置试戴次数为 0')
  console.log('  - 删除所有支付记录')
  
  // 删除支付记录
  const deleteResult = await prisma.payment.deleteMany({
    where: { userId }
  })
  console.log(`  ✅ 已删除 ${deleteResult.count} 条支付记录`)

  // 重置用户状态
  const result = await prisma.user.update({
    where: { id: userId },
    data: {
      isPremium: false,
      premiumExpiresAt: null,
      freeTrialsUsed: 0,
    }
  })

  console.log('✅ 完全重置完成！')
  return result
}

async function softReset(userId) {
  console.log('\n🔄 执行软重置...')
  console.log('  - 重置会员状态为 Free')
  console.log('  - 保留试戴次数（显示真实使用情况）')
  console.log('  - 保留所有支付记录')
  
  const result = await prisma.user.update({
    where: { id: userId },
    data: {
      isPremium: false,
      premiumExpiresAt: null,
    }
  })

  console.log('✅ 软重置完成！')
  return result
}

async function listAllUsers() {
  console.log('\n👥 所有用户列表:')
  console.log('='.repeat(80))
  
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      isPremium: true,
      _count: {
        select: {
          payments: true,
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  users.forEach((user, index) => {
    console.log(`${index + 1}. ${user.name} (ID: ${user.id})`)
    console.log(`   Email: ${user.email || 'null'}`)
    console.log(`   Premium: ${user.isPremium ? '✅' : '❌'}`)
    console.log(`   支付记录: ${user._count.payments}`)
    console.log('')
  })

  return users
}

async function main() {
  console.log('\n🧪 用户状态重置工具 - 用于测试支付功能\n')

  try {
    let userId = params['user-id']

    // 如果没有指定用户ID，列出所有用户并让用户选择
    if (!userId) {
      const users = await listAllUsers()
      
      if (users.length === 0) {
        console.log('❌ 没有找到任何用户')
        return
      }

      const answer = await question('请输入要重置的用户编号（或输入用户ID）: ')
      const userIndex = parseInt(answer) - 1
      
      if (userIndex >= 0 && userIndex < users.length) {
        userId = users[userIndex].id
      } else {
        userId = answer.trim()
      }
    }

    // 显示当前状态
    const user = await showCurrentStatus(userId)
    if (!user) {
      console.log('❌ 用户不存在，退出')
      return
    }

    // 选择重置模式
    let mode = params.quick ? 'quick' : params.full ? 'full' : params.soft ? 'soft' : null

    if (!mode) {
      console.log('\n请选择重置模式:')
      console.log('1. 快速重置 (推荐) - 重置会员状态，保留支付记录')
      console.log('2. 完全重置 - 删除所有支付记录，完全清空')
      console.log('3. 软重置 - 只重置会员状态，保留试戴次数和支付记录')
      console.log('4. 取消')
      
      const choice = await question('\n请输入选项 (1-4): ')
      
      switch (choice.trim()) {
        case '1':
          mode = 'quick'
          break
        case '2':
          mode = 'full'
          break
        case '3':
          mode = 'soft'
          break
        case '4':
          console.log('已取消')
          return
        default:
          console.log('无效选项，已取消')
          return
      }
    }

    // 确认操作
    const confirm = await question(`\n⚠️  确认要执行 ${mode} 重置吗？(yes/no): `)
    if (confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
      console.log('已取消')
      return
    }

    // 执行重置
    switch (mode) {
      case 'quick':
        await quickReset(userId)
        break
      case 'full':
        await fullReset(userId)
        break
      case 'soft':
        await softReset(userId)
        break
    }

    // 显示重置后的状态
    await showCurrentStatus(userId)

    console.log('\n✅ 重置完成！现在可以重新测试支付功能了。')
    console.log('\n📝 测试步骤:')
    console.log('1. 访问 https://visutry.vercel.app/pricing')
    console.log('2. 点击支付按钮')
    console.log('3. 使用测试卡号: 4242 4242 4242 4242')
    console.log('4. 完成支付')
    console.log('5. 检查 Dashboard 显示是否正确')

  } catch (error) {
    console.error('\n❌ 错误:', error.message)
    console.error(error)
  } finally {
    rl.close()
    await prisma.$disconnect()
  }
}

// 运行主函数
main()

