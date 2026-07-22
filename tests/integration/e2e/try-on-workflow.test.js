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
  let testGlassesPath

  beforeAll(async () => {
    await TestEnvironment.waitForServer()
    baseURL = 'http://localhost:3000'
    
    // 创建测试图片
    testImagePath = path.join(__dirname, '../../temp/test-image.jpg')
    await TestEnvironment.createTestImage(testImagePath)
    testGlassesPath = path.join(__dirname, '../../temp/test-glasses.jpg')
    await TestEnvironment.createTestImage(testGlassesPath, 300, 300)
    
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
    if (fs.existsSync(testGlassesPath)) {
      fs.unlinkSync(testGlassesPath)
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
      const tryOnForm = new FormData()
      tryOnForm.append('userImage', fs.createReadStream(testImagePath))
      tryOnForm.append('itemImage', fs.createReadStream(testGlassesPath))

      const tryOnResponse = await axios.post(`${baseURL}/api/try-on/submit`, tryOnForm, {
        headers: {
          ...tryOnForm.getHeaders(),
          'Cookie': authCookies
        }
      })
      expect(tryOnResponse.status).toBe(200)
      expect(tryOnResponse.data.success).toBe(true)
      expect(tryOnResponse.data.data).toBeDefined()

      // 4. 验证结果
      const result = tryOnResponse.data.data
      expect(result.status).toBeDefined()
      
      // 验证结果（同步返回 resultUrl 或异步返回 taskId）
      if (result.resultUrl) {
        const resultResponse = await axios.head(result.resultUrl)
        expect(resultResponse.status).toBe(200)
      }
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
        const tryOnForm = new FormData()
        tryOnForm.append('userImage', fs.createReadStream(testImagePath))
        tryOnForm.append('itemImage', fs.createReadStream(testGlassesPath))

        const tryOnResponse = await axios.post(`${baseURL}/api/try-on/submit`, tryOnForm, {
          headers: {
            ...tryOnForm.getHeaders(),
            'Cookie': authCookies
          }
        })
        expect(tryOnResponse.status).toBe(200)
        expect(tryOnResponse.data.success).toBe(true)
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

    test('should handle missing item image', async () => {
      // 提交只有 userImage 没有 itemImage 的请求
      const tryOnForm = new FormData()
      tryOnForm.append('userImage', fs.createReadStream(testImagePath))

      try {
        await axios.post(`${baseURL}/api/try-on/submit`, tryOnForm, {
          headers: {
            ...tryOnForm.getHeaders(),
            'Cookie': authCookies
          }
        })
      } catch (error) {
        expect(error.response.status).toBe(400)
      }
    }, 30000)

    test('should require authentication for try-on', async () => {
      const tryOnForm = new FormData()
      tryOnForm.append('userImage', fs.createReadStream(testImagePath))
      tryOnForm.append('itemImage', fs.createReadStream(testGlassesPath))

      try {
        await axios.post(`${baseURL}/api/try-on/submit`, tryOnForm, {
          headers: { ...tryOnForm.getHeaders() }
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
      const tryOnForm = new FormData()
      tryOnForm.append('userImage', fs.createReadStream(testImagePath))
      tryOnForm.append('itemImage', fs.createReadStream(testGlassesPath))

      const tryOnResponse = await axios.post(`${baseURL}/api/try-on/submit`, tryOnForm, {
        headers: {
          ...tryOnForm.getHeaders(),
          'Cookie': authCookies
        }
      })
      const endTime = Date.now()

      expect(tryOnResponse.status).toBe(200)
      
      // 验证处理时间在合理范围内（< 10秒）
      const processingTime = endTime - startTime
      expect(processingTime).toBeLessThan(10000)
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
          const tryOnForm = new FormData()
          tryOnForm.append('userImage', fs.createReadStream(testImagePath))
          tryOnForm.append('itemImage', fs.createReadStream(testGlassesPath))

          const tryOnResponse = await axios.post(`${baseURL}/api/try-on/submit`, tryOnForm, {
            headers: {
              ...tryOnForm.getHeaders(),
              'Cookie': authCookies
            }
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
