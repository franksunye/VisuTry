#!/usr/bin/env node
// Git提交准备脚本

const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

class CommitPreparer {
  constructor() {
    this.rootDir = process.cwd()
    this.changes = {
      testFramework: [],
      mockServices: [],
      apiUpdates: [],
      documentation: [],
      cleanup: []
    }
  }

  /**
   * 准备提交
   */
  async prepareCommit() {
    console.log('📦 准备Git提交...')
    console.log('=' .repeat(50))

    try {
      // 1. 检查Git状态
      await this.checkGitStatus()

      // 2. 分类变更
      this.categorizeChanges()

      // 3. 创建提交计划
      this.createCommitPlan()

      // 4. 执行分阶段提交
      await this.executeCommits()

      console.log('✅ 提交准备完成!')

    } catch (error) {
      console.error('❌ 提交准备失败:', error.message)
      process.exit(1)
    }
  }

  /**
   * 检查Git状态
   */
  async checkGitStatus() {
    console.log('🔍 检查Git状态...')

    const status = await this.runGitCommand(['status', '--porcelain'])
    
    if (!status.trim()) {
      console.log('✅ 工作目录干净，无需提交')
      process.exit(0)
    }

    console.log('📋 发现以下变更:')
    console.log(status)
  }

  /**
   * 分类变更
   */
  categorizeChanges() {
    console.log('📂 分类变更文件...')

    // 测试框架相关
    this.changes.testFramework = [
      'tests/',
      'package.json'
    ]

    // Mock服务相关
    this.changes.mockServices = [
      'src/lib/mocks/',
      'src/lib/auth.ts'
    ]

    // API更新
    this.changes.apiUpdates = [
      'src/app/api/upload/route.ts',
      'src/app/api/try-on/submit/route.ts',
      'src/app/api/try-on/history/route.ts',
      'src/app/api/payment/create-session/route.ts',
      'src/app/api/frames/route.ts'
    ]

    // 文档和配置
    this.changes.documentation = [
      'TEST_REPORT.md',
      '.gitignore',
      'prisma/schema.prisma'
    ]

    // 清理的文件
    this.changes.cleanup = [
      'test-basic.js',
      'test-results.json'
    ]

    console.log('✅ 变更分类完成')
  }

  /**
   * 创建提交计划
   */
  createCommitPlan() {
    console.log('📋 创建提交计划...')

    this.commitPlan = [
      {
        name: 'feat: 实现完整的测试框架系统',
        description: '添加系统化的测试管理体系，包括集成测试、API测试和测试工具',
        files: this.changes.testFramework,
        priority: 1
      },
      {
        name: 'feat: 增强Mock服务系统',
        description: '完善Mock服务实现，支持完整的测试模式功能',
        files: this.changes.mockServices,
        priority: 2
      },
      {
        name: 'fix: 优化API端点以支持Mock模式',
        description: '更新API端点以支持测试模式和Mock服务集成',
        files: this.changes.apiUpdates,
        priority: 3
      },
      {
        name: 'docs: 更新测试文档和配置',
        description: '添加测试报告、更新配置文件和文档',
        files: this.changes.documentation,
        priority: 4
      },
      {
        name: 'cleanup: 清理旧版测试文件',
        description: '移除过时的测试文件，整理项目结构',
        files: this.changes.cleanup,
        priority: 5
      }
    ]

    console.log('📋 提交计划:')
    this.commitPlan.forEach((commit, index) => {
      console.log(`  ${index + 1}. ${commit.name}`)
      console.log(`     ${commit.description}`)
    })
  }

  /**
   * 执行分阶段提交
   */
  async executeCommits() {
    console.log('🚀 执行分阶段提交...')

    for (const commit of this.commitPlan) {
      console.log(`\n📦 准备提交: ${commit.name}`)

      try {
        // 添加相关文件
        for (const filePattern of commit.files) {
          await this.addFiles(filePattern)
        }

        // 检查是否有文件被添加
        const stagedFiles = await this.runGitCommand(['diff', '--cached', '--name-only'])
        
        if (stagedFiles.trim()) {
          // 创建提交
          await this.createCommit(commit.name, commit.description)
          console.log(`✅ 提交完成: ${commit.name}`)
        } else {
          console.log(`⏭️ 跳过空提交: ${commit.name}`)
        }

      } catch (error) {
        console.error(`❌ 提交失败: ${commit.name} - ${error.message}`)
        throw error
      }
    }
  }

  /**
   * 添加文件到暂存区
   */
  async addFiles(pattern) {
    try {
      if (fs.existsSync(path.join(this.rootDir, pattern))) {
        await this.runGitCommand(['add', pattern])
        console.log(`  ✅ 添加: ${pattern}`)
      } else {
        console.log(`  ⚠️ 文件不存在: ${pattern}`)
      }
    } catch (error) {
      console.warn(`  ⚠️ 添加文件失败: ${pattern} - ${error.message}`)
    }
  }

  /**
   * 创建提交
   */
  async createCommit(title, description) {
    const commitMessage = `${title}\n\n${description}\n\n- 系统化测试管理\n- Mock服务集成\n- API测试覆盖\n- 文档完善`
    
    await this.runGitCommand(['commit', '-m', commitMessage])
  }

  /**
   * 运行Git命令
   */
  async runGitCommand(args) {
    return new Promise((resolve, reject) => {
      const git = spawn('git', args, {
        cwd: this.rootDir,
        stdio: 'pipe'
      })

      let output = ''
      let errorOutput = ''

      git.stdout.on('data', (data) => {
        output += data.toString()
      })

      git.stderr.on('data', (data) => {
        errorOutput += data.toString()
      })

      git.on('close', (code) => {
        if (code === 0) {
          resolve(output)
        } else {
          reject(new Error(`Git命令失败 (${code}): ${errorOutput}`))
        }
      })
    })
  }

  /**
   * 生成提交摘要
   */
  generateCommitSummary() {
    const summary = {
      timestamp: new Date().toISOString(),
      commits: this.commitPlan.length,
      changes: {
        testFramework: '✅ 完整的测试框架系统',
        mockServices: '✅ 增强的Mock服务',
        apiUpdates: '✅ API端点优化',
        documentation: '✅ 文档和配置更新',
        cleanup: '✅ 项目结构清理'
      },
      features: [
        '系统化测试目录结构',
        '统一的测试工具库',
        '完整的Mock服务系统',
        '自动化测试脚本',
        '详细的测试文档',
        'API集成测试覆盖',
        '测试最佳实践指南'
      ],
      nextSteps: [
        '运行 npm run test:all 验证测试',
        '查看 tests/README.md 了解使用方法',
        '使用 npm run test:start 启动测试模式',
        '参考 tests/manual/ 进行手动测试'
      ]
    }

    const summaryPath = path.join(this.rootDir, 'tests/reports/commit-summary.json')
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2))

    console.log('\n📊 提交摘要:')
    console.log('=' .repeat(50))
    console.log(`📦 提交数量: ${summary.commits}`)
    console.log('🎯 主要变更:')
    Object.entries(summary.changes).forEach(([key, value]) => {
      console.log(`  ${value}`)
    })
    console.log('\n🚀 新功能:')
    summary.features.forEach(feature => {
      console.log(`  • ${feature}`)
    })
    console.log('\n📝 下一步:')
    summary.nextSteps.forEach(step => {
      console.log(`  • ${step}`)
    })
    console.log(`\n📄 详细摘要已保存到: ${summaryPath}`)
    console.log('=' .repeat(50))
  }
}

// 主函数
async function main() {
  const preparer = new CommitPreparer()
  
  try {
    await preparer.prepareCommit()
    preparer.generateCommitSummary()
    
    console.log('\n🎉 所有提交已完成!')
    console.log('💡 建议运行 npm run test:all 验证测试系统')
    
  } catch (error) {
    console.error('❌ 提交准备失败:', error)
    process.exit(1)
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main()
}

module.exports = CommitPreparer
