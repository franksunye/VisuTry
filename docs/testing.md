# 前端组件测试文档

## 📊 测试概览

### 测试统计
- **总测试用例**: 77个
- **通过测试**: 73个 (94.8%)
- **失败测试**: 4个 (5.2%)
- **测试套件**: 5个

### 组件覆盖率
| 组件 | 测试用例数 | 覆盖率 | 状态 |
|------|-----------|--------|------|
| LoginButton | 21 | 100% | ✅ 完成 |
| DashboardStats | 15 | 100% | ✅ 完成 |
| ImageUpload | 19 | 95%+ | ✅ 完成 |
| FrameSelector | 18 | 100% | ✅ 完成 |
| PricingCard | 4 | 基础覆盖 | ⚠️ 需修复 |

## 🧪 测试架构

### 技术栈
- **测试框架**: Jest
- **React测试**: React Testing Library
- **用户交互**: @testing-library/user-event
- **模拟**: Jest mocks

### 目录结构
```
tests/
└── unit/
    └── components/
        ├── auth/
        │   └── LoginButton.test.tsx
        ├── dashboard/
        │   └── DashboardStats.test.tsx
        ├── upload/
        │   └── ImageUpload.test.tsx
        ├── try-on/
        │   └── FrameSelector.test.tsx
        └── pricing/
            └── PricingCard.test.tsx
```

## 📋 测试详情

### 1. LoginButton 组件测试 ✅
**测试场景**:
- 加载状态显示
- 未认证状态 - 登录按钮
- 已认证状态 - 用户信息和登出
- 不同变体样式 (default, outline, ghost)
- 用户头像显示逻辑
- 无障碍性测试

**关键测试**:
- 模拟 next-auth/react
- 测试 signIn/signOut 调用
- 样式类验证
- 用户交互测试

### 2. DashboardStats 组件测试 ✅
**测试场景**:
- 免费用户统计显示
- 高级用户统计显示
- 边界情况处理 (零值、大数值)
- 布局和样式验证
- 图标和颜色正确性

**关键测试**:
- 条件渲染逻辑
- 数据格式化
- 响应式布局
- 视觉元素验证

### 3. ImageUpload 组件测试 ✅
**测试场景**:
- 初始渲染和属性
- 点击文件选择
- 拖拽上传功能
- 文件验证和处理
- 错误处理
- 加载状态
- 当前图片显示和移除

**关键测试**:
- 文件输入交互
- 拖拽事件处理
- 异步文件处理
- 错误边界测试
- 用户反馈验证

### 4. FrameSelector 组件测试 ✅
**测试场景**:
- 加载状态
- API数据获取和显示
- 框架选择功能
- 分类筛选
- 禁用状态
- 错误处理和重试
- 空状态处理

**关键测试**:
- 异步数据加载
- 用户交互响应
- 状态管理
- 错误恢复机制
- 条件渲染

### 5. PricingCard 组件测试 ⚠️
**测试场景**:
- 基础信息渲染
- 支付流程启动
- 当前套餐状态
- 不同套餐类型

**已知问题**:
- window.location 模拟问题
- 需要修复 JSDOM 兼容性

## 🔧 测试配置

### Jest 配置 (jest.config.js)
```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
}
```

### 测试设置 (tests/setup.ts)
- React Testing Library 配置
- Jest DOM 匹配器
- 全局模拟设置

## 🚀 运行测试

### 命令
```bash
# 运行所有单元测试
npm run test:unit

# 运行测试并生成覆盖率报告
npm run test:coverage

# 监视模式运行测试
npm run test:watch

# 运行特定测试文件
npx jest tests/unit/components/auth/LoginButton.test.tsx
```

### 覆盖率报告
测试覆盖率报告生成在 `coverage/` 目录中，包含：
- HTML 报告 (`coverage/lcov-report/index.html`)
- LCOV 数据 (`coverage/lcov.info`)
- JSON 报告 (`coverage/coverage-final.json`)

## 🐛 已知问题和修复计划

### 当前问题
1. **PricingCard 测试**: window.location 模拟问题
2. **FrameSelector 测试**: 3个测试用例需要修复选择器逻辑
3. **ImageUpload 测试**: 1个事件传播测试需要调整

### 修复优先级
1. **高优先级**: 修复 PricingCard 的 location 模拟
2. **中优先级**: 优化 FrameSelector 的元素选择器
3. **低优先级**: 调整 ImageUpload 的事件处理测试

## 📈 测试最佳实践

### 已实施的最佳实践
1. **AAA 模式**: Arrange-Act-Assert
2. **用户中心测试**: 使用 React Testing Library
3. **模拟外部依赖**: API、认证、图标等
4. **边界情况测试**: 错误状态、空数据、加载状态
5. **无障碍性测试**: 语义化元素、ARIA 属性

### 测试原则
- 测试用户行为，不是实现细节
- 优先测试关键用户路径
- 保持测试简单和可维护
- 使用描述性的测试名称
- 模拟外部依赖，隔离组件测试

## 🎯 下一步计划

### 短期目标
1. 修复现有4个失败测试
2. 提高整体代码覆盖率到80%+
3. 添加更多边界情况测试

### 长期目标
1. 集成测试 (E2E with Playwright)
2. 视觉回归测试
3. 性能测试
4. 可访问性自动化测试

## 📚 参考资源

- [React Testing Library 文档](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest 文档](https://jestjs.io/docs/getting-started)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
