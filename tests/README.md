# VisuTry 测试管理体系

## 📁 目录结构

```
tests/
├── README.md                    # 测试文档总览
├── config/                      # 测试配置
│   ├── jest.config.js          # Jest配置
│   ├── test.env                # 测试环境变量
│   └── setup.js                # 测试环境设置
├── integration/                 # 集成测试
│   ├── api/                    # API集成测试
│   │   ├── auth.test.js        # 认证API测试
│   │   ├── upload.test.js      # 文件上传测试
│   │   ├── try-on.test.js      # 试戴API测试
│   │   ├── payment.test.js     # 支付API测试
│   │   └── frames.test.js      # 眼镜框架API测试
│   ├── workflows/              # 业务流程测试
│   │   ├── user-registration.test.js
│   │   ├── try-on-flow.test.js
│   │   └── payment-flow.test.js
│   └── e2e/                    # 端到端测试
│       ├── user-journey.test.js
│       └── admin-workflow.test.js
├── unit/                       # 单元测试
│   ├── components/             # 组件单元测试
│   ├── lib/                    # 工具库测试
│   └── utils/                  # 工具函数测试
├── manual/                     # 手动测试
│   ├── test-plans/            # 测试计划
│   ├── checklists/            # 测试检查清单
│   └── reports/               # 测试报告
├── scripts/                    # 测试脚本
│   ├── setup-test-env.js      # 测试环境设置
│   ├── run-all-tests.js       # 运行所有测试
│   ├── cleanup.js             # 测试清理
│   └── start-test-mode.sh     # 启动测试模式
├── fixtures/                   # 测试数据
│   ├── mock-data/             # Mock数据
│   ├── test-images/           # 测试图片
│   └── sample-responses/      # 示例响应
├── utils/                      # 测试工具
│   ├── test-helpers.js        # 测试辅助函数
│   ├── mock-services.js       # Mock服务
│   └── assertions.js          # 自定义断言
└── reports/                    # 测试报告
    ├── coverage/              # 覆盖率报告
    ├── integration/           # 集成测试报告
    └── performance/           # 性能测试报告
```

## 🎯 测试分类

### 1. 集成测试 (Integration Tests)
- **API测试**: 测试所有API端点的功能和安全性
- **业务流程测试**: 测试完整的业务流程
- **端到端测试**: 测试用户完整的使用流程

### 2. 单元测试 (Unit Tests)
- **组件测试**: React组件的单元测试
- **工具库测试**: 工具函数和库的测试
- **Mock服务测试**: Mock服务的功能测试

### 3. 手动测试 (Manual Tests)
- **用户界面测试**: 手动验证UI/UX
- **兼容性测试**: 浏览器和设备兼容性
- **可用性测试**: 用户体验测试

## 🚀 快速开始

### 首次设置
```bash
# 1. 安装依赖
npm install

# 2. 设置测试环境
npm run test:setup

# 3. 启动测试服务器
npm run test:start
```

### 运行测试

#### 运行所有测试
```bash
npm run test:all           # 运行完整测试套件
npm run test              # 运行默认测试
```

#### 运行特定类型的测试
```bash
npm run test:unit          # 单元测试
npm run test:integration:new # 新版集成测试
npm run test:api           # API测试
npm run test:e2e           # 端到端测试
npm run test:workflows     # 业务流程测试
```

#### 开发模式测试
```bash
npm run test:watch         # 监视模式
npm run test:coverage      # 生成覆盖率报告
```

### 测试环境管理
```bash
npm run test:start         # 启动测试服务器
npm run test:setup         # 设置测试环境
npm run test:cleanup       # 清理测试数据
```

## 📋 测试检查清单

- [ ] 所有API端点测试通过
- [ ] 认证和授权功能正常
- [ ] 文件上传和处理功能正常
- [ ] AI试戴功能正常
- [ ] 支付流程功能正常
- [ ] 用户界面响应正常
- [ ] 数据库操作正常
- [ ] Mock服务功能正常

## 📊 测试覆盖率目标

- **API覆盖率**: 100%
- **业务流程覆盖率**: 95%
- **组件覆盖率**: 90%
- **工具函数覆盖率**: 95%

## 🔧 测试环境

### 开发环境
- Node.js 18+
- Next.js 14
- Jest + Testing Library
- Mock服务启用

### CI/CD环境
- GitHub Actions
- 自动化测试运行
- 覆盖率报告生成
- 测试结果通知

## 📝 测试最佳实践

1. **测试命名**: 使用描述性的测试名称
2. **测试隔离**: 每个测试应该独立运行
3. **Mock使用**: 合理使用Mock服务避免外部依赖
4. **数据清理**: 测试后清理测试数据
5. **错误处理**: 测试错误情况和边界条件
6. **文档更新**: 保持测试文档与代码同步

## 🐛 问题排查

### 常见问题
1. **测试超时**: 检查网络连接和服务状态
2. **Mock服务失败**: 确认Mock模式已启用
3. **认证失败**: 检查测试用户凭据
4. **数据库连接**: 确认测试数据库配置

### 调试技巧
- 使用 `console.log` 输出调试信息
- 检查测试环境变量设置
- 查看详细的错误日志
- 使用浏览器开发者工具

## 📞 支持

如有测试相关问题，请：
1. 查看测试文档
2. 检查已知问题列表
3. 联系开发团队
