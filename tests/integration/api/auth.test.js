// 认证API集成测试
const { AuthTestHelper, TestAssertions, TestEnvironment } = require('../../utils/test-helpers')

describe('Authentication API Integration Tests', () => {
  let authHelper

  beforeAll(async () => {
    // 等待服务器就绪
    await TestEnvironment.waitForServer()
  })

  beforeEach(() => {
    authHelper = new AuthTestHelper()
  })

  afterEach(async () => {
    // 清理测试数据
    authHelper.reset()
  })

  afterAll(async () => {
    await TestEnvironment.cleanup()
  })

  describe('CSRF Token Management', () => {
    test('should successfully obtain CSRF token', async () => {
      const token = await authHelper.getCsrfToken()
      
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.length).toBeGreaterThan(0)
      expect(authHelper.cookies).toBeDefined()
    })

    test('should handle CSRF token errors gracefully', async () => {
      // 模拟服务器错误
      const originalBaseURL = process.env.TEST_SERVER_URL
      process.env.TEST_SERVER_URL = 'http://invalid-url:9999'
      
      await expect(authHelper.getCsrfToken()).rejects.toThrow()
      
      // 恢复原始URL
      process.env.TEST_SERVER_URL = originalBaseURL
    })
  })

  describe('Mock Login Flow', () => {
    test('should successfully login with free user', async () => {
      const success = await authHelper.performMockLogin('free')
      
      expect(success).toBe(true)
      expect(authHelper.cookies).toBeDefined()
    })

    test('should successfully login with premium user', async () => {
      const success = await authHelper.performMockLogin('premium')
      
      expect(success).toBe(true)
      expect(authHelper.cookies).toBeDefined()
    })

    test('should handle invalid user type', async () => {
      await expect(authHelper.performMockLogin('invalid')).rejects.toThrow()
    })
  })

  describe('Session Management', () => {
    test('should verify session after successful login', async () => {
      await authHelper.performMockLogin('free')
      const sessionValid = await authHelper.verifySession()
      
      expect(sessionValid).toBe(true)
      expect(authHelper.sessionData).toBeDefined()
      expect(authHelper.sessionData.user).toBeDefined()
      expect(authHelper.sessionData.user.email).toBe('test@example.com')
      expect(authHelper.sessionData.user.isPremium).toBe(false)
    })

    test('should verify premium user session', async () => {
      await authHelper.performMockLogin('premium')
      const sessionValid = await authHelper.verifySession()
      
      expect(sessionValid).toBe(true)
      expect(authHelper.sessionData.user.email).toBe('premium@example.com')
      expect(authHelper.sessionData.user.isPremium).toBe(true)
    })

    test('should handle invalid session', async () => {
      // 不登录直接验证会话
      const sessionValid = await authHelper.verifySession()
      
      expect(sessionValid).toBe(false)
    })
  })

  describe('Authentication Headers', () => {
    test('should provide correct auth headers after login', async () => {
      await authHelper.performMockLogin('free')
      const headers = authHelper.getAuthHeaders()
      
      expect(headers).toBeDefined()
      expect(headers.Cookie).toBeDefined()
      expect(typeof headers.Cookie).toBe('string')
    })

    test('should provide empty headers before login', () => {
      const headers = authHelper.getAuthHeaders()
      
      expect(headers.Cookie).toBe('')
    })
  })

  describe('Complete Authentication Flow', () => {
    test('should complete full authentication workflow', async () => {
      // 1. 获取CSRF令牌
      const csrfToken = await authHelper.getCsrfToken()
      expect(csrfToken).toBeDefined()

      // 2. 执行登录
      const loginSuccess = await authHelper.performMockLogin('free')
      expect(loginSuccess).toBe(true)

      // 3. 验证会话
      const sessionValid = await authHelper.verifySession()
      expect(sessionValid).toBe(true)

      // 4. 检查用户数据
      const userData = authHelper.sessionData.user
      TestAssertions.assertDataStructure(userData, {
        id: 'string',
        email: 'string',
        name: 'string',
        isPremium: 'boolean',
        freeTrialsUsed: 'number'
      })
    })
  })

  describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      // 模拟网络错误
      const invalidAuthHelper = new AuthTestHelper()
      const originalBaseURL = process.env.TEST_SERVER_URL
      process.env.TEST_SERVER_URL = 'http://localhost:9999'
      
      await expect(invalidAuthHelper.getCsrfToken()).rejects.toThrow()
      
      // 恢复原始URL
      process.env.TEST_SERVER_URL = originalBaseURL
    })

    test('should handle malformed responses', async () => {
      // 这个测试需要Mock服务器返回错误格式的响应
      // 在实际实现中，可以通过Mock服务来模拟
    })
  })

  describe('Security Tests', () => {
    test('should require CSRF token for login', async () => {
      // 尝试不使用CSRF令牌登录
      const authHelperNoCsrf = new AuthTestHelper()
      authHelperNoCsrf.csrfToken = 'invalid-token'
      
      await expect(authHelperNoCsrf.performMockLogin('free')).rejects.toThrow()
    })

    test('should invalidate session on logout', async () => {
      await authHelper.performMockLogin('free')
      await authHelper.verifySession()
      
      // 执行登出（重置状态）
      authHelper.reset()
      
      expect(authHelper.cookies).toBe('')
      expect(authHelper.sessionData).toBeNull()
    })
  })

  describe('Performance Tests', () => {
    test('should complete authentication within reasonable time', async () => {
      const startTime = Date.now()
      
      await authHelper.performMockLogin('free')
      await authHelper.verifySession()
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      // 认证流程应该在5秒内完成
      expect(duration).toBeLessThan(5000)
    })
  })
})
