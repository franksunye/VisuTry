/**
 * VisuTry 版本管理配置
 * 用于自动化版本发布和管理
 */

module.exports = {
  // 版本控制策略
  versioning: {
    strategy: 'semantic', // semantic versioning
    format: 'MAJOR.MINOR.PATCH',
    prerelease: {
      enabled: true,
      identifiers: ['alpha', 'beta', 'rc']
    }
  },

  // 分支管理
  branches: {
    main: 'main',           // 生产分支
    develop: 'develop',     // 开发分支
    feature: 'feature/',    // 功能分支前缀
    hotfix: 'hotfix/',      // 热修复分支前缀
    release: 'release/'     // 发布分支前缀
  },

  // 发布配置
  release: {
    // 自动生成的文件
    files: [
      'package.json',
      'package-lock.json'
    ],
    
    // 发布前检查
    preChecks: [
      'test',           // 运行测试
      'lint',           // 代码检查
      'build',          // 构建检查
      'clean-working-tree' // 工作目录清洁
    ],

    // 发布后操作
    postActions: [
      'git-tag',        // 创建Git标签
      'git-push',       // 推送到远程
      'changelog',      // 更新变更日志
      'deploy'          // 部署到生产环境
    ]
  },

  // 变更日志配置
  changelog: {
    enabled: true,
    file: 'CHANGELOG.md',
    format: 'conventional', // conventional commits格式
    sections: [
      { type: 'feat', section: '✨ 新功能' },
      { type: 'fix', section: '🐛 Bug修复' },
      { type: 'docs', section: '📚 文档' },
      { type: 'style', section: '💄 样式' },
      { type: 'refactor', section: '♻️ 重构' },
      { type: 'perf', section: '⚡ 性能优化' },
      { type: 'test', section: '✅ 测试' },
      { type: 'chore', section: '🔧 构建/工具' }
    ]
  },

  // 部署配置
  deployment: {
    production: {
      platform: 'vercel',
      branch: 'main',
      autoDeployOnRelease: true
    },
    staging: {
      platform: 'vercel',
      branch: 'develop',
      autoDeployOnPush: true
    }
  },

  // 通知配置
  notifications: {
    enabled: false, // 暂时禁用
    channels: [
      // 'slack',
      // 'email',
      // 'webhook'
    ]
  }
}
