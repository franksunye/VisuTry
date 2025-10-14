# 🚀 VisuTry 发布指南

## 快速发布

### 自动化发布（推荐）

```bash
# 1. 确保在main分支且工作目录干净
git checkout main
git pull origin main

# 2. 运行自动发布脚本
npm run release

# 3. 选择版本类型或输入具体版本号
# - patch: 0.2.0 -> 0.2.1 (bug修复)
# - minor: 0.2.0 -> 0.3.0 (新功能)
# - major: 0.2.0 -> 1.0.0 (重大更新)
```

### 快速命令

```bash
# Bug修复版本
npm run release:patch

# 新功能版本
npm run release:minor

# 重大更新版本
npm run release:major
```

## 发布前检查

自动发布脚本会执行以下检查：

- ✅ 工作目录干净（无未提交更改）
- ✅ 在main分支
- ✅ 代码最新（已拉取远程更改）
- ✅ 所有测试通过
- ✅ 构建成功
- ✅ 代码检查通过

## 手动发布流程

如果需要手动控制发布过程：

```bash
# 1. 更新版本号
npm version patch --no-git-tag-version

# 2. 提交版本更新
git add package.json package-lock.json
git commit -m "chore: bump version to x.x.x"

# 3. 创建标签
git tag -a vx.x.x -m "Release version x.x.x"

# 4. 推送到远程
git push origin main
git push origin vx.x.x
```

## 提交消息规范

```bash
feat: 添加新功能
fix: 修复bug
docs: 更新文档
style: 代码格式化
refactor: 代码重构
perf: 性能优化
test: 测试相关
chore: 构建工具变动
```

## 版本规划

### 当前版本: v0.2.0
- ✅ 版本管理系统
- ✅ 自动化发布流程

### 下一版本: v0.3.0 (计划)
- 🎯 UI交互优化
- 🎯 提示词优化
- 🎯 性能改进

### 正式版本: v1.0.0 (目标)
- 🎯 Stripe生产环境
- 🎯 完整功能集
- 🎯 生产就绪

## 紧急修复

如果需要紧急修复生产问题：

```bash
# 1. 从main创建hotfix分支
git checkout main
git checkout -b hotfix/critical-fix

# 2. 修复问题并测试
# ... 修复代码 ...
npm test

# 3. 提交修复
git commit -m "fix: resolve critical issue"

# 4. 合并到main并发布
git checkout main
git merge hotfix/critical-fix
npm run release:patch

# 5. 清理分支
git branch -d hotfix/critical-fix
```

## 故障排除

### 发布失败常见原因

1. **工作目录不干净**
   ```bash
   git status
   git add .
   git commit -m "fix: commit pending changes"
   ```

2. **不在main分支**
   ```bash
   git checkout main
   ```

3. **测试失败**
   ```bash
   npm test
   # 修复失败的测试后重试
   ```

4. **构建失败**
   ```bash
   npm run build
   # 修复构建问题后重试
   ```

### 回滚发布

如果发布后发现问题：

```bash
# 1. 回滚到上一个版本
git reset --hard HEAD~1

# 2. 删除错误的标签
git tag -d vx.x.x
git push origin :refs/tags/vx.x.x

# 3. 强制推送（谨慎使用）
git push origin main --force
```

## 部署状态检查

发布后检查部署状态：

1. **Vercel部署**: 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. **生产环境**: 访问 https://your-app.vercel.app
3. **健康检查**: 访问 `/api/health` 端点

## 联系支持

如遇到发布问题：

1. 检查本指南
2. 查看 `docs/VERSION_MANAGEMENT.md`
3. 提交GitHub Issue
4. 联系项目维护者

---

*快速参考 - 最后更新: 2025-10-14*
