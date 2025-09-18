// E2E测试：完整试戴流程
const { TestEnvironment } = require('../../utils/test-helpers')
const axios = require('axios')
const FormData = require('form-data')
const fs = require('fs')
const path = require('path')

describe('Try-On Workflow E2E Tests', () => {
  let baseURL
  let authCookies
  let testImagePath

  beforeAll(async () => {
    await TestEnvironment.waitForServer()
    baseURL = 'http://localhost:3000'
    
    // 创建测试图片
    testImagePath = path.join(__dirname, '../../temp/test-image.jpg')
    await TestEnvironment.createTestImage(testImagePath)
    
    // 登录获取认证
    const csrfResponse = await axios.get(`${baseURL}/api/auth/csrf`)
    const loginResponse = await axios.post(`${baseURL}/api/auth/signin/mock`, {
      userType: 'free',
      csrfToken: csrfResponse.data.csrfToken
    })
    authCookies = loginResponse.headers['set-cookie']?.join('; ') || ''
  }, 60000)

  afterAll(async () => {
    // 清理测试文件
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath)
    }
    await TestEnvironment.cleanup()
  })

  describe('Complete Try-On Flow', () => {
    test('should complete full try-on workflow: upload → select → try-on → view', async () => {
      // 1. 上传用户照片
      const formData = new FormData()
      formData.append('image', fs.createReadStream(testImagePath))
      
      const uploadResponse = await axios.post(`${baseURL}/api/upload`, formData, {
        headers: {
          ...formData.getHeaders(),
          'Cookie': authCookies
        }
      })
      expect(uploadResponse.status).toBe(200)
      expect(uploadResponse.data.url).toBeDefined()
      
      const userImageUrl = uploadResponse.data.url

      // 2. 获取眼镜框架列表
      const framesResponse = await axios.get(`${baseURL}/api/frames`, {
        headers: { 'Cookie': authCookies }
      })
      expect(framesResponse.status).toBe(200)
      expect(framesResponse.data.frames).toBeDefined()
      expect(framesResponse.data.frames.length).toBeGreaterThan(0)
      
      const selectedFrame = framesResponse.data.frames[0]

      // 3. 执行试戴
      const tryOnResponse = await axios.post(`${baseURL}/api/try-on`, {
        userImageUrl,
        frameId: selectedFrame.id
      }, {
        headers: { 'Cookie': authCookies }
      })
      expect(tryOnResponse.status).toBe(200)
      expect(tryOnResponse.data.resultUrl).toBeDefined()
      expect(tryOnResponse.data.processingTime).toBeDefined()

      // 4. 验证结果
      const resultUrl = tryOnResponse.data.resultUrl
      expect(resultUrl).toMatch(/^https?:\/\//)
      
      // 验证结果图片可访问
      const resultResponse = await axios.head(resultUrl)
      expect(resultResponse.status).toBe(200)
    }, 60000)

    test('should handle multiple frame selections', async () => {
      // 上传图片
      const formData = new FormData()
      formData.append('image', fs.createReadStream(testImagePath))
      
      const uploadResponse = await axios.post(`${baseURL}/api/upload`, formData, {
        headers: {
          ...formData.getHeaders(),
          'Cookie': authCookies
        }
      })
      const userImageUrl = uploadResponse.data.url

      // 获取多个框架
      const framesResponse = await axios.get(`${baseURL}/api/frames`)
      const frames = framesResponse.data.frames.slice(0, 3) // 测试前3个框架

      // 依次试戴多个框架
      for (const frame of frames) {
        const tryOnResponse = await axios.post(`${baseURL}/api/try-on`, {
          userImageUrl,
          frameId: frame.id
        }, {
          headers: { 'Cookie': authCookies }
        })
        expect(tryOnResponse.status).toBe(200)
        expect(tryOnResponse.data.resultUrl).toBeDefined()
      }
    }, 90000)
  })

  describe('Error Scenarios', () => {
    test('should handle invalid image upload', async () => {
      const formData = new FormData()
      formData.append('image', 'invalid-data')
      
      try {
        await axios.post(`${baseURL}/api/upload`, formData, {
          headers: {
            ...formData.getHeaders(),
            'Cookie': authCookies
          }
        })
      } catch (error) {
        expect(error.response.status).toBe(400)
      }
    }, 30000)

    test('should handle invalid frame selection', async () => {
      // 上传有效图片
      const formData = new FormData()
      formData.append('image', fs.createReadStream(testImagePath))
      
      const uploadResponse = await axios.post(`${baseURL}/api/upload`, formData, {
        headers: {
          ...formData.getHeaders(),
          'Cookie': authCookies
        }
      })

      // 尝试使用无效框架ID
      try {
        await axios.post(`${baseURL}/api/try-on`, {
          userImageUrl: uploadResponse.data.url,
          frameId: 'invalid-frame-id'
        }, {
          headers: { 'Cookie': authCookies }
        })
      } catch (error) {
        expect(error.response.status).toBe(404)
      }
    }, 30000)

    test('should require authentication for try-on', async () => {
      try {
        await axios.post(`${baseURL}/api/try-on`, {
          userImageUrl: 'https://example.com/image.jpg',
          frameId: 'frame-1'
        })
      } catch (error) {
        expect(error.response.status).toBe(401)
      }
    }, 30000)
  })

  describe('Performance Tests', () => {
    test('should complete try-on within reasonable time', async () => {
      // 上传图片
      const formData = new FormData()
      formData.append('image', fs.createReadStream(testImagePath))
      
      const uploadResponse = await axios.post(`${baseURL}/api/upload`, formData, {
        headers: {
          ...formData.getHeaders(),
          'Cookie': authCookies
        }
      })

      // 获取框架
      const framesResponse = await axios.get(`${baseURL}/api/frames`)
      const frame = framesResponse.data.frames[0]

      // 测试试戴性能
      const startTime = Date.now()
      const tryOnResponse = await axios.post(`${baseURL}/api/try-on`, {
        userImageUrl: uploadResponse.data.url,
        frameId: frame.id
      }, {
        headers: { 'Cookie': authCookies }
      })
      const endTime = Date.now()

      expect(tryOnResponse.status).toBe(200)
      
      // 验证处理时间在合理范围内（< 10秒）
      const processingTime = endTime - startTime
      expect(processingTime).toBeLessThan(10000)
      
      // 验证API返回的处理时间
      expect(tryOnResponse.data.processingTime).toBeLessThan(5000)
    }, 30000)
  })

  describe('User Limits', () => {
    test('should respect free user limits', async () => {
      // 上传图片
      const formData = new FormData()
      formData.append('image', fs.createReadStream(testImagePath))
      
      const uploadResponse = await axios.post(`${baseURL}/api/upload`, formData, {
        headers: {
          ...formData.getHeaders(),
          'Cookie': authCookies
        }
      })

      const framesResponse = await axios.get(`${baseURL}/api/frames`)
      const frame = framesResponse.data.frames[0]

      // 执行多次试戴，测试免费用户限制
      let successCount = 0
      let limitReached = false

      for (let i = 0; i < 10; i++) {
        try {
          const tryOnResponse = await axios.post(`${baseURL}/api/try-on`, {
            userImageUrl: uploadResponse.data.url,
            frameId: frame.id
          }, {
            headers: { 'Cookie': authCookies }
          })
          
          if (tryOnResponse.status === 200) {
            successCount++
          }
        } catch (error) {
          if (error.response.status === 429) { // Too Many Requests
            limitReached = true
            break
          }
        }
      }

      // 免费用户应该有使用限制
      expect(limitReached || successCount <= 5).toBe(true)
    }, 60000)
  })
})
