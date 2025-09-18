#!/usr/bin/env node
// VisuTry 统一测试运行脚本

const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')

// 测试配置
const TEST_CONFIG = {
  timeout: 300000, // 5分钟超时
  retries: 2,
  parallel: false, // 串行运行避免资源冲突
  coverage: true,
  verbose: true
}

// 测试套件定义
const TEST_SUITES = {
  unit: {
    name: '单元测试',
    pattern: 'tests/unit/**/*.test.js',
    timeout: 30000
  },
  integration: {
    name: '集成测试',
    pattern: 'tests/integration/**/*.test.js',
    timeout: 60000,
    setupTimeout: 30000
  },
  e2e: {
    name: '端到端测试',
    pattern: 'tests/integration/e2e/**/*.test.js',
    timeout: 120000,
    setupTimeout: 60000
  },
  api: {
    name: 'API测试',
    pattern: 'tests/integration/api/**/*.test.js',
    timeout: 60000
  },
  workflows: {
    name: '业务流程测试',
    pattern: 'tests/integration/workflows/**/*.test.js',
    timeout: 90000
  }
}

class TestRunner {
  constructor() {
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      suites: {}
    }
    this.startTime = Date.now()
  }

  /**
   * 运行所有测试
   */
  async runAll() {
    console.log('🧪 VisuTry 测试套件启动')
    console.log('=' .repeat(50))

    try {
      // 1. 环境检查
      await this.checkEnvironment()

      // 2. 启动测试服务器
      await this.startTestServer()

      // 3. 运行测试套件
      for (const [suiteKey, suite] of Object.entries(TEST_SUITES)) {
        if (this.shouldRunSuite(suiteKey)) {
          await this.runTestSuite(suiteKey, suite)
        }
      }

      // 4. 生成报告
      await this.generateReport()

      // 5. 清理
      await this.cleanup()

    } catch (error) {
      console.error('❌ 测试运行失败:', error.message)
      process.exit(1)
    }
  }

  /**
   * 检查测试环境
   */
  async checkEnvironment() {
    console.log('🔍 检查测试环境...')

    // 检查Node.js版本
    const nodeVersion = process.version
    console.log(`📋 Node.js版本: ${nodeVersion}`)

    // 检查必要的依赖
    const requiredPackages = ['axios', 'jest']
    for (const pkg of requiredPackages) {
      try {
        require.resolve(pkg)
        console.log(`✅ ${pkg} 已安装`)
      } catch (error) {
        throw new Error(`缺少必要依赖: ${pkg}`)
      }
    }

    // 检查测试配置文件
    const configFile = path.join(__dirname, '../config/test.env')
    if (fs.existsSync(configFile)) {
      console.log('✅ 测试配置文件存在')
      // 加载测试环境变量
      require('dotenv').config({ path: configFile })
    } else {
      console.warn('⚠️ 测试配置文件不存在，使用默认配置')
    }

    console.log('✅ 环境检查完成\n')
  }

  /**
   * 启动测试服务器
   */
  async startTestServer() {
    console.log('🚀 启动测试服务器...')

    // 检查服务器是否已经运行
    try {
      const axios = require('axios')
      await axios.get('http://localhost:3000/api/health', { timeout: 5000 })
      console.log('✅ 测试服务器已运行\n')
      return
    } catch (error) {
      // 服务器未运行，需要启动
    }

    // 启动服务器
    const serverProcess = spawn('npm', ['run', 'dev'], {
      stdio: 'pipe',
      env: { ...process.env, NODE_ENV: 'test', ENABLE_MOCKS: 'true' }
    })

    // 等待服务器启动
    await this.waitForServer()
    console.log('✅ 测试服务器启动成功\n')
  }

  /**
   * 等待服务器就绪
   */
  async waitForServer(maxAttempts = 30) {
    const axios = require('axios')
    
    for (let i = 0; i < maxAttempts; i++) {
      try {
        await axios.get('http://localhost:3000/api/health', { timeout: 5000 })
        return
      } catch (error) {
        if (i === maxAttempts - 1) {
          throw new Error('服务器启动超时')
        }
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }
  }

  /**
   * 运行测试套件
   */
  async runTestSuite(suiteKey, suite) {
    console.log(`🧪 运行${suite.name}...`)
    console.log(`📂 模式: ${suite.pattern}`)

    const startTime = Date.now()

    try {
      const result = await this.executeJest(suite)
      
      this.results.suites[suiteKey] = {
        name: suite.name,
        ...result,
        duration: Date.now() - startTime
      }

      this.results.total += result.total
      this.results.passed += result.passed
      this.results.failed += result.failed
      this.results.skipped += result.skipped

      if (result.failed === 0) {
        console.log(`✅ ${suite.name}通过 (${result.passed}/${result.total})`)
      } else {
        console.log(`❌ ${suite.name}失败 (${result.failed}个失败)`)
      }

    } catch (error) {
      console.error(`❌ ${suite.name}执行错误:`, error.message)
      this.results.suites[suiteKey] = {
        name: suite.name,
        error: error.message,
        duration: Date.now() - startTime
      }
    }

    console.log('')
  }

  /**
   * 执行Jest测试
   */
  async executeJest(suite) {
    return new Promise((resolve, reject) => {
      const jestArgs = [
        '--testPathPatterns', suite.pattern,
        '--testTimeout', suite.timeout.toString(),
        '--verbose',
        '--forceExit',
        '--detectOpenHandles'
      ]

      if (TEST_CONFIG.coverage) {
        jestArgs.push('--coverage')
      }

      const jestProcess = spawn('npx', ['jest', ...jestArgs], {
        stdio: 'pipe'
      })

      let output = ''
      let errorOutput = ''

      jestProcess.stdout.on('data', (data) => {
        output += data.toString()
      })

      jestProcess.stderr.on('data', (data) => {
        errorOutput += data.toString()
      })

      jestProcess.on('close', (code) => {
        const result = this.parseJestOutput(output)
        
        if (code === 0) {
          resolve(result)
        } else {
          reject(new Error(`Jest退出码: ${code}\n${errorOutput}`))
        }
      })
    })
  }

  /**
   * 解析Jest输出
   */
  parseJestOutput(output) {
    // 简单的输出解析，实际实现可能需要更复杂的逻辑
    const lines = output.split('\n')
    let total = 0, passed = 0, failed = 0, skipped = 0

    for (const line of lines) {
      if (line.includes('Tests:')) {
        const match = line.match(/(\d+) passed.*?(\d+) total/)
        if (match) {
          passed = parseInt(match[1])
          total = parseInt(match[2])
          failed = total - passed
        }
      }
    }

    return { total, passed, failed, skipped }
  }

  /**
   * 判断是否应该运行测试套件
   */
  shouldRunSuite(suiteKey) {
    const args = process.argv.slice(2)
    
    // 如果没有指定套件，运行所有套件
    if (args.length === 0) {
      return true
    }

    // 检查是否指定了特定套件
    return args.includes(suiteKey) || args.includes('all')
  }

  /**
   * 生成测试报告
   */
  async generateReport() {
    console.log('📊 生成测试报告...')

    const duration = Date.now() - this.startTime
    const report = {
      timestamp: new Date().toISOString(),
      duration,
      summary: this.results,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        testMode: process.env.NODE_ENV
      }
    }

    // 保存JSON报告
    const reportPath = path.join(__dirname, '../reports/test-results.json')
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

    // 打印摘要
    this.printSummary()

    console.log(`📄 详细报告已保存到: ${reportPath}`)
  }

  /**
   * 打印测试摘要
   */
  printSummary() {
    console.log('\n' + '='.repeat(50))
    console.log('📊 测试摘要')
    console.log('='.repeat(50))
    
    console.log(`总计: ${this.results.total} 个测试`)
    console.log(`✅ 通过: ${this.results.passed}`)
    console.log(`❌ 失败: ${this.results.failed}`)
    console.log(`⏭️ 跳过: ${this.results.skipped}`)
    
    const successRate = this.results.total > 0 ? 
      ((this.results.passed / this.results.total) * 100).toFixed(1) : 0
    console.log(`📈 成功率: ${successRate}%`)
    
    const duration = Date.now() - this.startTime
    console.log(`⏱️ 总耗时: ${(duration / 1000).toFixed(1)}秒`)

    // 套件详情
    console.log('\n📋 套件详情:')
    for (const [key, suite] of Object.entries(this.results.suites)) {
      const status = suite.error ? '❌' : (suite.failed === 0 ? '✅' : '⚠️')
      const duration = suite.duration ? `(${(suite.duration / 1000).toFixed(1)}s)` : ''
      console.log(`  ${status} ${suite.name} ${duration}`)
    }

    console.log('='.repeat(50))
  }

  /**
   * 清理资源
   */
  async cleanup() {
    console.log('🧹 清理测试环境...')
    
    // 这里可以添加清理逻辑
    // 例如：停止测试服务器、清理临时文件等
    
    console.log('✅ 清理完成')
  }
}

// 主函数
async function main() {
  const runner = new TestRunner()
  
  try {
    await runner.runAll()
    
    // 根据测试结果设置退出码
    const exitCode = runner.results.failed > 0 ? 1 : 0
    process.exit(exitCode)
    
  } catch (error) {
    console.error('❌ 测试运行器错误:', error)
    process.exit(1)
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main()
}

module.exports = TestRunner
