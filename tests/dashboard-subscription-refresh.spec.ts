import { test, expect } from '@playwright/test';

/**
 * 测试 Dashboard 订阅状态在页面刷新后的一致性
 * 
 * 问题：用户登录后首次访问 dashboard 显示正确的订阅信息，
 * 但刷新页面后显示为免费用户
 * 
 * 根本原因：Dashboard 使用 getCachedUserData 覆盖 session.user 数据，
 * 导致缓存不一致
 * 
 * 修复：使用 session.user 作为唯一数据源
 */

test.describe('Dashboard Subscription Status Consistency', () => {
  test('should maintain subscription status after page refresh', async ({ page }) => {
    // 1. 访问应用首页
    await page.goto('https://visutry.vercel.app/');
    
    // 2. 等待页面加载
    await page.waitForLoadState('networkidle');
    
    // 3. 点击登录按钮
    const loginButton = page.locator('text=Sign In').or(page.locator('text=Login')).first();
    await loginButton.click();
    
    // 4. 等待跳转到登录页面
    await page.waitForURL('**/auth/signin**', { timeout: 10000 });
    
    console.log('已到达登录页面，请手动完成 Twitter 登录...');
    console.log('测试将等待跳转到 dashboard 页面...');
    
    // 5. 等待用户手动登录并跳转到 dashboard
    // 给用户 2 分钟时间完成 Twitter OAuth 登录
    await page.waitForURL('**/dashboard**', { timeout: 120000 });
    
    console.log('已登录并到达 dashboard 页面');
    
    // 6. 等待页面完全加载
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // 额外等待确保所有异步组件加载完成
    
    // 7. 检查订阅卡片是否存在
    const subscriptionCard = page.locator('text=Subscription').or(page.locator('text=Premium')).or(page.locator('text=Free Trial'));
    await expect(subscriptionCard).toBeVisible({ timeout: 10000 });
    
    // 8. 截图记录首次访问的状态
    await page.screenshot({ path: 'test-results/dashboard-first-visit.png', fullPage: true });
    
    // 9. 检查是否显示 Premium 状态
    const isPremiumFirstVisit = await page.locator('text=Premium').or(page.locator('text=Standard')).count() > 0;
    const isFreeFirstVisit = await page.locator('text=Free Trial').count() > 0;
    
    console.log('首次访问状态:');
    console.log('  - Premium/Standard:', isPremiumFirstVisit);
    console.log('  - Free Trial:', isFreeFirstVisit);
    
    // 10. 刷新页面
    console.log('刷新页面...');
    await page.reload();
    
    // 11. 等待页面重新加载
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // 额外等待确保所有异步组件加载完成
    
    // 12. 截图记录刷新后的状态
    await page.screenshot({ path: 'test-results/dashboard-after-refresh.png', fullPage: true });
    
    // 13. 再次检查订阅状态
    const isPremiumAfterRefresh = await page.locator('text=Premium').or(page.locator('text=Standard')).count() > 0;
    const isFreeAfterRefresh = await page.locator('text=Free Trial').count() > 0;
    
    console.log('刷新后状态:');
    console.log('  - Premium/Standard:', isPremiumAfterRefresh);
    console.log('  - Free Trial:', isFreeAfterRefresh);
    
    // 14. 验证状态一致性
    expect(isPremiumAfterRefresh).toBe(isPremiumFirstVisit);
    expect(isFreeAfterRefresh).toBe(isFreeFirstVisit);
    
    // 15. 如果是 Premium 用户，验证关键信息仍然存在
    if (isPremiumFirstVisit) {
      // 应该能看到订阅类型（月费或年费）
      const hasSubscriptionInfo = await page.locator('text=/month|year/i').count() > 0;
      expect(hasSubscriptionInfo).toBeTruthy();
      console.log('✅ Premium 订阅信息在刷新后仍然正确显示');
    }
    
    // 16. 再次刷新测试（确保多次刷新也稳定）
    console.log('第二次刷新页面...');
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // 17. 第三次检查
    const isPremiumSecondRefresh = await page.locator('text=Premium').or(page.locator('text=Standard')).count() > 0;
    const isFreeSecondRefresh = await page.locator('text=Free Trial').count() > 0;
    
    console.log('第二次刷新后状态:');
    console.log('  - Premium/Standard:', isPremiumSecondRefresh);
    console.log('  - Free Trial:', isFreeSecondRefresh);
    
    // 18. 最终验证
    expect(isPremiumSecondRefresh).toBe(isPremiumFirstVisit);
    expect(isFreeSecondRefresh).toBe(isFreeFirstVisit);
    
    console.log('✅ 测试通过：订阅状态在多次刷新后保持一致');
  });
  
  test('should display correct subscription details', async ({ page }) => {
    // 访问 dashboard（假设已登录）
    await page.goto('https://visutry.vercel.app/dashboard');
    await page.waitForLoadState('networkidle');
    
    // 检查页面标题
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
    
    // 检查订阅卡片存在
    const subscriptionSection = page.locator('text=Subscription').or(page.locator('text=Premium')).or(page.locator('text=Free Trial'));
    await expect(subscriptionSection).toBeVisible({ timeout: 10000 });
    
    // 截图
    await page.screenshot({ path: 'test-results/dashboard-subscription-details.png', fullPage: true });
    
    console.log('✅ Dashboard 订阅详情显示正常');
  });
});

