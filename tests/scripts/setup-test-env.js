#!/usr/bin/env node
// 测试环境设置脚本

const fs = require('fs')
const path = require('path')

class TestEnvironmentSetup {
  constructor() {
    this.rootDir = process.cwd()
    this.setupSteps = []
  }

  /**
   * 设置测试环境
   */
  async setup() {
    console.log('🔧 设置VisuTry测试环境...')
    console.log('=' .repeat(50))

    try {
      // 1. 检查环境
      await this.checkEnvironment()

      // 2. 创建测试配置
      await this.createTestConfig()

      // 3. 验证测试目录
      await this.verifyTestDirectories()

      // 4. 检查依赖
      await this.checkDependencies()

      // 5. 生成设置报告
      this.generateSetupReport()

      console.log('✅ 测试环境设置完成!')

    } catch (error) {
      console.error('❌ 测试环境设置失败:', error.message)
      process.exit(1)
    }
  }

  /**
   * 检查环境
   */
  async checkEnvironment() {
    console.log('🔍 检查环境...')

    // 检查Node.js版本
    const nodeVersion = process.version
    console.log(`📋 Node.js版本: ${nodeVersion}`)

    if (parseInt(nodeVersion.slice(1)) < 18) {
      throw new Error('需要Node.js 18或更高版本')
    }

    // 检查package.json
    const packageJsonPath = path.join(this.rootDir, 'package.json')
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error('未找到package.json文件')
    }

    console.log('✅ 环境检查通过')
    this.setupSteps.push('环境检查通过')
  }

  /**
   * 创建测试配置
   */
  async createTestConfig() {
    console.log('📝 创建测试配置...')

    // 检查是否存在.env.local
    const envLocalPath = path.join(this.rootDir, '.env.local')
    const testEnvPath = path.join(this.rootDir, 'tests/config/test.env')

    if (!fs.existsSync(envLocalPath)) {
      console.log('📋 创建.env.local文件...')
      
      // 从测试配置复制
      if (fs.existsSync(testEnvPath)) {
        fs.copyFileSync(testEnvPath, envLocalPath)
        console.log('✅ 从测试配置创建.env.local')
      } else {
        // 创建基本配置
        const basicConfig = `# VisuTry 测试环境配置
NODE_ENV=test
ENABLE_MOCKS=true
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=test-secret-key-for-testing-only
`
        fs.writeFileSync(envLocalPath, basicConfig)
        console.log('✅ 创建基本.env.local配置')
      }
    } else {
      console.log('✅ .env.local文件已存在')
    }

    this.setupSteps.push('测试配置创建完成')
  }

  /**
   * 验证测试目录
   */
  async verifyTestDirectories() {
    console.log('📁 验证测试目录结构...')

    const requiredDirs = [
      'tests',
      'tests/config',
      'tests/integration',
      'tests/integration/api',
      'tests/utils',
      'tests/scripts',
      'tests/reports',
      'tests/legacy',
      'tests/temp'
    ]

    for (const dir of requiredDirs) {
      const dirPath = path.join(this.rootDir, dir)
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true })
        console.log(`📁 创建目录: ${dir}`)
      } else {
        console.log(`✅ 目录存在: ${dir}`)
      }
    }

    // 验证关键文件
    const requiredFiles = [
      'tests/README.md',
      'tests/utils/test-helpers.js',
      'tests/scripts/run-all-tests.js'
    ]

    for (const file of requiredFiles) {
      const filePath = path.join(this.rootDir, file)
      if (fs.existsSync(filePath)) {
        console.log(`✅ 文件存在: ${file}`)
      } else {
        console.warn(`⚠️ 缺少文件: ${file}`)
      }
    }

    this.setupSteps.push('测试目录结构验证完成')
  }

  /**
   * 检查依赖
   */
  async checkDependencies() {
    console.log('📦 检查测试依赖...')

    const requiredPackages = [
      'axios',
      'form-data'
    ]

    const packageJsonPath = path.join(this.rootDir, 'package.json')
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
    
    const allDependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    }

    for (const pkg of requiredPackages) {
      if (allDependencies[pkg]) {
        console.log(`✅ 依赖存在: ${pkg}@${allDependencies[pkg]}`)
      } else {
        console.warn(`⚠️ 缺少依赖: ${pkg}`)
        console.log(`💡 建议运行: npm install ${pkg}`)
      }
    }

    // 检查测试脚本
    const scripts = packageJson.scripts || {}
    const testScripts = [
      'test',
      'test:all',
      'test:integration:new',
      'test:api'
    ]

    console.log('📋 检查测试脚本:')
    for (const script of testScripts) {
      if (scripts[script]) {
        console.log(`✅ 脚本存在: ${script}`)
      } else {
        console.warn(`⚠️ 缺少脚本: ${script}`)
      }
    }

    this.setupSteps.push('依赖检查完成')
  }

  /**
   * 生成设置报告
   */
  generateSetupReport() {
    console.log('📊 生成设置报告...')

    const report = {
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      platform: process.platform,
      setupSteps: this.setupSteps,
      testDirectories: this.getTestDirectories(),
      recommendations: [
        '运行 npm run test:start 启动测试服务器',
        '运行 npm run test:all 执行完整测试套件',
        '查看 tests/README.md 了解测试框架使用方法',
        '参考 tests/manual/ 目录进行手动测试'
      ],
      quickStart: [
        'npm run test:start    # 启动测试服务器',
        'npm run test:api      # 运行API测试',
        'npm run test:all      # 运行所有测试'
      ]
    }

    const reportPath = path.join(this.rootDir, 'tests/reports/setup-report.json')
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

    // 打印摘要
    console.log('\n📊 设置摘要:')
    console.log('=' .repeat(50))
    console.log(`🖥️ 平台: ${report.platform}`)
    console.log(`📋 Node.js: ${report.nodeVersion}`)
    console.log(`📁 测试目录: ${report.testDirectories.length} 个`)
    console.log(`✅ 设置步骤: ${report.setupSteps.length} 个完成`)

    console.log('\n💡 建议操作:')
    report.recommendations.forEach(rec => {
      console.log(`  • ${rec}`)
    })

    console.log('\n🚀 快速开始:')
    report.quickStart.forEach(cmd => {
      console.log(`  ${cmd}`)
    })

    console.log(`\n📄 详细报告已保存到: ${reportPath}`)
    console.log('=' .repeat(50))
  }

  /**
   * 获取测试目录列表
   */
  getTestDirectories() {
    const testDir = path.join(this.rootDir, 'tests')
    if (!fs.existsSync(testDir)) {
      return []
    }

    const directories = []
    
    function scanDir(dir, prefix = '') {
      const items = fs.readdirSync(dir)
      
      for (const item of items) {
        const itemPath = path.join(dir, item)
        const stat = fs.statSync(itemPath)
        
        if (stat.isDirectory()) {
          const relativePath = prefix ? `${prefix}/${item}` : item
          directories.push(relativePath)
          scanDir(itemPath, relativePath)
        }
      }
    }

    scanDir(testDir)
    return directories
  }
}

// 主函数
async function main() {
  const setup = new TestEnvironmentSetup()
  
  try {
    await setup.setup()
    
    console.log('\n🎉 测试环境设置成功!')
    console.log('💡 现在可以运行测试了!')
    
  } catch (error) {
    console.error('❌ 设置失败:', error)
    process.exit(1)
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main()
}

module.exports = TestEnvironmentSetup
