---
description: 如何处理商业/代理咨询 (How to process business or reseller inquiries)
---

当收到来自 `support@visutry.com` 的潜在客户或合作伙伴询盘时，请遵循以下标准化流程：

### 0. 我们的核心价值观与对话基调 (Core Identity)

在与所有外部潜在合作伙伴（Leads）沟通时，除了遵循 "Be nice, be simple" 的语感，处理逻辑和所传达的品牌底色必须体现以下四点：
1. **敏捷精益，拒绝官僚 (Agile & Lean)**：我们是一个小而精的 AI 原生团队，沟通极其直白、灵活迭代，没有笨重 SaaS 大厂那些让人疲惫的套话。
2. **亲兄弟，明算账 (Warm Partners, Cold Numbers)**：待人极度友善，追求开放共赢，但在商业利益切割、毛利底线和定价规则上极度清晰、毫不含糊，坚守双赢生态的纪律。
3. **具有极强主张的专业度 (Enterprise-grade Professionality)**：团队虽小，但我们在底层技术集成、成本建模和合规排雷上的要求与全球顶流 SaaS 公司完全对齐。
4. **面向未来 (Future-oriented)**：让合伙人感受到，与我们合作不仅仅是买一层 API 倒卖，而是在共同布局下一代商业落地。

### 1. 邮件获取与过滤 (Fetch & Filter)
- 使用 IMAP 工具获取最近邮件。
- 过滤掉来自 `Axiom` (告警)、`Exmail` (系统通知) 的干扰邮件。
- 识别真实的人类询盘，并提取关键需求点（地区、商业模式、数量级）。

### 2. 成本与毛利校验 (Cost & Margin Assessment)
- 查阅 `docs/strategy/reseller-and-cost-model.md` 获取最新的单位成本。
- **核心校验规则**:
    - 如果客户提出大幅折扣（目标价 < $0.05/次），**必须**建议将技术路径限制在 `GrsAi Nano-Banana-Fast`。
    - 禁止在代理批发价中包含 `Gemini` 路径，除非对方接受 $0.06/次以上的溢价。

### 3. CRM 录入 (CRM Logging)
- 将客户信息录入 `docs/crm/leads.md`。
- **必填项**: 日期、公司/团队、联系人、岗位、发件人邮箱、地区、特定需求摘要。
- 初始状态设置为 `🟡 待回复`。

### 4. 阶梯式回复策略 (Staged Response Strategy)

**严禁在首封邮件抛出价格。** 遵循以下 **"Be nice, be simple"** 的回复逻辑，抛弃冗长的企业级套话，用极其简短、友善、直白的方式沟通。

*   **Stage 1: 发现与背调 (Discovery & KYC)**：
    *   **话术目标 (Be nice, be simple)**：创始人亲自回复，语气友善、轻松、直奔主题，把对方当成潜在长期合作伙伴而不是被推销对象。
    *   **关键问题** (极简问题，以便对方快速作答)：
        1. 了解其背景资源（是否已有连接店面或平台的渠道）。
        2. 确认其初期测试或合作的规模。
        3. **合规必备**：直接且礼貌地要求对方提供正式公司实体名称（Legal Entity Name），这是进行国际合作合规筛查 (KYC / 制裁排查) 的标准程序。
    *   **成熟度暗示**：告知我们拥有一套完善灵活的利润保护体系（但不透露数字），留足悬念。
*   **Stage 2: 资质校验 (Qualification)**：根据 Stage 1 的回复和 KYC 筛查结果，评估其分销能力。
*   **Stage 3: 灵活方案选择 (Proposal)**：
    *   根据其风险承受能力，提供“**灵活报备返佣**”（零成本入门）或“**批发预付点数**”（高利润回报）的选择。
    *   明确隐私红线（无法查看用户照片）和技术限定（Nano Banana Fast）。

### 5. 服务等级与签署 (SLA & Signature)
- **标准支持**: 邮件/官网工单，24-48小时响应。
- **专业支持 (Plan B)**: WhatsApp/WeChat 专属群，4-12小时响应（门槛：采购额 > $500）。
- **标准署名**:
    - **Name**: Frank Sun
    - **Title**: Co-founder
    - **Entity**: VisuTry AI Labs

### 6. 沉淀商机知识
- 如果客户提出了新的需求（如新的地区合规要求），应更新 `docs/strategy/reseller-and-cost-model.md`。
