# VisuTry 公开促销与渠道价格对齐方案

日期：2026-03-12

## 1. 结论

当前最合理的调整方向不是继续维持公开 `2x credits` 促销，也不是立刻重新设计一整套复杂价格体系，而是先做一轮**最小、明确、可回滚**的收敛：

- 取消公开默认 `BOGO / 2x` 促销入口
- 官网公开价格恢复为标准价口径
- Promo 机制保留，但改为隐藏/定向使用
- 暂不公开长期 `5折` 或等效 `5折`
- 如需保留活动，对外最多采用**象征性轻促销**，例如 `9折` 或少量赠送，而不是 `2x`

这一步的目标不是追求短期转化，而是先恢复价格秩序、渠道解释力和品牌可信度。

## 2. 为什么要调整

### 2.1 当前公开活动已实质冲穿渠道价格

目前网站不是现金价直接 `5折`，而是**同价给 2x 配额**。商业结果等同于把单次有效价格腰斩：

- Credits Pack：`$2.99 / 30`，常规约 `~$0.10/次`
- Promo Credits Pack：`$2.99 / 60`，活动约 `~$0.05/次`
- Monthly：`$8.99 / 90`，常规约 `~$0.10/次`
- Promo Monthly：`$8.99 / 180`，活动约 `~$0.05/次`
- Yearly：`$89.99 / 1260`，常规约 `~$0.071/次`
- Promo Yearly：`$89.99 / 2520`，活动约 `~$0.0357/次`

这与当前代理商口径存在直接冲突：

- Gold：`$0.05 - $0.06`
- Platinum：`$0.03 - $0.04`

如果官网默认公开可拿到 `~$0.05/次`，Gold 渠道就几乎失去存在意义；如果年付 promo 等效 `~$0.0357/次`，甚至会逼近或冲击 Platinum 价格带。

### 2.2 当前 promo 不是“活动”，而是默认公开价格

目前 `BOGO` 不只是隐藏 code，而是通过公开入口被持续导流：

- 导航栏 Pricing 默认跳 `?code=BOGO`
- Try-on exhausted CTA 直接跳 `?code=BOGO`
- Promo banner 和 “Only a few 2x spots left” 文案持续公开显示

因此它不是“偶发 campaign”，而是用户理解中的常规公开价格。

### 2.3 当前活动没有带来明确效果

业务前提已经明确：C 端强促销没有显著效果。  
在此情况下继续公开 `2x`，属于同时承受三种成本：

- 损伤公开价格锚点
- 损伤代理渠道空间
- 让品牌显得缺乏价格纪律

## 3. 推荐方案

### 3.1 核心策略

采用以下口径：

1. 官网公开价恢复标准价
2. 默认不展示 `BOGO / VISU60 / SALE2024`
3. Promo 系统继续保留，但只用于：
   - 私下商务发放
   - 临时 campaign
   - 定向测试
4. 对外长期公开活动，如必须保留，只允许轻量形式：
   - `9折`
   - 加赠 10%-15%
   - 首次体验赠送少量 credits

### 3.2 不建议的方案

- 不建议继续公开默认 `2x`
- 不建议继续让导航直接带 promo code
- 不建议立刻重做所有产品和渠道价格结构
- 不建议一边公开 `2x`，一边继续按现有代理价对外沟通

## 4. 目标状态

调整后应形成以下统一理解：

- 官网公开价格：标准锚点
- 公开活动：轻促销或无促销
- Gold 渠道：明确优于官网公开价
- Platinum 渠道：只给深度合作，不被官网轻易触碰
- Promo code：特殊工具，不是默认价格入口

## 5. 范围盘点

以下内容后续改动时必须一并核对，避免只改一处造成漏改。

### 5.1 价格与 promo 配置

- `src/config/pricing.ts`
  - Promo 产品定义
  - Promo code 映射
  - 标准产品到 promo 产品的映射

### 5.2 Pricing 页面与展示逻辑

- `src/components/pricing/PricingSection.tsx`
  - 根据 promo code 切换套餐展示
- `src/components/pricing/PromoInput.tsx`
  - Promo 输入框与 banner
- `src/components/pricing/PricingCard.tsx`
  - 价格展示与 CTA

### 5.3 导流入口

- `src/components/layout/Header.tsx`
  - Pricing 链接默认是否带 `?code=BOGO`
- `src/components/try-on/TryOnInterface.tsx`
  - exhausted 状态 CTA 是否直接带 promo

### 5.4 支付链路

- `src/app/api/payment/create-session/route.ts`
  - 是否允许 promo product type 下单
- `src/lib/stripe.ts`
  - promo product 到 Stripe 的映射
- `src/app/api/payment/webhook/route.ts`
  - promo 额度到账逻辑
- `src/app/[locale]/(main)/payments/page.tsx`
  - promo 产品名展示

### 5.5 商务与渠道文档

- `docs/strategy/reseller-and-cost-model.md`
  - 官网公开价与代理价的自洽性
- `docs/promotion_launch_brief.md`
  - 旧促销说明是否需要归档或标记失效

### 5.6 测试与核对脚本

- `tests/scripts/verify_promo_logic.ts`
  - 若 promo 策略收缩，需要同步调整预期

## 6. 建议执行顺序

### Phase 1：先恢复价格秩序

目标：先让公开价格不再默认落入 `2x`。

动作：

1. 移除 Header 和 Try-on CTA 中默认附带的 `?code=BOGO`
2. 保留 PromoInput，但不主动高亮宣传
3. 收掉“Only a few 2x spots left”之类的公开紧迫文案

验收标准：

- 未输入 code 的普通访问用户，看到的是标准套餐
- 普通用户从导航和 try-on 页面进入 pricing，不会默认拿到 `2x`

### Phase 2：保留 promo 作为隐藏能力

目标：不删系统能力，但不让它成为公开价格。

动作：

1. 保留 promo product type
2. 保留 promo code 解析能力
3. 仅在需要时私下分发 code

验收标准：

- 指定 code 仍可生效
- 未带 code 的公开用户不会进入 promo 套餐

### Phase 3：修正文档与商务口径

目标：让公开价格、商务文档、渠道话术一致。

动作：

1. 修订 `docs/strategy/reseller-and-cost-model.md`
2. 标注或归档旧促销文档
3. 确认当前对外商务说法：
   - 官网公开价是什么
   - Gold / Platinum 分别怎么谈

验收标准：

- 官网公开价不再冲突 Gold 价格带
- 渠道团队对外说法一致

## 7. 关键决策建议

当前建议采用以下决策：

- **公开默认 promo**：关闭
- **Promo 系统本身**：保留
- **公开活动强度**：从 `2x` 降到 `无活动` 或 `轻活动`
- **渠道口径**：以恢复后的官网标准价为基准重新核对

## 8. 风险提示

### 8.1 若只改前端入口，不改文档

会出现：

- 代码实际已恢复标准价
- 商务文档仍按旧 promo 逻辑理解
- 内外口径继续混乱

### 8.2 若只改文档，不改导流入口

会出现：

- 文档写标准价
- 用户仍通过默认链接拿到 promo
- 实际成交与文档继续冲突

### 8.3 若直接删除全部 promo 逻辑

风险是：

- 未来做定向活动失去工具
- 现有支付/记录链路需要额外清理

因此当前不建议直接彻底删除 promo 能力。

## 9. 当前建议的最小落地动作

后续第一轮实施，只做以下最小闭环：

1. 去掉默认 `?code=BOGO` 导流
2. 取消公开 `2x` banner/紧迫文案
3. 保留 promo code 系统
4. 更新渠道价格文档说明

这四步完成后，就能先把公开价格秩序恢复，同时保留后续灵活空间。
