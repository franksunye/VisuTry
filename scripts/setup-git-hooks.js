#!/usr/bin/env node
/**
 * Git钩子设置脚本
 * 自动设置提交消息格式检查和发布前检查
 */

const fs = require('fs')
const path = require('path')

const gitHooksDir = path.join(process.cwd(), '.git', 'hooks')

// 提交消息格式检查钩子
const commitMsgHook = `#!/bin/sh
# 检查提交消息格式 (Conventional Commits)

commit_regex='^(feat|fix|docs|style|refactor|perf|test|chore)(\\(.+\\))?: .{1,50}'

if ! grep -qE "$commit_regex" "$1"; then
    echo "❌ 提交消息格式不正确!"
    echo ""
    echo "请使用以下格式:"
    echo "  feat: 添加新功能"
    echo "  fix: 修复bug"
    echo "  docs: 更新文档"
    echo "  style: 代码格式化"
    echo "  refactor: 代码重构"
    echo "  perf: 性能优化"
    echo "  test: 测试相关"
    echo "  chore: 构建工具或辅助工具的变动"
    echo ""
    echo "示例: feat: 添加用户认证功能"
    echo "示例: fix(auth): 修复登录失败问题"
    exit 1
fi
`

// 推送前检查钩子
const prePushHook = `#!/bin/sh
# 推送前检查

echo "🔍 执行推送前检查..."

# 检查是否有未提交的更改
if ! git diff-index --quiet HEAD --; then
    echo "❌ 有未提交的更改，请先提交"
    exit 1
fi

# 运行测试
echo "🧪 运行测试..."
npm test
if [ $? -ne 0 ]; then
    echo "❌ 测试失败，推送被阻止"
    exit 1
fi

# 运行代码检查
echo "🔍 运行代码检查..."
npm run lint
if [ $? -ne 0 ]; then
    echo "❌ 代码检查失败，推送被阻止"
    exit 1
fi

echo "✅ 所有检查通过，允许推送"
`

function setupGitHooks() {
    console.log('🔧 设置Git钩子...')
    
    if (!fs.existsSync(gitHooksDir)) {
        console.log('❌ .git/hooks 目录不存在')
        process.exit(1)
    }
    
    // 设置commit-msg钩子
    const commitMsgPath = path.join(gitHooksDir, 'commit-msg')
    fs.writeFileSync(commitMsgPath, commitMsgHook)
    fs.chmodSync(commitMsgPath, '755')
    console.log('✅ commit-msg 钩子已设置')
    
    // 设置pre-push钩子
    const prePushPath = path.join(gitHooksDir, 'pre-push')
    fs.writeFileSync(prePushPath, prePushHook)
    fs.chmodSync(prePushPath, '755')
    console.log('✅ pre-push 钩子已设置')
    
    console.log('🎉 Git钩子设置完成!')
    console.log('')
    console.log('现在您的提交消息将自动检查格式，推送前将自动运行测试。')
}

if (require.main === module) {
    setupGitHooks()
}

module.exports = { setupGitHooks }
