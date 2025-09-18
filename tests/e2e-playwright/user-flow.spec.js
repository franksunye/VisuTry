// Playwright E2E测试：用户完整流程
const { test, expect } = require('@playwright/test')

test.describe('VisuTry User Flow', () => {
  test.beforeEach(async ({ page }) => {
    // 设置测试环境
    await page.goto('/')
  })

  test('complete user journey from landing to try-on', async ({ page }) => {
    // 1. 验证首页加载
    await expect(page).toHaveTitle(/VisuTry/)
    await expect(page.locator('h1')).toContainText('VisuTry')

    // 2. 点击开始试戴按钮
    await page.click('text=开始试戴')
    
    // 3. 模拟登录
    await page.click('text=登录')
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.click('[data-testid="login-button"]')
    
    // 4. 验证登录成功
    await expect(page.locator('[data-testid="user-avatar"]')).toBeVisible()

    // 5. 上传用户照片
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles({
      name: 'test-image.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake image content')
    })

    // 6. 等待上传完成
    await expect(page.locator('[data-testid="upload-success"]')).toBeVisible()

    // 7. 选择眼镜框架
    await page.click('[data-testid="frame-selector"]')
    await page.click('[data-testid="frame-item"]:first-child')

    // 8. 开始试戴
    await page.click('[data-testid="try-on-button"]')

    // 9. 等待试戴结果
    await expect(page.locator('[data-testid="try-on-result"]')).toBeVisible({ timeout: 30000 })

    // 10. 验证结果显示
    await expect(page.locator('[data-testid="result-image"]')).toBeVisible()
    await expect(page.locator('[data-testid="download-button"]')).toBeVisible()
  })

  test('free user hits usage limit', async ({ page }) => {
    // 登录免费用户
    await page.goto('/login')
    await page.fill('[data-testid="email-input"]', 'free@example.com')
    await page.click('[data-testid="login-button"]')

    // 检查使用限制
    await page.goto('/dashboard')
    const usageText = await page.locator('[data-testid="usage-counter"]').textContent()
    expect(usageText).toContain('5') // 免费用户限制

    // 尝试多次试戴直到达到限制
    for (let i = 0; i < 6; i++) {
      await page.goto('/try-on')
      
      // 上传图片
      const fileInput = page.locator('input[type="file"]')
      await fileInput.setInputFiles({
        name: 'test-image.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('fake image content')
      })

      // 选择框架
      await page.click('[data-testid="frame-item"]:first-child')
      await page.click('[data-testid="try-on-button"]')

      if (i < 5) {
        // 前5次应该成功
        await expect(page.locator('[data-testid="try-on-result"]')).toBeVisible()
      } else {
        // 第6次应该显示升级提示
        await expect(page.locator('[data-testid="upgrade-prompt"]')).toBeVisible()
      }
    }
  })

  test('premium user has unlimited access', async ({ page }) => {
    // 登录premium用户
    await page.goto('/login')
    await page.fill('[data-testid="email-input"]', 'premium@example.com')
    await page.click('[data-testid="login-button"]')

    // 验证premium状态
    await page.goto('/dashboard')
    await expect(page.locator('[data-testid="premium-badge"]')).toBeVisible()
    
    const usageText = await page.locator('[data-testid="usage-counter"]').textContent()
    expect(usageText).toContain('无限制')

    // 验证可以访问premium框架
    await page.goto('/frames')
    await expect(page.locator('[data-testid="premium-frame"]')).toBeVisible()
  })

  test('payment flow works correctly', async ({ page }) => {
    // 登录免费用户
    await page.goto('/login')
    await page.fill('[data-testid="email-input"]', 'free@example.com')
    await page.click('[data-testid="login-button"]')

    // 访问定价页面
    await page.goto('/pricing')
    await expect(page.locator('[data-testid="pricing-plans"]')).toBeVisible()

    // 点击升级按钮
    await page.click('[data-testid="upgrade-premium"]')

    // 验证支付表单
    await expect(page.locator('[data-testid="payment-form"]')).toBeVisible()
    
    // 填写测试支付信息
    await page.fill('[data-testid="card-number"]', '4242424242424242')
    await page.fill('[data-testid="card-expiry"]', '12/25')
    await page.fill('[data-testid="card-cvc"]', '123')

    // 提交支付
    await page.click('[data-testid="submit-payment"]')

    // 验证支付成功
    await expect(page.locator('[data-testid="payment-success"]')).toBeVisible()
    
    // 验证用户状态更新
    await page.goto('/dashboard')
    await expect(page.locator('[data-testid="premium-badge"]')).toBeVisible()
  })

  test('responsive design works on mobile', async ({ page }) => {
    // 设置移动端视口
    await page.setViewportSize({ width: 375, height: 667 })

    // 验证移动端导航
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible()
    
    // 打开移动菜单
    await page.click('[data-testid="mobile-menu-button"]')
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible()

    // 验证移动端试戴流程
    await page.click('text=开始试戴')
    
    // 验证移动端上传界面
    await expect(page.locator('[data-testid="mobile-upload"]')).toBeVisible()
    
    // 验证移动端框架选择
    await page.goto('/frames')
    await expect(page.locator('[data-testid="mobile-frame-grid"]')).toBeVisible()
  })

  test('error handling works correctly', async ({ page }) => {
    // 测试网络错误处理
    await page.route('**/api/frames', route => route.abort())
    
    await page.goto('/frames')
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible()

    // 测试重试功能
    await page.unroute('**/api/frames')
    await page.click('[data-testid="retry-button"]')
    await expect(page.locator('[data-testid="frame-grid"]')).toBeVisible()
  })

  test('accessibility features work', async ({ page }) => {
    // 验证键盘导航
    await page.keyboard.press('Tab')
    await expect(page.locator(':focus')).toBeVisible()

    // 验证ARIA标签
    const uploadButton = page.locator('[data-testid="upload-button"]')
    await expect(uploadButton).toHaveAttribute('aria-label')

    // 验证颜色对比度（通过检查CSS）
    const primaryButton = page.locator('[data-testid="primary-button"]')
    const styles = await primaryButton.evaluate(el => getComputedStyle(el))
    // 这里可以添加更多的可访问性检查
  })

  test('performance meets requirements', async ({ page }) => {
    // 测试页面加载性能
    const startTime = Date.now()
    await page.goto('/')
    const loadTime = Date.now() - startTime
    
    expect(loadTime).toBeLessThan(3000) // 页面加载应在3秒内

    // 测试API响应时间
    const apiStartTime = Date.now()
    const response = await page.request.get('/api/frames')
    const apiTime = Date.now() - apiStartTime
    
    expect(response.status()).toBe(200)
    expect(apiTime).toBeLessThan(500) // API响应应在500ms内
  })
})
