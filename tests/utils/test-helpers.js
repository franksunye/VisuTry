// VisuTry 测试辅助工具
const axios = require('axios')
const FormData = require('form-data')
const fs = require('fs')
const path = require('path')

// 测试配置
const TEST_CONFIG = {
  baseURL: process.env.TEST_SERVER_URL || 'http://localhost:3000',
  timeout: parseInt(process.env.TEST_TIMEOUT) || 30000,
  retryCount: parseInt(process.env.TEST_RETRY_COUNT) || 3
}

/**
 * 认证测试辅助类
 */
class AuthTestHelper {
  constructor() {
    this.cookies = ''
    this.csrfToken = ''
    this.sessionData = null
  }

  /**
   * 获取CSRF令牌
   */
  async getCsrfToken() {
    try {
      const response = await axios.get(`${TEST_CONFIG.baseURL}/api/auth/csrf`)
      this.csrfToken = response.data.csrfToken
      
      if (response.headers['set-cookie']) {
        this.cookies = response.headers['set-cookie'].join('; ')
      }
      
      return this.csrfToken
    } catch (error) {
      throw new Error(`Failed to get CSRF token: ${error.message}`)
    }
  }

  /**
   * 执行Mock登录
   */
  async performMockLogin(userType = 'free') {
    try {
      if (!this.csrfToken) {
        await this.getCsrfToken()
      }

      const loginData = new URLSearchParams({
        email: userType === 'premium' ? 'premium@example.com' : 'test@example.com',
        type: userType,
        csrfToken: this.csrfToken,
        callbackUrl: `${TEST_CONFIG.baseURL}/`,
        json: 'true'
      })

      const response = await axios.post(
        `${TEST_CONFIG.baseURL}/api/auth/callback/mock-credentials`,
        loginData,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cookie': this.cookies
          },
          maxRedirects: 0,
          validateStatus: function (status) {
            return status >= 200 && status < 400
          }
        }
      )

      if (response.headers['set-cookie']) {
        const newCookies = response.headers['set-cookie'].join('; ')
        this.cookies = this.cookies ? `${this.cookies}; ${newCookies}` : newCookies
      }

      return response.status === 200
    } catch (error) {
      throw new Error(`Mock login failed: ${error.message}`)
    }
  }

  /**
   * 验证会话
   */
  async verifySession() {
    try {
      const response = await axios.get(`${TEST_CONFIG.baseURL}/api/auth/session`, {
        headers: {
          'Cookie': this.cookies
        }
      })

      this.sessionData = response.data
      return Object.keys(this.sessionData).length > 0
    } catch (error) {
      throw new Error(`Session verification failed: ${error.message}`)
    }
  }

  /**
   * 获取认证头信息
   */
  getAuthHeaders() {
    return {
      'Cookie': this.cookies
    }
  }

  /**
   * 重置认证状态
   */
  reset() {
    this.cookies = ''
    this.csrfToken = ''
    this.sessionData = null
  }
}

/**
 * API测试辅助类
 */
class ApiTestHelper {
  constructor(authHelper = null) {
    this.authHelper = authHelper
  }

  /**
   * 发送认证请求
   */
  async authenticatedRequest(method, url, data = null, options = {}) {
    const headers = {
      ...options.headers,
      ...(this.authHelper ? this.authHelper.getAuthHeaders() : {})
    }

    const config = {
      method,
      url: `${TEST_CONFIG.baseURL}${url}`,
      headers,
      timeout: TEST_CONFIG.timeout,
      ...options
    }

    if (data) {
      if (data instanceof FormData) {
        config.data = data
        Object.assign(headers, data.getHeaders())
      } else {
        config.data = data
        headers['Content-Type'] = 'application/json'
      }
    }

    try {
      const response = await axios(config)
      return response
    } catch (error) {
      if (error.response) {
        return error.response
      }
      throw error
    }
  }

  /**
   * 测试文件上传
   */
  async testFileUpload(filename = 'test-image.jpg', content = 'test content') {
    const form = new FormData()
    form.append('file', Buffer.from(content), {
      filename,
      contentType: 'image/jpeg'
    })

    return this.authenticatedRequest('POST', '/api/upload', form)
  }

  /**
   * 测试试戴API
   */
  async testTryOn(frameId = 'frame-1', userImageContent = 'fake image data') {
    const form = new FormData()
    form.append('userImage', Buffer.from(userImageContent), {
      filename: 'user.jpg',
      contentType: 'image/jpeg'
    })
    form.append('frameId', frameId)

    return this.authenticatedRequest('POST', '/api/try-on', form)
  }

  /**
   * 测试支付API
   */
  async testPayment(priceId = 'price_mock_premium') {
    const paymentData = { priceId }
    return this.authenticatedRequest('POST', '/api/payment/create-session', paymentData)
  }

  /**
   * 测试试戴历史API
   */
  async testTryOnHistory(params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const url = `/api/try-on/history${queryString ? `?${queryString}` : ''}`
    return this.authenticatedRequest('GET', url)
  }
}

/**
 * 测试数据生成器
 */
class TestDataGenerator {
  /**
   * 生成测试用户数据
   */
  static generateUserData(type = 'free') {
    return {
      id: `mock-user-${Date.now()}`,
      email: `test-${Date.now()}@example.com`,
      name: `Test User ${Date.now()}`,
      image: 'https://via.placeholder.com/150',
      freeTrialsUsed: type === 'premium' ? 0 : 1,
      isPremium: type === 'premium',
      premiumExpiresAt: type === 'premium' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null
    }
  }

  /**
   * 生成测试文件数据
   */
  static generateFileData(size = 1024) {
    return Buffer.alloc(size, 'test-content')
  }

  /**
   * 生成测试图片数据
   */
  static generateImageData(width = 400, height = 400) {
    // 简单的测试图片数据
    return Buffer.from(`test-image-${width}x${height}`)
  }
}

/**
 * 测试断言辅助函数
 */
class TestAssertions {
  /**
   * 断言API响应成功
   */
  static assertApiSuccess(response, expectedStatus = 200) {
    if (response.status !== expectedStatus) {
      throw new Error(`Expected status ${expectedStatus}, got ${response.status}: ${JSON.stringify(response.data)}`)
    }
    
    if (!response.data.success) {
      throw new Error(`API call failed: ${response.data.error || 'Unknown error'}`)
    }
  }

  /**
   * 断言API响应失败
   */
  static assertApiError(response, expectedStatus = 400) {
    if (response.status !== expectedStatus) {
      throw new Error(`Expected error status ${expectedStatus}, got ${response.status}`)
    }
    
    if (response.data.success) {
      throw new Error('Expected API call to fail, but it succeeded')
    }
  }

  /**
   * 断言认证要求
   */
  static assertAuthRequired(response) {
    this.assertApiError(response, 401)
  }

  /**
   * 断言数据结构
   */
  static assertDataStructure(data, expectedStructure) {
    for (const key in expectedStructure) {
      if (!(key in data)) {
        throw new Error(`Missing required field: ${key}`)
      }
      
      const expectedType = expectedStructure[key]
      const actualType = typeof data[key]
      
      if (actualType !== expectedType) {
        throw new Error(`Field ${key} should be ${expectedType}, got ${actualType}`)
      }
    }
  }
}

/**
 * 测试环境管理
 */
class TestEnvironment {
  /**
   * 等待服务器就绪
   */
  static async waitForServer(maxAttempts = 30, interval = 1000) {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        await axios.get(`${TEST_CONFIG.baseURL}/api/health`, { timeout: 5000 })
        return true
      } catch (error) {
        if (i === maxAttempts - 1) {
          throw new Error(`Server not ready after ${maxAttempts} attempts`)
        }
        await new Promise(resolve => setTimeout(resolve, interval))
      }
    }
  }

  /**
   * 清理测试数据
   */
  static async cleanup() {
    // 在Mock模式下重置Mock数据
    if (process.env.ENABLE_MOCKS === 'true') {
      try {
        await axios.post(`${TEST_CONFIG.baseURL}/api/test/reset-mocks`)
      } catch (error) {
        console.warn('Failed to reset mock data:', error.message)
      }
    }
  }

  /**
   * 创建测试图片文件
   */
  static async createTestImage(filePath, width = 400, height = 400) {
    // 确保目录存在
    const dir = path.dirname(filePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    // 创建一个简单的测试图片（实际上是文本文件，但在测试中可以模拟）
    const imageContent = `Test Image ${width}x${height}\nCreated at: ${new Date().toISOString()}`
    fs.writeFileSync(filePath, imageContent)

    return filePath
  }

  /**
   * 创建临时目录
   */
  static createTempDir() {
    const tempDir = path.join(__dirname, '../temp')
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }
    return tempDir
  }

  /**
   * 清理临时文件
   */
  static cleanupTempFiles() {
    const tempDir = path.join(__dirname, '../temp')
    if (fs.existsSync(tempDir)) {
      const files = fs.readdirSync(tempDir)
      files.forEach(file => {
        const filePath = path.join(tempDir, file)
        if (fs.statSync(filePath).isFile()) {
          fs.unlinkSync(filePath)
        }
      })
    }
  }
}

module.exports = {
  AuthTestHelper,
  ApiTestHelper,
  TestDataGenerator,
  TestAssertions,
  TestEnvironment,
  TEST_CONFIG
}
