# 📊 VisuTry Programmatic SEO KPI 和监控指南

**版本 1.0 | 关键指标和追踪方法**

---

## 🎯 核心 KPI

### 1. 索引指标

| 指标 | 目标 | 检查方式 | 频率 |
|------|------|---------|------|
| **索引页面数** | 1000+ | GSC Coverage | 每周 |
| **索引率** | > 90% | GSC Coverage | 每周 |
| **抓取错误** | < 5 | GSC Crawl Stats | 每周 |
| **404 错误** | < 10 | GSC Coverage | 每周 |

**检查方法**：
1. 登录 Google Search Console
2. 进入 Coverage 报告
3. 查看 "Valid" 和 "Excluded" 页面数
4. 记录到追踪表

---

### 2. 流量指标

| 指标 | 目标 | 检查方式 | 频率 |
|------|------|---------|------|
| **月访问量** | 10,000+ | GA4 | 每周 |
| **新用户** | 5,000+ | GA4 | 每周 |
| **页面浏览量** | 20,000+ | GA4 | 每周 |
| **平均停留时长** | > 1:30 | GA4 | 每周 |
| **跳出率** | < 60% | GA4 | 每周 |

**GA4 设置**：
```
报告 → 获取 → 流量来源 → 自然搜索
报告 → 参与度 → 页面和屏幕
报告 → 转化 → 所有转化
```

---

### 3. 排名指标

| 指标 | 目标 | 检查方式 | 频率 |
|------|------|---------|------|
| **Top 10 关键词** | 5+ | GSC/Ahrefs | 每两周 |
| **Top 50 关键词** | 20+ | GSC/Ahrefs | 每两周 |
| **平均排名** | < 30 | Ahrefs | 每月 |
| **关键词覆盖** | 300+ | Ahrefs | 每月 |

**GSC 排名追踪**：
```
Performance → 查询
按 "平均排名" 排序
导出数据到 Excel
```

---

### 4. 转化指标

| 指标 | 目标 | 检查方式 | 频率 |
|------|------|---------|------|
| **试戴点击率** | > 3% | GA4 事件 | 每周 |
| **注册转化率** | > 2% | GA4 转化 | 每周 |
| **付费转化率** | > 0.5% | GA4 转化 | 每周 |
| **平均订单价值** | $50+ | GA4 电商 | 每月 |

**GA4 事件设置**：
```javascript
// 试戴点击
gtag('event', 'try_on_click', {
  page_path: window.location.pathname,
  frame_id: frameId,
})

// 注册
gtag('event', 'sign_up', {
  method: 'email',
})

// 购买
gtag('event', 'purchase', {
  value: amount,
  currency: 'USD',
})
```

---

### 5. 性能指标

| 指标 | 目标 | 检查方式 | 频率 |
|------|------|---------|------|
| **LCP** | < 2.5s | PageSpeed Insights | 每周 |
| **FID** | < 100ms | PageSpeed Insights | 每周 |
| **CLS** | < 0.1 | PageSpeed Insights | 每周 |
| **页面大小** | < 3MB | DevTools | 每周 |

**检查方法**：
1. 访问 PageSpeed Insights
2. 输入页面 URL
3. 查看 Core Web Vitals
4. 记录分数

---

## 📈 追踪仪表板

### 每周报告模板

```markdown
# 周报 - 第 X 周

## 索引进度
- 索引页面数：XXX
- 索引率：XX%
- 新增索引：XX

## 流量数据
- 周访问量：XXX
- 新用户：XXX
- 平均停留时长：X:XX
- 跳出率：XX%

## 排名进度
- Top 10 关键词：X
- Top 50 关键词：X
- 新增排名关键词：X

## 转化数据
- 试戴点击：XXX
- 试戴转化率：X%
- 注册数：XX
- 付费转化：X

## 性能指标
- LCP：X.Xs
- FID：Xms
- CLS：X.X

## 问题和优化
- [ ] 问题 1
- [ ] 问题 2
- [ ] 优化建议 1
- [ ] 优化建议 2

## 下周计划
- [ ] 任务 1
- [ ] 任务 2
```

---

## 🔍 监控工具设置

### 1. Google Search Console

**必须配置**：
- [ ] 验证网站所有权
- [ ] 提交 sitemap
- [ ] 配置首选域
- [ ] 设置地理位置
- [ ] 启用移动友好性报告

**定期检查**：
- Coverage 报告（每周）
- Performance 报告（每周）
- Crawl Stats（每周）
- Mobile Usability（每月）

### 2. Google Analytics 4

**必须配置**：
- [ ] 创建 GA4 属性
- [ ] 配置数据流
- [ ] 设置转化事件
- [ ] 配置受众
- [ ] 启用 Google Ads 链接

**关键报告**：
- 实时报告（每天）
- 获取报告（每周）
- 参与度报告（每周）
- 转化报告（每周）

### 3. Vercel Analytics

**配置**：
```typescript
// next.config.js
module.exports = {
  analytics: {
    enabled: true,
  },
}
```

**监控**：
- 页面访问量
- 加载时间
- 用户地理位置
- 浏览器类型

### 4. Ahrefs（可选）

**功能**：
- 关键词排名追踪
- 竞争对手分析
- 反向链接监控
- 内容差距分析

---

## 📊 数据收集和分析

### 每周数据收集清单

```
周一：
- [ ] 导出 GSC 数据
- [ ] 导出 GA4 数据
- [ ] 检查 PageSpeed Insights

周三：
- [ ] 分析排名变化
- [ ] 识别高流量页面
- [ ] 识别低表现页面

周五：
- [ ] 生成周报
- [ ] 制定优化计划
- [ ] 更新追踪表
```

### 数据分析模板

```sql
-- 高流量页面
SELECT 
  page_path,
  COUNT(*) as views,
  AVG(session_duration) as avg_duration,
  SUM(conversions) as total_conversions
FROM analytics
WHERE date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
GROUP BY page_path
ORDER BY views DESC
LIMIT 20

-- 低表现页面
SELECT 
  page_path,
  COUNT(*) as views,
  AVG(bounce_rate) as avg_bounce_rate
FROM analytics
WHERE date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
  AND views < 10
GROUP BY page_path
ORDER BY avg_bounce_rate DESC
```

---

## 🎯 阶段性目标

### 第 2 周末
- [ ] 数据库完成
- [ ] 后台管理完成
- [ ] 基础 SEO 配置完成

### 第 4 周末
- [ ] 关键词研究完成
- [ ] 页面设计确定
- [ ] 内部链接规划完成

### 第 8 周末
- [ ] 首批 100-200 页面上线
- [ ] 索引率 > 50%
- [ ] 初始流量 100+ 周访问

### 第 12 周末
- [ ] 300-500 页面上线
- [ ] 索引率 > 80%
- [ ] 流量 1,000+ 周访问
- [ ] Top 50 关键词 5+

### 第 16 周末
- [ ] 1000+ 页面上线
- [ ] 索引率 > 90%
- [ ] 流量 2,000+ 周访问
- [ ] Top 10 关键词 3+

### 第 24 周末
- [ ] 流量 10,000+ 月访问
- [ ] Top 10 关键词 10+
- [ ] 转化率 > 2%

---

## 🚨 告警阈值

| 指标 | 告警阈值 | 行动 |
|------|---------|------|
| 索引率 < 50% | 检查 robots.txt 和 sitemap |
| 404 错误 > 10 | 修复链接和重定向 |
| 跳出率 > 70% | 改进页面内容和 UX |
| LCP > 3s | 优化页面加载速度 |
| 流量下降 > 20% | 检查排名变化和索引问题 |

---

## 📝 相关文档

- [执行计划](./programmatic-seo-execution-plan.md)
- [技术实现指南](./programmatic-seo-technical-guide.md)
- [数据准备指南](./data-preparation-guide.md)


