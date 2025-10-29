# 第 2 阶段测试指南

## 🧪 快速测试

### 1. 测试 API 端点

使用 curl 或 Postman 测试以下端点：

```bash
# 获取所有眼镜型号
curl http://localhost:3000/api/glasses/frames

# 获取所有品牌
curl http://localhost:3000/api/glasses/brands

# 获取所有类别
curl http://localhost:3000/api/glasses/categories

# 获取所有脸型
curl http://localhost:3000/api/glasses/face-shapes
```

### 2. 测试动态页面

#### 产品页面
```
http://localhost:3000/try/rayban-rx5121
http://localhost:3000/try/oliver-peoples-finley
http://localhost:3000/try/tom-ford-ft5873
```

#### 脸型页面
```
http://localhost:3000/style/round
http://localhost:3000/style/oval
http://localhost:3000/style/square
```

#### 类别页面
```
http://localhost:3000/category/prescription
http://localhost:3000/category/sunglasses
http://localhost:3000/category/designer
```

#### 品牌页面
```
http://localhost:3000/brand/rayban
http://localhost:3000/brand/oliver-peoples
http://localhost:3000/brand/tom-ford
```

---

## 🔍 SEO 验证

### 1. 检查 Meta 标签

在浏览器中打开任何动态页面，查看页面源代码：

```html
<!-- 应该包含以下 meta 标签 -->
<title>Ray-Ban RX5121 Virtual Try-On | Find Your Perfect Fit | VisuTry</title>
<meta name="description" content="Try on Ray-Ban RX5121 glasses virtually...">
<meta property="og:title" content="...">
<meta property="og:description" content="...">
<meta property="og:image" content="...">
<meta name="twitter:card" content="summary_large_image">
```

### 2. 检查结构化数据

在浏览器开发者工具中查看页面源代码，应该包含：

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Ray-Ban RX5121",
  "description": "...",
  "image": "...",
  "brand": {
    "@type": "Brand",
    "name": "Ray-Ban"
  },
  "offers": {
    "@type": "Offer",
    "price": "149.99",
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock"
  }
}
```

### 3. 使用 Google 工具验证

1. **Google Search Console**
   - 提交 sitemap: `https://visutry.com/sitemap.xml`
   - 检查索引状态

2. **Google Rich Results Test**
   - 访问: https://search.google.com/test/rich-results
   - 输入页面 URL
   - 验证结构化数据

3. **Schema.org 验证**
   - 访问: https://validator.schema.org/
   - 输入页面 URL
   - 检查错误

---

## 📊 性能测试

### 1. 使用 Lighthouse

```bash
# 安装 Lighthouse CLI
npm install -g @lhci/cli@latest lighthouse

# 运行测试
lighthouse http://localhost:3000/try/rayban-rx5121 --view
```

### 2. 检查关键指标

- **LCP (Largest Contentful Paint)**: < 2.5 秒
- **FID (First Input Delay)**: < 100 ms
- **CLS (Cumulative Layout Shift)**: < 0.1

### 3. 使用 WebPageTest

访问: https://www.webpagetest.org/
输入页面 URL 进行详细分析

---

## 🔗 内部链接验证

### 检查清单

- [ ] 产品页面链接到脸型页面
- [ ] 产品页面链接到类别页面
- [ ] 产品页面链接到品牌页面
- [ ] 脸型页面链接到产品页面
- [ ] 类别页面链接到产品页面
- [ ] 品牌页面链接到产品页面
- [ ] 所有链接都是有效的（不返回 404）

---

## 🗺️ Sitemap 验证

### 1. 检查 Sitemap 内容

```bash
curl http://localhost:3000/sitemap.xml
```

应该包含：
- 32 个 URL（10 产品 + 7 脸型 + 10 类别 + 5 品牌）
- 正确的优先级
- 正确的更新频率

### 2. 验证 Sitemap 有效性

访问: https://www.xml-sitemaps.com/validate-xml-sitemap.html
输入 sitemap URL 进行验证

---

## 🐛 常见问题排查

### 问题 1: 页面返回 404

**原因**: 数据库中没有对应的数据

**解决方案**:
1. 检查数据库中是否有数据
2. 运行 `python3 verify_data.py` 验证数据
3. 检查 URL slug 是否正确

### 问题 2: Meta 标签不显示

**原因**: 页面使用客户端渲染

**解决方案**:
1. 检查 `generateMetadata()` 函数
2. 确保在服务器端生成 meta 标签
3. 使用 `next/head` 或 `next/metadata`

### 问题 3: 结构化数据无效

**原因**: JSON-LD 格式错误

**解决方案**:
1. 使用 Schema.org 验证工具
2. 检查 JSON 格式
3. 确保所有必需字段都存在

### 问题 4: 性能不达标

**原因**: 图片未优化或数据加载过多

**解决方案**:
1. 使用 Next.js Image 组件
2. 实现图片懒加载
3. 减少初始数据加载

---

## 📋 测试报告模板

```markdown
# 测试报告 - [日期]

## API 端点测试
- [ ] /api/glasses/frames - 通过
- [ ] /api/glasses/brands - 通过
- [ ] /api/glasses/categories - 通过
- [ ] /api/glasses/face-shapes - 通过

## 动态页面测试
- [ ] /try/[brand]-[model] - 通过
- [ ] /style/[faceShape] - 通过
- [ ] /category/[category] - 通过
- [ ] /brand/[brand] - 通过

## SEO 验证
- [ ] Meta 标签正确
- [ ] 结构化数据有效
- [ ] 内部链接正确
- [ ] Sitemap 完整

## 性能测试
- [ ] LCP < 2.5s
- [ ] FID < 100ms
- [ ] CLS < 0.1

## 问题和建议
- ...

## 签名
- 测试人员: [名字]
- 日期: [日期]
- 状态: [通过/失败]
```

---

## 🚀 自动化测试

### 使用 Jest 进行单元测试

```bash
npm run test:unit
```

### 使用 Playwright 进行 E2E 测试

```bash
npm run test:e2e:playwright
```

### 使用 Lighthouse CI 进行性能测试

```bash
npm install -g @lhci/cli@latest
lhci autorun
```

---

## 📞 获取帮助

如有问题，请参考：
1. `PHASE_2_PLAN.md` - 详细计划
2. `PHASE_2_WEEK_1_COMPLETE.md` - 完成总结
3. 代码注释和文档


