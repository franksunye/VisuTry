# VisuTry 项目文档

## 📚 文档概览

本目录包含 VisuTry 项目的核心技术文档。

## � 可用文档

### 🏗️ 项目架构
- **[architecture.md](./architecture.md)**
  - 项目整体架构设计
  - 技术栈和组件关系
  - 已实现功能清单
  - 系统设计原理

### 👨‍💻 开发指南
- **[development-guide.md](./development-guide.md)**
  - 开发环境设置
  - 环境变量配置
  - 开发流程和最佳实践
  - 代码规范和约定

### 🧪 测试指南
- **[testing-guide.md](./testing-guide.md)**
  - Mock 模式使用说明
  - 测试环境设置
  - 集成测试指南
  - 无需外部服务的测试方法

### 📋 项目管理
- **[backlog.md](./backlog.md)**
  - 产品功能规划
  - 开发进度跟踪
  - 优先级管理
  - Sprint 计划

## 🚀 快速开始

### 开发环境
```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入必要的配置

# 启动开发服务器
npm run dev
```

### 测试模式
```bash
# Windows
npm run test:start:windows

# Linux/Mac
npm run test:start
```

## 📖 文档使用建议

### 新开发者入门
1. 先阅读 `architecture.md` 了解项目架构
2. 按照 `development-guide.md` 设置开发环境
3. 使用 `testing-guide.md` 进行功能测试

### 测试和质量保证
1. 参考 `testing-guide.md` 设置测试环境
2. 使用 Mock 模式进行无依赖测试
3. 运行集成测试验证功能

## 📞 获取帮助

如果你在开发过程中遇到问题：
1. 查看相关文档
2. 检查 GitHub Issues
3. 联系项目维护者

## 🔗 相关链接

- [GitHub Repository](https://github.com/franksunye/VisuTry)
- [Vercel Deployment](https://visutry.vercel.app)
- [Project Board](https://github.com/franksunye/VisuTry/projects)
