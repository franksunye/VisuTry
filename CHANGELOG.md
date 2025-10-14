# VisuTry 变更日志

本文档记录了 VisuTry 项目的所有重要变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
并且本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [未发布]

### 计划中
- UI交互优化：AI Try On点击后在当前页面等待并查看试戴效果
- 提示词优化：改进nano banana的try on提示词
- Stripe切换为正式环境

## [0.2.0] - 2025-10-14

### ✨ 新功能
- 完整的版本管理系统
- 自动化发布流程
- 语义化版本控制
- Git钩子和提交消息验证

### 🔧 构建/工具
- 添加版本管理配置文件 (`version.config.js`)
- 创建自动化发布脚本 (`scripts/release.js`)
- 更新package.json发布命令
- Git钩子设置脚本 (`scripts/setup-git-hooks.js`)

### 📚 文档
- 版本管理指南 (`docs/VERSION_MANAGEMENT.md`)
- 发布流程快速参考 (`docs/RELEASE_GUIDE.md`)
- 变更日志模板 (`CHANGELOG.md`)

## [0.1.0] - 2025-09-15

### ✨ 新功能
- 用户认证系统 (Twitter OAuth + NextAuth.js)
- 图片上传功能 (Vercel Blob Storage)
- AI虚拟试戴功能 (Google Gemini API)
- 支付系统 (Stripe集成)
- 用户仪表板和历史记录管理
- 社交媒体分享功能
- 响应式设计支持

### 🏗️ 技术架构
- Next.js 14 (App Router)
- TypeScript + Tailwind CSS
- Prisma + PostgreSQL (Neon)
- Vercel 部署平台

### ✅ 测试
- Jest单元测试框架
- Playwright E2E测试
- 完整的测试覆盖率配置

### 📚 文档
- 项目架构文档
- 开发指南
- 测试指南
- API文档

---

## 版本说明

### 版本格式
我们使用 [语义化版本](https://semver.org/lang/zh-CN/) 格式：`MAJOR.MINOR.PATCH`

- **MAJOR**: 重大功能变更或不兼容的API变更
- **MINOR**: 新功能添加，向后兼容
- **PATCH**: Bug修复，向后兼容

### 发布类型
- **正式版本**: 如 1.0.0, 1.1.0, 1.1.1
- **预发布版本**: 如 1.0.0-alpha.1, 1.0.0-beta.1, 1.0.0-rc.1

### 变更类型
- ✨ **新功能** (feat): 新增功能
- 🐛 **Bug修复** (fix): 修复问题
- 📚 **文档** (docs): 文档更新
- 💄 **样式** (style): 代码格式化
- ♻️ **重构** (refactor): 代码重构
- ⚡ **性能优化** (perf): 性能改进
- ✅ **测试** (test): 测试相关
- 🔧 **构建/工具** (chore): 构建工具或辅助工具的变动
