// E2E测试：用户注册登录流程
const { TestEnvironment } = require('../../utils/test-helpers')
const axios = require('axios')

describe('User Registration and Login E2E Tests', () => {
  let baseURL
  let testUser

  beforeAll(async () => {
    await TestEnvironment.waitForServer()
    baseURL = 'http://localhost:3000'
    
    // 测试用户数据
    testUser = {
      email: 'test@example.com',
      name: 'Test User',
      provider: 'mock'
    }
  }, 60000)

  afterAll(async () => {
    await TestEnvironment.cleanup()
  })

  describe('User Authentication Flow', () => {
    test('should complete full authentication workflow', async () => {
      // 1. 访问首页
      const homeResponse = await axios.get(baseURL)
      expect(homeResponse.status).toBe(200)
      expect(homeResponse.data).toContain('VisuTry')

      // 2. 获取CSRF token
      const csrfResponse = await axios.get(`${baseURL}/api/auth/csrf`)
      expect(csrfResponse.status).toBe(200)
      expect(csrfResponse.data.csrfToken).toBeDefined()

      // 3. 模拟登录
      const loginResponse = await axios.post(`${baseURL}/api/auth/signin/mock`, {
        userType: 'free',
        csrfToken: csrfResponse.data.csrfToken
      })
      expect(loginResponse.status).toBe(200)

      // 4. 验证session
      const sessionResponse = await axios.get(`${baseURL}/api/auth/session`, {
        headers: {
          'Cookie': loginResponse.headers['set-cookie']?.join('; ') || ''
        }
      })
      expect(sessionResponse.status).toBe(200)
      expect(sessionResponse.data.user).toBeDefined()
    }, 30000)

    test('should handle login with premium user', async () => {
      // 获取CSRF token
      const csrfResponse = await axios.get(`${baseURL}/api/auth/csrf`)
      
      // 模拟premium用户登录
      const loginResponse = await axios.post(`${baseURL}/api/auth/signin/mock`, {
        userType: 'premium',
        csrfToken: csrfResponse.data.csrfToken
      })
      expect(loginResponse.status).toBe(200)

      // 验证premium用户session
      const sessionResponse = await axios.get(`${baseURL}/api/auth/session`, {
        headers: {
          'Cookie': loginResponse.headers['set-cookie']?.join('; ') || ''
        }
      })
      expect(sessionResponse.data.user.isPremium).toBe(true)
    }, 30000)

    test('should handle logout properly', async () => {
      // 先登录
      const csrfResponse = await axios.get(`${baseURL}/api/auth/csrf`)
      const loginResponse = await axios.post(`${baseURL}/api/auth/signin/mock`, {
        userType: 'free',
        csrfToken: csrfResponse.data.csrfToken
      })

      // 登出
      const logoutResponse = await axios.post(`${baseURL}/api/auth/signout`, {
        csrfToken: csrfResponse.data.csrfToken
      }, {
        headers: {
          'Cookie': loginResponse.headers['set-cookie']?.join('; ') || ''
        }
      })
      expect(logoutResponse.status).toBe(200)

      // 验证session已清除
      const sessionResponse = await axios.get(`${baseURL}/api/auth/session`)
      expect(sessionResponse.data.user).toBeNull()
    }, 30000)
  })

  describe('Error Handling', () => {
    test('should handle invalid login attempts', async () => {
      const csrfResponse = await axios.get(`${baseURL}/api/auth/csrf`)
      
      try {
        await axios.post(`${baseURL}/api/auth/signin/mock`, {
          userType: 'invalid',
          csrfToken: csrfResponse.data.csrfToken
        })
      } catch (error) {
        expect(error.response.status).toBe(400)
      }
    }, 30000)

    test('should require CSRF token for authentication', async () => {
      try {
        await axios.post(`${baseURL}/api/auth/signin/mock`, {
          userType: 'free'
          // 缺少csrfToken
        })
      } catch (error) {
        expect(error.response.status).toBe(403)
      }
    }, 30000)
  })

  describe('Session Persistence', () => {
    test('should maintain session across requests', async () => {
      // 登录
      const csrfResponse = await axios.get(`${baseURL}/api/auth/csrf`)
      const loginResponse = await axios.post(`${baseURL}/api/auth/signin/mock`, {
        userType: 'free',
        csrfToken: csrfResponse.data.csrfToken
      })

      const cookies = loginResponse.headers['set-cookie']?.join('; ') || ''

      // 多次请求验证session持久性
      for (let i = 0; i < 3; i++) {
        const sessionResponse = await axios.get(`${baseURL}/api/auth/session`, {
          headers: { 'Cookie': cookies }
        })
        expect(sessionResponse.data.user).toBeDefined()
        expect(sessionResponse.data.user.email).toBeDefined()
      }
    }, 30000)
  })
})
