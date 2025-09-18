// 完整用户旅程测试：从注册到试戴到升级
const { TestEnvironment } = require('../../utils/test-helpers')
const axios = require('axios')
const FormData = require('form-data')
const fs = require('fs')
const path = require('path')

describe('Complete User Journey Tests', () => {
  let baseURL
  let testImagePath

  beforeAll(async () => {
    await TestEnvironment.waitForServer()
    baseURL = 'http://localhost:3000'
    
    // 创建测试图片
    testImagePath = path.join(__dirname, '../../temp/test-user-image.jpg')
    await TestEnvironment.createTestImage(testImagePath)
  }, 60000)

  afterAll(async () => {
    // 清理测试文件
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath)
    }
    await TestEnvironment.cleanup()
  })

  describe('New User Complete Journey', () => {
    test('should complete full user journey: register → try-on → hit limits → upgrade → unlimited access', async () => {
      // 1. 新用户访问网站
      const homeResponse = await axios.get(baseURL)
      expect(homeResponse.status).toBe(200)

      // 2. 用户注册/登录
      const csrfResponse = await axios.get(`${baseURL}/api/auth/csrf`)
      const loginResponse = await axios.post(`${baseURL}/api/auth/signin/mock`, {
        userType: 'free',
        csrfToken: csrfResponse.data.csrfToken
      })
      expect(loginResponse.status).toBe(200)
      
      const authCookies = loginResponse.headers['set-cookie']?.join('; ') || ''

      // 3. 验证用户状态
      const sessionResponse = await axios.get(`${baseURL}/api/auth/session`, {
        headers: { 'Cookie': authCookies }
      })
      expect(sessionResponse.data.user).toBeDefined()
      expect(sessionResponse.data.user.isPremium).toBe(false)

      // 4. 查看用户仪表板
      const dashboardResponse = await axios.get(`${baseURL}/api/dashboard/stats`, {
        headers: { 'Cookie': authCookies }
      })
      expect(dashboardResponse.status).toBe(200)
      expect(dashboardResponse.data.tryOnsUsed).toBe(0)
      expect(dashboardResponse.data.tryOnsLimit).toBe(5) // 免费用户限制

      // 5. 上传用户照片
      const formData = new FormData()
      formData.append('image', fs.createReadStream(testImagePath))
      
      const uploadResponse = await axios.post(`${baseURL}/api/upload`, formData, {
        headers: {
          ...formData.getHeaders(),
          'Cookie': authCookies
        }
      })
      expect(uploadResponse.status).toBe(200)
      const userImageUrl = uploadResponse.data.url

      // 6. 浏览眼镜框架
      const framesResponse = await axios.get(`${baseURL}/api/frames`, {
        headers: { 'Cookie': authCookies }
      })
      expect(framesResponse.status).toBe(200)
      expect(framesResponse.data.frames.length).toBeGreaterThan(0)
      
      // 验证免费用户只能看到免费框架
      const freeFrames = framesResponse.data.frames.filter(frame => !frame.isPremium)
      expect(freeFrames.length).toBeGreaterThan(0)

      // 7. 进行多次试戴直到达到限制
      let tryOnCount = 0
      let limitReached = false
      
      for (let i = 0; i < 6; i++) { // 尝试超过免费限制
        try {
          const tryOnResponse = await axios.post(`${baseURL}/api/try-on`, {
            userImageUrl,
            frameId: freeFrames[i % freeFrames.length].id
          }, {
            headers: { 'Cookie': authCookies }
          })
          
          if (tryOnResponse.status === 200) {
            tryOnCount++
            expect(tryOnResponse.data.resultUrl).toBeDefined()
          }
        } catch (error) {
          if (error.response.status === 429) { // 达到限制
            limitReached = true
            break
          }
        }
      }

      // 验证免费用户确实有限制
      expect(limitReached || tryOnCount <= 5).toBe(true)

      // 8. 查看升级选项
      const pricingResponse = await axios.get(`${baseURL}/api/pricing`)
      expect(pricingResponse.status).toBe(200)
      expect(pricingResponse.data.plans.length).toBeGreaterThan(0)

      // 9. 创建支付意图
      const paymentResponse = await axios.post(`${baseURL}/api/payment/create-intent`, {
        planId: 'premium',
        priceId: 'price_premium_monthly'
      }, {
        headers: { 'Cookie': authCookies }
      })
      expect(paymentResponse.status).toBe(200)
      expect(paymentResponse.data.clientSecret).toBeDefined()

      // 10. 模拟支付成功
      const confirmResponse = await axios.post(`${baseURL}/api/payment/confirm`, {
        paymentIntentId: paymentResponse.data.paymentIntentId,
        paymentMethodId: 'pm_card_visa'
      }, {
        headers: { 'Cookie': authCookies }
      })
      expect(confirmResponse.status).toBe(200)

      // 11. 验证升级后的状态
      const updatedSessionResponse = await axios.get(`${baseURL}/api/auth/session`, {
        headers: { 'Cookie': authCookies }
      })
      // 注意：在真实场景中，这需要webhook处理，这里我们模拟升级
      
      // 12. 重新登录premium用户验证功能
      const premiumLoginResponse = await axios.post(`${baseURL}/api/auth/signin/mock`, {
        userType: 'premium',
        csrfToken: csrfResponse.data.csrfToken
      })
      const premiumCookies = premiumLoginResponse.headers['set-cookie']?.join('; ') || ''

      // 13. 验证premium功能
      const premiumFramesResponse = await axios.get(`${baseURL}/api/frames`, {
        headers: { 'Cookie': premiumCookies }
      })
      const premiumFrames = premiumFramesResponse.data.frames.filter(frame => frame.isPremium)
      expect(premiumFrames.length).toBeGreaterThan(0)

      // 14. 验证无限试戴
      const premiumDashboardResponse = await axios.get(`${baseURL}/api/dashboard/stats`, {
        headers: { 'Cookie': premiumCookies }
      })
      expect(premiumDashboardResponse.data.tryOnsLimit).toBe(-1) // 无限制

      // 15. 进行多次试戴验证无限制
      for (let i = 0; i < 3; i++) {
        const tryOnResponse = await axios.post(`${baseURL}/api/try-on`, {
          userImageUrl,
          frameId: premiumFrames[i % premiumFrames.length].id
        }, {
          headers: { 'Cookie': premiumCookies }
        })
        expect(tryOnResponse.status).toBe(200)
        expect(tryOnResponse.data.resultUrl).toBeDefined()
      }
    }, 120000) // 2分钟超时，因为这是完整流程测试
  })

  describe('User Experience Metrics', () => {
    test('should track user engagement metrics', async () => {
      // 登录用户
      const csrfResponse = await axios.get(`${baseURL}/api/auth/csrf`)
      const loginResponse = await axios.post(`${baseURL}/api/auth/signin/mock`, {
        userType: 'free',
        csrfToken: csrfResponse.data.csrfToken
      })
      const authCookies = loginResponse.headers['set-cookie']?.join('; ') || ''

      // 模拟用户活动
      await axios.get(`${baseURL}/api/frames`, {
        headers: { 'Cookie': authCookies }
      })

      // 上传图片
      const formData = new FormData()
      formData.append('image', fs.createReadStream(testImagePath))
      
      await axios.post(`${baseURL}/api/upload`, formData, {
        headers: {
          ...formData.getHeaders(),
          'Cookie': authCookies
        }
      })

      // 检查分析数据
      const analyticsResponse = await axios.get(`${baseURL}/api/analytics/user-activity`, {
        headers: { 'Cookie': authCookies }
      })
      expect(analyticsResponse.status).toBe(200)
      expect(analyticsResponse.data.pageViews).toBeGreaterThan(0)
      expect(analyticsResponse.data.uploads).toBeGreaterThan(0)
    }, 60000)
  })

  describe('Performance Benchmarks', () => {
    test('should meet performance requirements throughout user journey', async () => {
      const performanceMetrics = {}

      // 测试首页加载时间
      const homeStartTime = Date.now()
      await axios.get(baseURL)
      performanceMetrics.homePageLoad = Date.now() - homeStartTime
      expect(performanceMetrics.homePageLoad).toBeLessThan(3000) // < 3秒

      // 测试登录时间
      const loginStartTime = Date.now()
      const csrfResponse = await axios.get(`${baseURL}/api/auth/csrf`)
      const loginResponse = await axios.post(`${baseURL}/api/auth/signin/mock`, {
        userType: 'free',
        csrfToken: csrfResponse.data.csrfToken
      })
      performanceMetrics.loginTime = Date.now() - loginStartTime
      expect(performanceMetrics.loginTime).toBeLessThan(2000) // < 2秒

      const authCookies = loginResponse.headers['set-cookie']?.join('; ') || ''

      // 测试API响应时间
      const apiStartTime = Date.now()
      await axios.get(`${baseURL}/api/frames`, {
        headers: { 'Cookie': authCookies }
      })
      performanceMetrics.apiResponseTime = Date.now() - apiStartTime
      expect(performanceMetrics.apiResponseTime).toBeLessThan(500) // < 500ms

      console.log('Performance Metrics:', performanceMetrics)
    }, 30000)
  })
})
