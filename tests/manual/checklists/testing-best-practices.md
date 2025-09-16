# VisuTry 测试最佳实践

## 🎯 测试原则

### 1. 测试金字塔
```
    /\
   /E2E\     <- 少量端到端测试
  /______\
 /Integration\ <- 适量集成测试  
/______________\
/   Unit Tests  \ <- 大量单元测试
```

### 2. 测试策略
- **单元测试**: 测试独立的函数和组件
- **集成测试**: 测试组件间的交互
- **端到端测试**: 测试完整的用户流程

### 3. 测试原则
- **独立性**: 每个测试应该独立运行
- **可重复性**: 测试结果应该一致
- **快速性**: 测试应该快速执行
- **可维护性**: 测试代码应该易于维护

## 📝 编写测试

### 1. 测试命名规范

#### 好的测试名称
```javascript
// ✅ 描述性强，清楚表达测试意图
test('should return 401 when user is not authenticated')
test('should upload file successfully with valid image')
test('should create payment session for premium user')
```

#### 避免的测试名称
```javascript
// ❌ 不够描述性
test('auth test')
test('upload works')
test('payment')
```

### 2. 测试结构 (AAA模式)

```javascript
test('should create try-on task successfully', async () => {
  // Arrange - 准备测试数据
  const authHelper = new AuthTestHelper()
  await authHelper.performMockLogin('free')
  const apiHelper = new ApiTestHelper(authHelper)
  
  // Act - 执行被测试的操作
  const response = await apiHelper.testTryOn('frame-1', 'test-image-data')
  
  // Assert - 验证结果
  expect(response.status).toBe(200)
  expect(response.data.success).toBe(true)
  expect(response.data.data.taskId).toBeDefined()
})
```

### 3. 测试数据管理

#### 使用测试数据生成器
```javascript
// ✅ 使用工厂函数生成测试数据
const userData = TestDataGenerator.generateUserData('premium')
const imageData = TestDataGenerator.generateImageData(400, 400)
```

#### 避免硬编码数据
```javascript
// ❌ 硬编码测试数据
const user = {
  id: '123',
  email: 'test@example.com',
  name: 'Test User'
}

// ✅ 使用动态生成的数据
const user = TestDataGenerator.generateUserData()
```

### 4. 异步测试处理

```javascript
// ✅ 正确处理异步操作
test('should handle async operations', async () => {
  const result = await someAsyncFunction()
  expect(result).toBeDefined()
})

// ✅ 使用超时设置
test('should complete within timeout', async () => {
  const startTime = Date.now()
  await someSlowOperation()
  const duration = Date.now() - startTime
  expect(duration).toBeLessThan(5000)
}, 10000) // 10秒超时
```

## 🔧 Mock服务使用

### 1. Mock服务原则
- **一致性**: Mock行为应该与真实服务一致
- **可控性**: 能够控制Mock的返回结果
- **隔离性**: 不依赖外部服务

### 2. Mock认证
```javascript
// ✅ 使用认证辅助类
const authHelper = new AuthTestHelper()
await authHelper.performMockLogin('premium')

// ✅ 验证认证状态
const isAuthenticated = await authHelper.verifySession()
expect(isAuthenticated).toBe(true)
```

### 3. Mock API调用
```javascript
// ✅ 使用API辅助类
const apiHelper = new ApiTestHelper(authHelper)
const response = await apiHelper.testFileUpload()

// ✅ 验证Mock响应
expect(response.data.data.url).toContain('mock-blob-storage')
```

## 🛡️ 安全测试

### 1. 认证测试
```javascript
test('should require authentication', async () => {
  const unauthenticatedHelper = new ApiTestHelper()
  const response = await unauthenticatedHelper.testFileUpload()
  
  TestAssertions.assertAuthRequired(response)
})
```

### 2. 输入验证测试
```javascript
test('should validate file type', async () => {
  const response = await apiHelper.testFileUpload('malicious.exe', 'content')
  
  TestAssertions.assertApiError(response, 400)
  expect(response.data.error).toContain('不支持的文件类型')
})
```

### 3. 权限测试
```javascript
test('should respect user permissions', async () => {
  // 测试免费用户的限制
  await authHelper.performMockLogin('free')
  // ... 测试权限限制
  
  // 测试高级用户的权限
  await authHelper.performMockLogin('premium')
  // ... 测试扩展权限
})
```

## 📊 性能测试

### 1. 响应时间测试
```javascript
test('should respond within acceptable time', async () => {
  const startTime = Date.now()
  
  await apiHelper.testFileUpload()
  
  const duration = Date.now() - startTime
  expect(duration).toBeLessThan(2000) // 2秒内响应
})
```

### 2. 并发测试
```javascript
test('should handle concurrent requests', async () => {
  const promises = []
  
  for (let i = 0; i < 5; i++) {
    promises.push(apiHelper.testFileUpload(`file-${i}.jpg`))
  }
  
  const responses = await Promise.all(promises)
  
  responses.forEach(response => {
    TestAssertions.assertApiSuccess(response)
  })
})
```

## 🐛 错误处理测试

### 1. 网络错误
```javascript
test('should handle network errors gracefully', async () => {
  // 模拟网络错误
  const invalidHelper = new ApiTestHelper()
  // 设置无效的服务器URL
  
  await expect(invalidHelper.testFileUpload()).rejects.toThrow()
})
```

### 2. 服务错误
```javascript
test('should handle service errors', async () => {
  // 通过Mock服务模拟各种错误情况
  const response = await apiHelper.testWithMockError('500')
  
  expect(response.status).toBe(500)
  expect(response.data.error).toBeDefined()
})
```

## 📋 测试检查清单

### 编写测试前
- [ ] 明确测试目标和范围
- [ ] 准备必要的测试数据
- [ ] 确认测试环境配置
- [ ] 了解被测试功能的预期行为

### 编写测试时
- [ ] 使用描述性的测试名称
- [ ] 遵循AAA模式（Arrange-Act-Assert）
- [ ] 测试正常情况和异常情况
- [ ] 使用适当的断言方法
- [ ] 处理异步操作
- [ ] 设置合理的超时时间

### 测试完成后
- [ ] 验证测试能够独立运行
- [ ] 检查测试覆盖率
- [ ] 清理测试数据
- [ ] 更新相关文档
- [ ] 代码审查

## 🔄 持续改进

### 1. 定期审查
- 每月审查测试覆盖率
- 识别测试盲点
- 更新过时的测试

### 2. 性能监控
- 监控测试执行时间
- 优化慢速测试
- 并行化独立测试

### 3. 工具升级
- 保持测试工具最新
- 采用新的测试技术
- 改进测试基础设施

## 📚 参考资源

### 文档
- [Jest官方文档](https://jestjs.io/docs/getting-started)
- [Testing Library文档](https://testing-library.com/docs/)
- [Next.js测试指南](https://nextjs.org/docs/testing)

### 内部资源
- `tests/README.md` - 测试框架概述
- `tests/utils/test-helpers.js` - 测试工具库
- `tests/manual/test-plans/` - 测试计划
- `tests/reports/` - 测试报告

### 示例
- `tests/integration/api/` - API测试示例
- `tests/legacy/` - 历史测试参考
- `tests/fixtures/` - 测试数据示例
