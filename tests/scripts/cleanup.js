#!/usr/bin/env node
// 测试文件清理脚本

const fs = require('fs')
const path = require('path')

// 需要清理的文件列表
const LEGACY_TEST_FILES = [
  'test-auth.js',
  'test-authenticated-apis.js', 
  'test-basic.js',
  'test-dashboard.js',
  'test-manual.html',
  'test-payment.js',
  'test-try-on.js',
  'test-results.json',
  'start-and-test.js'
]

// 需要保留的文件（移动到新位置）
const FILES_TO_MIGRATE = {
  'test-authenticated-apis.js': {
    target: 'tests/legacy/authenticated-apis-legacy.js',
    description: '完整的认证API测试（已被新的集成测试替代）'
  },
  'test-basic.js': {
    target: 'tests/legacy/basic-test-legacy.js', 
    description: '基础应用启动测试（已被新的测试套件替代）'
  },
  'scripts/test-integration.js': {
    target: 'tests/legacy/integration-legacy.js',
    description: '旧版集成测试脚本（已被新的测试框架替代）'
  },
  'TEST_REPORT.md': {
    target: 'tests/reports/legacy-test-report.md',
    description: '历史测试报告'
  }
}

class TestCleaner {
  constructor() {
    this.rootDir = path.resolve(__dirname, '../..')
    this.cleaned = []
    this.migrated = []
    this.errors = []
  }

  /**
   * 执行清理
   */
  async cleanup() {
    console.log('🧹 开始清理测试文件...')
    console.log('=' .repeat(50))

    try {
      // 1. 创建必要的目录
      await this.createDirectories()

      // 2. 迁移重要文件
      await this.migrateFiles()

      // 3. 清理临时文件
      await this.cleanupLegacyFiles()

      // 4. 生成清理报告
      this.generateReport()

      console.log('✅ 清理完成!')

    } catch (error) {
      console.error('❌ 清理过程中出现错误:', error.message)
      process.exit(1)
    }
  }

  /**
   * 创建必要的目录
   */
  async createDirectories() {
    console.log('📁 创建目录结构...')

    const directories = [
      'tests/legacy',
      'tests/reports/legacy',
      'tests/temp'
    ]

    for (const dir of directories) {
      const fullPath = path.join(this.rootDir, dir)
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true })
        console.log(`  ✅ 创建目录: ${dir}`)
      }
    }
  }

  /**
   * 迁移重要文件
   */
  async migrateFiles() {
    console.log('📦 迁移重要文件...')

    for (const [source, config] of Object.entries(FILES_TO_MIGRATE)) {
      const sourcePath = path.join(this.rootDir, source)
      const targetPath = path.join(this.rootDir, config.target)

      try {
        if (fs.existsSync(sourcePath)) {
          // 确保目标目录存在
          const targetDir = path.dirname(targetPath)
          if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true })
          }

          // 复制文件
          fs.copyFileSync(sourcePath, targetPath)
          
          // 添加说明注释
          this.addMigrationComment(targetPath, config.description)
          
          console.log(`  ✅ 迁移: ${source} -> ${config.target}`)
          this.migrated.push({ source, target: config.target, description: config.description })
        } else {
          console.log(`  ⚠️ 源文件不存在: ${source}`)
        }
      } catch (error) {
        console.error(`  ❌ 迁移失败: ${source} - ${error.message}`)
        this.errors.push({ file: source, error: error.message })
      }
    }
  }

  /**
   * 添加迁移说明注释
   */
  addMigrationComment(filePath, description) {
    try {
      const content = fs.readFileSync(filePath, 'utf8')
      const comment = `// ⚠️ 此文件已被迁移到legacy目录\n// 说明: ${description}\n// 迁移时间: ${new Date().toISOString()}\n// 新的测试请使用 tests/ 目录下的现代化测试框架\n\n`
      
      fs.writeFileSync(filePath, comment + content)
    } catch (error) {
      console.warn(`无法添加迁移注释到 ${filePath}: ${error.message}`)
    }
  }

  /**
   * 清理旧版测试文件
   */
  async cleanupLegacyFiles() {
    console.log('🗑️ 清理旧版测试文件...')

    for (const filename of LEGACY_TEST_FILES) {
      const filePath = path.join(this.rootDir, filename)

      try {
        if (fs.existsSync(filePath)) {
          // 检查是否已经迁移
          const isMigrated = Object.keys(FILES_TO_MIGRATE).includes(filename)
          
          if (isMigrated) {
            // 已迁移的文件，可以安全删除
            fs.unlinkSync(filePath)
            console.log(`  ✅ 删除已迁移文件: ${filename}`)
            this.cleaned.push(filename)
          } else {
            // 未迁移的文件，移动到临时目录
            const tempPath = path.join(this.rootDir, 'tests/temp', filename)
            fs.renameSync(filePath, tempPath)
            console.log(`  📦 移动到临时目录: ${filename}`)
            this.cleaned.push(filename)
          }
        }
      } catch (error) {
        console.error(`  ❌ 清理失败: ${filename} - ${error.message}`)
        this.errors.push({ file: filename, error: error.message })
      }
    }
  }

  /**
   * 生成清理报告
   */
  generateReport() {
    console.log('\n📊 清理报告')
    console.log('=' .repeat(50))

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        migrated: this.migrated.length,
        cleaned: this.cleaned.length,
        errors: this.errors.length
      },
      migrated: this.migrated,
      cleaned: this.cleaned,
      errors: this.errors,
      recommendations: [
        '使用 npm run test 运行新的测试套件',
        '查看 tests/README.md 了解新的测试结构',
        '旧版测试文件已保存在 tests/legacy/ 目录中',
        '临时文件保存在 tests/temp/ 目录中，可以安全删除'
      ]
    }

    // 保存报告
    const reportPath = path.join(this.rootDir, 'tests/reports/cleanup-report.json')
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

    // 打印摘要
    console.log(`📦 迁移文件: ${this.migrated.length}`)
    console.log(`🗑️ 清理文件: ${this.cleaned.length}`)
    console.log(`❌ 错误: ${this.errors.length}`)

    if (this.migrated.length > 0) {
      console.log('\n📦 迁移的文件:')
      this.migrated.forEach(item => {
        console.log(`  • ${item.source} -> ${item.target}`)
      })
    }

    if (this.cleaned.length > 0) {
      console.log('\n🗑️ 清理的文件:')
      this.cleaned.forEach(file => {
        console.log(`  • ${file}`)
      })
    }

    if (this.errors.length > 0) {
      console.log('\n❌ 错误:')
      this.errors.forEach(error => {
        console.log(`  • ${error.file}: ${error.error}`)
      })
    }

    console.log('\n💡 建议:')
    report.recommendations.forEach(rec => {
      console.log(`  • ${rec}`)
    })

    console.log(`\n📄 详细报告已保存到: ${reportPath}`)
    console.log('=' .repeat(50))
  }

  /**
   * 创建.gitignore更新
   */
  updateGitignore() {
    const gitignorePath = path.join(this.rootDir, '.gitignore')
    const testIgnoreRules = [
      '',
      '# 测试相关',
      'tests/temp/',
      'tests/reports/coverage/',
      'tests/reports/*.json',
      'test-results.json',
      'coverage/',
      '*.test.log'
    ]

    try {
      let gitignoreContent = ''
      if (fs.existsSync(gitignorePath)) {
        gitignoreContent = fs.readFileSync(gitignorePath, 'utf8')
      }

      // 检查是否已经包含测试规则
      if (!gitignoreContent.includes('# 测试相关')) {
        gitignoreContent += testIgnoreRules.join('\n')
        fs.writeFileSync(gitignorePath, gitignoreContent)
        console.log('✅ 更新 .gitignore 文件')
      }
    } catch (error) {
      console.warn('⚠️ 无法更新 .gitignore:', error.message)
    }
  }
}

// 主函数
async function main() {
  const cleaner = new TestCleaner()
  
  // 检查是否在正确的目录
  const packageJsonPath = path.join(process.cwd(), 'package.json')
  if (!fs.existsSync(packageJsonPath)) {
    console.error('❌ 请在项目根目录运行此脚本')
    process.exit(1)
  }

  try {
    await cleaner.cleanup()
    cleaner.updateGitignore()
  } catch (error) {
    console.error('❌ 清理失败:', error)
    process.exit(1)
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main()
}

module.exports = TestCleaner
