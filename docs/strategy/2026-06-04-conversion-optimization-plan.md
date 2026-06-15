# VisuTry 转化优化方案

**日期**: 2026-06-04

**背景**: 基于 Chrome 浏览器逐页审查 visutry.com 关键页面（首页、Pricing、试戴流程、支付回跳），结合代码分析和用户行为证据（3 个真实付费用户均购买 $2.99 Credits Pack），提出从流量到付费转化的端到端改进方案。

**目标**: 让用户从首次进入网站到完成付费的路径更短、阻力更小、引导更清晰。

---

## 1. 核心发现：付费用户画像

生产数据确认：3 个非测试付费用户全部购买 $2.99 Credits Pack，而非订阅。使用行为高度集中在**眼镜试戴**场景。两类典型 persona：

- **多镜框比较者**: 尝试多个品牌/款式（如 Gucci, Versace, Tom Ford），单次购买后消耗 16+ credits
- **单镜框验证者**: 上传特定产品截图或邮件图片，针对同一个镜框试戴 1-3 次确认效果

结论：转化优化的核心路径是 **首页 → 眼镜试戴 → 购买 Credits Pack**，不是订阅。

---

## 2. 页面级问题与改进方案

### 2.1 首页

#### 问题

- **Hero 口号太泛**: "Find Your Perfect Style" 没有传递出卖点。用户不关心"找到风格"，关心的是"用截图就能试戴眼镜、比较镜框"。
- **Credits Pack 完全埋没**: $2.99 的价格点和"一次购买、永不过期"的核心卖点在首页完全看不到，用户必须点进 Pricing 页面才能了解。
- **社交证明薄弱**: 仅有一条 "Ethan" 评价，缺乏说服力和真实感。
- **免费试用提示缺失**: 1 次免费试用的额度没有在首页强调，用户不知道可以先试再买。

#### 改进方案

1. **重构 Hero**:
   - 标题改为直接描述价值的主张，例如 *Try on any glasses from a product photo or screenshot*
   - 或用更接近转化导向的标题: *Compare frames from your own screenshots — USD 2.99 for 30 try-ons*

2. **首页增加 Credits Pack 曝光**:
   - 在 Hero 区域下方添加价格条幅
   - 在 CTA 按钮组中增加 "Buy Credits" 按钮（对已登录用户）
   - 在页脚或引导步骤区域放一次性的信用包卡片

3. **增加社交证明**:
   - 增加多条简短评价（尤其是关于"用截图试戴框架"的场景）
   - 可考虑显示"已有 X 次试戴"或"X 个用户"的统计数字

4. **免费试用提示**:
   - 在 CTA 按钮或紧接着的区域显示 *Try 1 for free — then continue with credits*

### 2.2 Pricing 页面

#### 问题

- **埋得太深**: 导航栏第 5 项才是 Pricing，用户从首页进入需要多次点击。
- **顶部条幅不可点击**: "Continue with 30 AI try-ons for USD 2.99" 是纯文本，不是链接。
- **缺少免费试用 -> 付费的平滑过渡**: 用户用完 1 次免费额度后，没有自然的购买引导。

#### 改进方案

1. **首页加 Credit Pack 入口**（已在上文提到），使用户不需要主动找 Pricing 页面。
2. **Pricing 页顶部条幅改为可点击**，直接链接到 Stripe Checkout / 创建支付会话的入口。
3. **在试戴流程中嵌入 Pricing 卡片**: 配额用完后，在试戴页面直接展示 Credits Pack 卡片并附带 Buy 按钮，不需要跳转到 Pricing 页面。

### 2.3 试戴流程 (TryOnInterface)

#### 问题

- **结果页无升级引导**: 试戴成功生成结果后，没有后续提示去购买 Credits。
- **配额耗尽无购买 CTA**: 当 `hasQuota = false` 时，仅显示 `type: 'quota'` 的错误状态，没有购买按钮。
- **未登录流程断裂**: 用户如果未登录，点击"Start Try-On"后页面检测 session 为 null 后的处理不完善，用户不知道该去哪里登录。

#### 改进方案

1. **试戴成功后的升级引导**:
   - 在 ResultDisplay 组件中，当试戴成功时，显示一条非侵入式横幅：*Continue with 30 try-ons for USD 2.99. Your credits never expire.* 附带 Buy 按钮。

2. **配额耗尽的购买引导**:
   - 在当前 `error state` 的 `type: 'quota'` 分支中，替换为带 CTA 的提示卡片，显示 Credits Pack 的简要信息和 Buy Now 按钮。

3. **未登录用户的引导**:
   - 在 TryOnInterface 中检测到未登录时，显示 "Sign in to try on glasses" 的提示，附带 Login 按钮，登录后自动回到当前试戴页。

4. **保留试戴历史**: 未登录用户试戴结果可通过 cookie/session ID 临时保存，引导登录后关联到用户账号。

### 2.4 支付后体验

#### 问题

- **额度不即时刷新**: 支付成功后跳转到 `/dashboard?payment=success`，Dashboard 显示 Remaining Uses 和 Try-ons Used 没有更新，`/payments` 页面的 Credits Balance 也滞后。

#### 根因

Dashboard 的统计数据来源：
```
DashboardStatsAsync 依赖 session.user 中的字段:
- user.remainingTrials
- user.creditsPurchased
- user.creditsUsed
- user.premiumUsageCount

Payments 页面也直接从 session.user 读取 credits 数据。
```

支付成功后 webhook 调用了 `clearUserCache(userId)`，但：
1. 这只清除了后端缓存
2. 前端 session token 中的 quota 字段没有同步更新
3. `PaymentSuccessHandler` 组件调用 `update()` 刷新 session，但实测中 token 内的 quota 字段可能没有被正确刷新

#### 改进方案

1. **确保 webhook 处理后 session token 刷新**:
   - 在 PaymentSuccessHandler 中调用 `update()` 后，强制从后端重新查询用户数据而非只依赖 token 中的字段。
   - 或：在 webhook 处理逻辑中，确保更新用户数据后生成的 token 包含最新的 quota 值。

2. **Dashboard/Payments 页增加保底查询**:
   - 当 session 数据与后端明显不一致时（如 payment=success 参数存在），自动触发一次用户数据 API 查询。

3. **短期修复**：
   - 在 `PaymentSuccessHandler` 中除了 `update()`，增加一个额外的 api 调用 `/api/user/quota` 来拉取最新额度，并直接更新 UI state。

---

## 3. 技术实现要点

### 3.1 TryOnInterface 的修改

```
TryOnInterface.tsx 主要修改点:

1. 成功试戴后 (setResult 分支):
   - 在当前 result 区域下方/旁边增加 Credits 升级横幅
   - 条件: 仅当用户已登录且非 premium 时显示

2. quota error 时:
   - 将 error type 'quota' 的处理改为展示购买卡片
   - 卡片内容: Credits Pack 名称 / 价格 / 购买按钮

3. 未登录时:
   - 在上传区域上方显示登录提醒
   - "Sign in to start trying on glasses" + Login 按钮
```

### 3.2 支付同步修复

```
PaymentSuccessHandler 或下一个页面加载逻辑:

1. 检测 URL 参数 ?payment=success
2. 调用 session.update()
3. 额外调用 /api/user/quota 获取最新额度
4. 将返回的数据设置到本地 state，覆盖 session 中的旧值
```

### 3.3 首页 Hero 重构

修改文件：`src/app/[locale]/(main)/page.tsx`（或对应的客户端组件）

- 替换 Hero 标题文案
- 在 Steps 下方/旁边添加 "Start with 1 free try-on" 部分的提示
- 在页面底部的 Feature 区域前增加 Credits Pack 卡片

---

## 4. 优先级与排序

| 优先级 | 项目 | 预计工程时间 | 影响面 |
|--------|------|------------|--------|
| P0 | 修复支付后额度不刷新 | 2-4h | 直接阻断付费转化 |
| P0 | 试戴成功/额度耗尽增加购买引导 | 4-6h | 直接影响 Conversion Rate |
| P0 | 未登录试戴平滑过渡 | 2-3h | 减少用户流失 |
| P0 | 首页 Hero + Credits 入口 | 3-5h | 提升首屏吸引力 |
| P1 | Pricing 页面条幅可点击 | 1h | 小优化 |
| P1 | i18n 翻译 Dashboard / TryOn / 支付页 | 6-8h | 国际化用户 |
| P2 | 社交证明增加 | 2-3h | 长期信任建设 |

---

## 5. 验证方法

每个改动完成后：
1. 本地 `npm run dev` 验证 UI 效果
2. `npm run build` 确保无 TypeScript / lint 错误
3. 通过 Chrome 浏览器查看改动后的页面加载和流程
4. 模拟 Stripe webhook 触发后，检查 Dashboard 和 Payments 页面数据更新

---

## 6. 相关文档

- [`2026-05-25-paid-customer-seo-geo-relaunch-plan.md`](/Users/yesun/Code/visutry/docs/strategy/2026-05-25-paid-customer-seo-geo-relaunch-plan.md) — 付费用户画像和 SEO/GEO 重启计划
- [`2026-05-25-b2b-commerce-commercialization-roadmap.md`](/Users/yesun/Code/visutry/docs/strategy/2026-05-25-b2b-commerce-commercialization-roadmap.md) — B2B 商业化路线图
- Pricing 配置: [`src/config/pricing.ts`](/Users/yesun/Code/visutry/src/config/pricing.ts)
- 试戴主组件: [`src/components/try-on/TryOnInterface.tsx`](/Users/yesun/Code/visutry/src/components/try-on/TryOnInterface.tsx)
