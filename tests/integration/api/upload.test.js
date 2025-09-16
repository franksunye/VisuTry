// 文件上传API集成测试
const { AuthTestHelper, ApiTestHelper, TestAssertions, TestEnvironment, TestDataGenerator } = require('../../utils/test-helpers')

describe('Upload API Integration Tests', () => {
  let authHelper
  let apiHelper

  beforeAll(async () => {
    await TestEnvironment.waitForServer()
  })

  beforeEach(async () => {
    authHelper = new AuthTestHelper()
    apiHelper = new ApiTestHelper(authHelper)
    
    // 登录以获取认证
    await authHelper.performMockLogin('free')
  })

  afterEach(async () => {
    authHelper.reset()
  })

  afterAll(async () => {
    await TestEnvironment.cleanup()
  })

  describe('Authentication Requirements', () => {
    test('should require authentication for upload', async () => {
      const unauthenticatedHelper = new ApiTestHelper()
      const response = await unauthenticatedHelper.testFileUpload()
      
      TestAssertions.assertAuthRequired(response)
    })

    test('should accept authenticated requests', async () => {
      const response = await apiHelper.testFileUpload()
      
      TestAssertions.assertApiSuccess(response, 200)
    })
  })

  describe('File Upload Functionality', () => {
    test('should upload valid image file', async () => {
      const response = await apiHelper.testFileUpload('test.jpg', 'valid image content')
      
      TestAssertions.assertApiSuccess(response, 200)
      
      const data = response.data.data
      expect(data.url).toBeDefined()
      expect(data.filename).toBeDefined()
      expect(data.size).toBeDefined()
      expect(data.type).toBe('image/jpeg')
    })

    test('should handle different image formats', async () => {
      const formats = [
        { filename: 'test.jpg', type: 'image/jpeg' },
        { filename: 'test.png', type: 'image/png' },
        { filename: 'test.webp', type: 'image/webp' }
      ]

      for (const format of formats) {
        const response = await apiHelper.testFileUpload(format.filename, 'test content')
        
        TestAssertions.assertApiSuccess(response, 200)
        expect(response.data.data.type).toBe(format.type)
      }
    })

    test('should reject invalid file types', async () => {
      const response = await apiHelper.testFileUpload('test.txt', 'text content')
      
      TestAssertions.assertApiError(response, 400)
      expect(response.data.error).toContain('不支持的文件类型')
    })

    test('should reject oversized files', async () => {
      // 生成超过5MB的文件
      const largeContent = TestDataGenerator.generateFileData(6 * 1024 * 1024)
      const response = await apiHelper.testFileUpload('large.jpg', largeContent)
      
      TestAssertions.assertApiError(response, 400)
      expect(response.data.error).toContain('文件大小超过限制')
    })

    test('should handle missing file', async () => {
      const response = await apiHelper.authenticatedRequest('POST', '/api/upload', null)
      
      TestAssertions.assertApiError(response, 400)
      expect(response.data.error).toContain('未找到文件')
    })
  })

  describe('File Metadata', () => {
    test('should return correct file metadata', async () => {
      const testContent = 'test image content'
      const response = await apiHelper.testFileUpload('metadata-test.jpg', testContent)
      
      TestAssertions.assertApiSuccess(response, 200)
      
      const data = response.data.data
      TestAssertions.assertDataStructure(data, {
        url: 'string',
        filename: 'string',
        size: 'number',
        type: 'string'
      })
      
      expect(data.size).toBe(testContent.length)
      expect(data.filename).toContain('metadata-test.jpg')
      expect(data.url).toContain('mock-blob-storage')
    })

    test('should generate unique filenames', async () => {
      const response1 = await apiHelper.testFileUpload('same-name.jpg', 'content1')
      const response2 = await apiHelper.testFileUpload('same-name.jpg', 'content2')
      
      TestAssertions.assertApiSuccess(response1, 200)
      TestAssertions.assertApiSuccess(response2, 200)
      
      const filename1 = response1.data.data.filename
      const filename2 = response2.data.data.filename
      
      expect(filename1).not.toBe(filename2)
    })
  })

  describe('Mock Service Integration', () => {
    test('should use mock blob storage in test mode', async () => {
      const response = await apiHelper.testFileUpload()
      
      TestAssertions.assertApiSuccess(response, 200)
      
      const url = response.data.data.url
      expect(url).toContain('mock-blob-storage.vercel.app')
    })

    test('should simulate upload delay', async () => {
      const startTime = Date.now()
      
      await apiHelper.testFileUpload()
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      // Mock服务应该有一定的延迟来模拟真实上传
      expect(duration).toBeGreaterThan(100)
    })
  })

  describe('Error Handling', () => {
    test('should handle service errors gracefully', async () => {
      // 这里可以通过Mock服务模拟各种错误情况
      // 例如：网络错误、服务不可用等
    })

    test('should provide meaningful error messages', async () => {
      const response = await apiHelper.testFileUpload('invalid.exe', 'executable content')
      
      TestAssertions.assertApiError(response, 400)
      expect(response.data.error).toBeDefined()
      expect(typeof response.data.error).toBe('string')
    })
  })

  describe('Security Tests', () => {
    test('should validate file content', async () => {
      // 测试恶意文件内容
      const maliciousContent = '<script>alert("xss")</script>'
      const response = await apiHelper.testFileUpload('malicious.jpg', maliciousContent)
      
      // 应该成功上传，但内容应该被安全处理
      TestAssertions.assertApiSuccess(response, 200)
    })

    test('should limit file size appropriately', async () => {
      // 测试边界情况
      const maxSizeContent = TestDataGenerator.generateFileData(5 * 1024 * 1024) // 正好5MB
      const response = await apiHelper.testFileUpload('max-size.jpg', maxSizeContent)
      
      TestAssertions.assertApiSuccess(response, 200)
    })
  })

  describe('Performance Tests', () => {
    test('should handle multiple concurrent uploads', async () => {
      const uploadPromises = []
      
      for (let i = 0; i < 5; i++) {
        uploadPromises.push(apiHelper.testFileUpload(`concurrent-${i}.jpg`, `content-${i}`))
      }
      
      const responses = await Promise.all(uploadPromises)
      
      responses.forEach(response => {
        TestAssertions.assertApiSuccess(response, 200)
      })
    })

    test('should complete upload within reasonable time', async () => {
      const startTime = Date.now()
      
      await apiHelper.testFileUpload()
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      // 上传应该在10秒内完成
      expect(duration).toBeLessThan(10000)
    })
  })
})
