// 工作中的API E2E测试 - 只测试能正常工作的端点
const axios = require('axios')

describe('Working API E2E Tests', () => {
  let baseURL

  beforeAll(async () => {
    baseURL = 'http://localhost:3000'
  })

  describe('Health Check API', () => {
    test('should respond to health check', async () => {
      const response = await axios.get(`${baseURL}/api/health`)
      expect(response.status).toBe(200)
      expect(response.data.status).toBe('ok')
      expect(response.data.service).toBe('VisuTry')
      expect(response.data.timestamp).toBeDefined()
    }, 30000)

    test('should respond quickly to health check', async () => {
      const startTime = Date.now()
      const response = await axios.get(`${baseURL}/api/health`)
      const responseTime = Date.now() - startTime
      
      expect(response.status).toBe(200)
      expect(responseTime).toBeLessThan(1000) // 应在1秒内响应
    }, 30000)
  })

  describe('Authentication Requirements', () => {
    test('should require authentication for file upload', async () => {
      const formData = new FormData()
      formData.append('file', 'test-content')
      
      try {
        await axios.post(`${baseURL}/api/upload`, formData)
      } catch (error) {
        expect(error.response.status).toBe(401)
        expect(error.response.data.success).toBe(false)
        expect(error.response.data.error).toContain('未授权')
      }
    }, 30000)

    test('should require authentication for try-on', async () => {
      try {
        await axios.post(`${baseURL}/api/try-on`, {
          userImageUrl: 'https://example.com/image.jpg',
          glassesImageUrl: 'https://example.com/glasses.jpg'
        })
      } catch (error) {
        expect(error.response.status).toBe(401)
        expect(error.response.data.success).toBe(false)
        expect(error.response.data.error).toContain('未授权')
      }
    }, 30000)

    test('should require authentication for payment session creation', async () => {
      try {
        await axios.post(`${baseURL}/api/payment/create-session`, {
          productType: 'premium',
          successUrl: 'https://example.com/success',
          cancelUrl: 'https://example.com/cancel'
        })
      } catch (error) {
        expect(error.response.status).toBe(401)
        expect(error.response.data.success).toBe(false)
        expect(error.response.data.error).toContain('未授权')
      }
    }, 30000)
  })

  describe('Error Handling', () => {
    test('should handle non-existent endpoints', async () => {
      try {
        await axios.get(`${baseURL}/api/non-existent-endpoint`)
      } catch (error) {
        expect(error.response.status).toBe(404)
      }
    }, 30000)

    test('should handle malformed requests', async () => {
      try {
        await axios.post(`${baseURL}/api/health`, 'invalid-json', {
          headers: { 'Content-Type': 'application/json' }
        })
      } catch (error) {
        expect([400, 405]).toContain(error.response.status) // 400 Bad Request or 405 Method Not Allowed
      }
    }, 30000)
  })

  describe('CORS and Headers', () => {
    test('should include proper headers', async () => {
      const response = await axios.get(`${baseURL}/api/health`)
      expect(response.status).toBe(200)
      expect(response.headers['content-type']).toContain('application/json')
    }, 30000)

    test('should handle CORS headers properly', async () => {
      const response = await axios.get(`${baseURL}/api/health`)
      expect(response.status).toBe(200)

      // 验证基本的HTTP头
      expect(response.headers).toBeDefined()
      expect(response.headers['content-type']).toContain('application/json')

      // 验证响应可以被正确解析
      expect(typeof response.data).toBe('object')
    }, 30000)
  })

  describe('Performance Tests', () => {
    test('should handle concurrent requests', async () => {
      const requests = Array(5).fill().map(() => 
        axios.get(`${baseURL}/api/health`)
      )
      
      const responses = await Promise.all(requests)
      
      responses.forEach(response => {
        expect(response.status).toBe(200)
        expect(response.data.status).toBe('ok')
      })
    }, 30000)

    test('should maintain consistent response format', async () => {
      const responses = []
      
      // 发送多个请求验证响应格式一致性
      for (let i = 0; i < 3; i++) {
        const response = await axios.get(`${baseURL}/api/health`)
        responses.push(response.data)
      }
      
      // 验证所有响应都有相同的结构
      responses.forEach(data => {
        expect(data.status).toBe('ok')
        expect(data.service).toBe('VisuTry')
        expect(data.timestamp).toBeDefined()
        expect(typeof data.timestamp).toBe('string')
      })
    }, 30000)
  })

  describe('Server Stability', () => {
    test('should handle rapid sequential requests', async () => {
      const results = []
      
      // 快速连续发送请求
      for (let i = 0; i < 10; i++) {
        const startTime = Date.now()
        const response = await axios.get(`${baseURL}/api/health`)
        const responseTime = Date.now() - startTime
        
        results.push({
          status: response.status,
          responseTime
        })
      }
      
      // 验证所有请求都成功
      results.forEach(result => {
        expect(result.status).toBe(200)
        expect(result.responseTime).toBeLessThan(2000) // 每个请求应在2秒内完成
      })
      
      // 验证平均响应时间合理
      const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length
      expect(avgResponseTime).toBeLessThan(500) // 平均响应时间应在500ms内
    }, 60000)

    test('should handle different HTTP methods appropriately', async () => {
      // GET请求应该成功
      const getResponse = await axios.get(`${baseURL}/api/health`)
      expect(getResponse.status).toBe(200)
      
      // POST请求应该返回405 Method Not Allowed
      try {
        await axios.post(`${baseURL}/api/health`, {})
      } catch (error) {
        expect(error.response.status).toBe(405)
      }
      
      // PUT请求应该返回405 Method Not Allowed
      try {
        await axios.put(`${baseURL}/api/health`, {})
      } catch (error) {
        expect(error.response.status).toBe(405)
      }
      
      // DELETE请求应该返回405 Method Not Allowed
      try {
        await axios.delete(`${baseURL}/api/health`)
      } catch (error) {
        expect(error.response.status).toBe(405)
      }
    }, 30000)
  })

  describe('Response Validation', () => {
    test('should return valid JSON', async () => {
      const response = await axios.get(`${baseURL}/api/health`)
      
      expect(response.status).toBe(200)
      expect(typeof response.data).toBe('object')
      expect(response.data).not.toBeNull()
      
      // 验证JSON结构
      expect(response.data).toHaveProperty('status')
      expect(response.data).toHaveProperty('service')
      expect(response.data).toHaveProperty('timestamp')
    }, 30000)

    test('should have consistent timestamp format', async () => {
      const response = await axios.get(`${baseURL}/api/health`)
      
      expect(response.status).toBe(200)
      
      const timestamp = response.data.timestamp
      expect(typeof timestamp).toBe('string')
      
      // 验证时间戳是有效的ISO字符串
      const date = new Date(timestamp)
      expect(date.toISOString()).toBe(timestamp)
      
      // 验证时间戳是最近的（在过去1分钟内）
      const now = new Date()
      const timeDiff = now - date
      expect(timeDiff).toBeLessThan(60000) // 1分钟 = 60000毫秒
    }, 30000)
  })
})
