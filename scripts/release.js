#!/usr/bin/env node
/**
 * VisuTry 发布脚本
 * 自动化版本发布流程
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const readline = require('readline')

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function exec(command, options = {}) {
  try {
    return execSync(command, { 
      encoding: 'utf8', 
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options 
    }).trim()
  } catch (error) {
    log(`❌ 命令执行失败: ${command}`, 'red')
    log(error.message, 'red')
    process.exit(1)
  }
}

function askQuestion(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer)
    })
  })
}

async function getCurrentVersion() {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
  return packageJson.version
}

async function updateVersion(newVersion) {
  const packageJsonPath = path.join(process.cwd(), 'package.json')
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
  
  packageJson.version = newVersion
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n')
  log(`✅ 版本已更新到 ${newVersion}`, 'green')
}

function validateVersion(version) {
  const semverRegex = /^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*))?$/
  return semverRegex.test(version)
}

function getNextVersion(currentVersion, type) {
  const [major, minor, patch] = currentVersion.split('.').map(Number)
  
  switch (type) {
    case 'major':
      return `${major + 1}.0.0`
    case 'minor':
      return `${major}.${minor + 1}.0`
    case 'patch':
      return `${major}.${minor}.${patch + 1}`
    default:
      throw new Error(`未知的版本类型: ${type}`)
  }
}

async function preReleaseChecks() {
  log('🔍 执行发布前检查...', 'blue')
  
  // 检查工作目录是否干净
  try {
    const status = exec('git status --porcelain', { silent: true })
    if (status) {
      log('❌ 工作目录不干净，请先提交或暂存更改', 'red')
      process.exit(1)
    }
  } catch (error) {
    log('❌ Git状态检查失败', 'red')
    process.exit(1)
  }

  // 检查是否在main分支
  try {
    const branch = exec('git branch --show-current', { silent: true })
    if (branch !== 'main') {
      log(`❌ 当前在 ${branch} 分支，请切换到 main 分支`, 'red')
      process.exit(1)
    }
  } catch (error) {
    log('❌ 分支检查失败', 'red')
    process.exit(1)
  }

  // 拉取最新代码
  log('📥 拉取最新代码...', 'cyan')
  exec('git pull origin main')

  // 运行测试
  log('🧪 运行测试...', 'cyan')
  exec('npm test')

  // 运行构建
  log('🏗️ 运行构建检查...', 'cyan')
  exec('npm run build')

  log('✅ 所有检查通过', 'green')
}

async function createRelease(version) {
  log(`🚀 创建版本 ${version}...`, 'blue')
  
  // 更新版本号
  await updateVersion(version)
  
  // 提交版本更新
  exec(`git add package.json package-lock.json`)
  exec(`git commit -m "chore: bump version to ${version}"`)
  
  // 创建标签
  exec(`git tag -a v${version} -m "Release version ${version}"`)
  
  // 推送到远程
  exec('git push origin main')
  exec(`git push origin v${version}`)
  
  log(`✅ 版本 ${version} 发布成功!`, 'green')
  log(`🔗 标签: v${version}`, 'cyan')
}

async function main() {
  try {
    log('🎯 VisuTry 版本发布工具', 'magenta')
    log('================================', 'magenta')
    
    const currentVersion = await getCurrentVersion()
    log(`📦 当前版本: ${currentVersion}`, 'blue')
    
    // 询问发布类型
    const releaseType = await askQuestion(
      '请选择发布类型 (major/minor/patch) 或输入具体版本号: '
    )
    
    let newVersion
    if (['major', 'minor', 'patch'].includes(releaseType)) {
      newVersion = getNextVersion(currentVersion, releaseType)
    } else {
      newVersion = releaseType
      if (!validateVersion(newVersion)) {
        log('❌ 无效的版本号格式', 'red')
        process.exit(1)
      }
    }
    
    log(`🎯 新版本: ${newVersion}`, 'green')
    
    const confirm = await askQuestion(`确认发布版本 ${newVersion}? (y/N): `)
    if (confirm.toLowerCase() !== 'y') {
      log('❌ 发布已取消', 'yellow')
      process.exit(0)
    }
    
    // 执行发布流程
    await preReleaseChecks()
    await createRelease(newVersion)
    
    log('🎉 发布完成!', 'green')
    log(`📝 请查看 Vercel 部署状态`, 'cyan')
    
  } catch (error) {
    log(`❌ 发布失败: ${error.message}`, 'red')
    process.exit(1)
  }
}

// 运行脚本
if (require.main === module) {
  main()
}

module.exports = { main, updateVersion, validateVersion, getNextVersion }
