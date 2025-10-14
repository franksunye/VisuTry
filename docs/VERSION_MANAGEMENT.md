# VisuTry 版本管理指南

## 📋 概述

本文档描述了 VisuTry 项目的版本管理策略、发布流程和团队协作规范。我们采用语义化版本控制和自动化发布流程，确保项目的稳定性和可维护性。

## 🎯 版本控制策略

### 语义化版本 (Semantic Versioning)

我们遵循 [语义化版本 2.0.0](https://semver.org/lang/zh-CN/) 规范：

```
MAJOR.MINOR.PATCH
```

- **MAJOR (主版本号)**: 重大功能变更或不兼容的API变更
- **MINOR (次版本号)**: 新功能添加，向后兼容
- **PATCH (修订号)**: Bug修复，向后兼容

### 版本示例

- `1.0.0` - 正式发布版本
- `1.1.0` - 添加新功能
- `1.1.1` - 修复bug
- `2.0.0` - 重大更新，可能不向后兼容

### 预发布版本

- `1.0.0-alpha.1` - Alpha版本（内部测试）
- `1.0.0-beta.1` - Beta版本（公开测试）
- `1.0.0-rc.1` - Release Candidate（发布候选）

## 🌿 分支管理策略

### 主要分支

- **`main`** - 生产就绪代码，始终保持稳定
- **`develop`** - 开发集成分支，包含最新开发功能
- **`feature/*`** - 功能开发分支
- **`hotfix/*`** - 紧急修复分支
- **`release/*`** - 发布准备分支

### 分支命名规范

```bash
feature/user-authentication    # 功能分支
hotfix/login-bug-fix          # 热修复分支
release/v1.2.0                # 发布分支
```

## 🚀 发布流程

### 1. 功能开发流程

```bash
# 1. 从develop创建功能分支
git checkout develop
git pull origin develop
git checkout -b feature/new-feature

# 2. 开发功能
# ... 编码和测试 ...

# 3. 提交代码
git add .
git commit -m "feat: add new feature"

# 4. 推送并创建PR
git push origin feature/new-feature
# 在GitHub创建Pull Request到develop分支
```

### 2. 发布准备流程

```bash
# 1. 从develop创建发布分支
git checkout develop
git pull origin develop
git checkout -b release/v1.2.0

# 2. 更新版本号和文档
npm run version:bump minor
# 更新CHANGELOG.md

# 3. 测试和修复
npm test
npm run build

# 4. 合并到main并打标签
git checkout main
git merge release/v1.2.0
git tag -a v1.2.0 -m "Release version 1.2.0"
git push origin main
git push origin v1.2.0
```

### 3. 自动化发布

使用我们的发布脚本：

```bash
# 自动发布（推荐）
npm run release

# 指定版本类型
npm run release:patch   # 0.1.0 -> 0.1.1
npm run release:minor   # 0.1.0 -> 0.2.0
npm run release:major   # 0.1.0 -> 1.0.0

# 手动指定版本
npm run release 1.2.3
```

## 📝 提交消息规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/v1.0.0/) 规范：

### 格式

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### 类型 (Type)

- **feat**: 新功能
- **fix**: Bug修复
- **docs**: 文档更新
- **style**: 代码格式化（不影响功能）
- **refactor**: 代码重构
- **perf**: 性能优化
- **test**: 测试相关
- **chore**: 构建工具或辅助工具的变动

### 示例

```bash
feat: add user authentication
fix(auth): resolve login timeout issue
docs: update API documentation
style: format code with prettier
refactor: simplify user service logic
perf: optimize image loading
test: add unit tests for auth service
chore: update dependencies
```

## 🔧 工具和脚本

### 发布脚本

- `scripts/release.js` - 自动化发布脚本
- `scripts/setup-git-hooks.js` - Git钩子设置

### 配置文件

- `version.config.js` - 版本管理配置
- `CHANGELOG.md` - 变更日志

### Git钩子

- **commit-msg**: 检查提交消息格式
- **pre-push**: 推送前运行测试和代码检查

## 📊 版本历史

### v0.2.0 (当前版本)
- ✨ 完整的版本管理系统
- 🔧 自动化发布流程
- 📚 版本管理文档

### v0.1.0 (MVP版本)
- ✨ 核心功能完成
- 🏗️ 基础架构建立
- ✅ 测试框架搭建

## 🎯 未来规划

### v0.3.0 (计划中)
- UI交互优化
- 提示词优化
- 性能改进

### v1.0.0 (正式版本)
- Stripe生产环境
- 完整功能集
- 生产就绪

## 📋 最佳实践

### 开发者指南

1. **始终从最新的develop分支创建功能分支**
2. **保持提交消息清晰和规范**
3. **在推送前运行测试**
4. **及时更新文档**
5. **使用Pull Request进行代码审查**

### 发布检查清单

- [ ] 所有测试通过
- [ ] 代码检查通过
- [ ] 文档已更新
- [ ] CHANGELOG.md已更新
- [ ] 版本号已更新
- [ ] 标签已创建
- [ ] 部署成功

## 🆘 故障排除

### 常见问题

1. **发布脚本失败**
   - 检查工作目录是否干净
   - 确保在main分支
   - 验证测试是否通过

2. **版本冲突**
   - 拉取最新代码
   - 解决合并冲突
   - 重新运行发布流程

3. **标签推送失败**
   - 检查网络连接
   - 验证权限设置
   - 手动推送标签

## 📞 支持

如有版本管理相关问题，请：

1. 查看本文档
2. 检查GitHub Issues
3. 联系项目维护者

---

*最后更新: 2025-10-14*
*版本: v0.2.0*
