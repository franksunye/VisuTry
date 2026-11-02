# VisuTry Consumer — 10× Growth Discovery 深度研究 V2

**研究时间：2026-11-02｜性质：市场与产品双向研究、反证与实验预注册｜状态：RESEARCH EXTENDED / NO 10× WINNER VALIDATED**  
**约束：** 不将已发布功能当作增长结果；不把 GSC 展示当作关键词市场搜索量；不凭零散 Reddit 帖子代表整体市场；不以 GA4 全站事件总数拼接个人漏斗；不改变免费 Detector 的端侧/隐私/CPU 边界；不释放付费 Face Analysis 个性化 Top Picks；不扰动 2026-11-01 已上线的 CTA 与品牌页面观察窗口。  
**归属：** 本文件是日期明确的 supporting research，不取代 GitHub `docs/strategy/analytics/gtm.md` 这个唯一的活动 GTM 策略，也不重启旧 1,000 页/批量外联计划。

## 0. 本轮增量发现（相对 V1.1）

1. **需求不是单一“脸型识别”，而是三层逐渐深入的任务：**（A）知道自己的脸型、（B）在大量选择中缩小到适合自己的框形、（C）确认某副**真实商品镜框**是否值得购买，包括是否太宽/太窄、镜梁与鼻托、照片中的实际效果和向朋友征询意见。站内 GSC 明确支持 A、B 及部分品牌 C；公开产品、专业购买指南和真实用户讨论为 C 提供定性外部证据，但没有 VisuTry 的相应付费 cohort 数据。
2. **两个新的负面竞争事实改变优先级：** 2026 市场已有 [Mirra](https://mirra.logicaleap.com/try) 的免注册、设备端、任意产品 URL 导入、按标称尺寸/PD 校准方案，以及 [SpecFit](https://specfit.app/) 的商品链接/TikTok 导入/免费 fit check。跨品牌、从任何商品链接试戴都不能继续当作“独占创新”。另一边 [GlassesOnMe](https://glassesonme.com/en/) 提供无账号免费低清图像试戴，很多单一体验比 VisuTry 首次注册路径更轻；但无真实品质/付费对比，不声明 VisuTry 弱或强。
3. **比较/信任问题比“再找一个免费功能”更值得研究。** [Reddit 2026-02 真实选镜讨论](https://www.reddit.com/r/glasses/comments/1qzft1i/does_anyone_else_struggle_with_choosing_glasses/) 讨论单副逐次试戴太慢、对 AI 建议不信任；[2026-09 试戴对比讨论](https://www.reddit.com/r/glassesadvice/comments/1wjxibg/please_help_me_pick_a_new_pair_of_glasses_virtual/) 的用户通过多图求助、关心 low bridge/PD；[2026-10 用户疑问](https://www.reddit.com/r/GenZ/comments/1xfzk7p/how_do_you_guys_select_glasses_when_buying_online/) 则担心 AI 预览会高估现实佩戴效果。都是**案例**，非定量需求规模。
4. **“准确物理尺寸”不是 VisuTry 目前可以对外作出的能力承诺。** [Zenni 官方](https://www.zennioptical.com/help/frames-fitting/virtual-try-on) 明确建议输入 PD 并在 VTO 之外核对真实尺寸；[VisuTry 当前试戴页](https://www.visutry.com/en/try-on/glasses) 也只承诺视觉预览，不保证实际镜梁/镜腿/度数兼容。新的 fit-confidence 内容可以做，但不得宣传为毫米级测量或“戴上一定合适”。
5. **GEO/Shopping 平台同时是渠道和潜在替代者。** [OpenAI 2026-03 的商品发现扩展](https://openai.com/index/powering-product-discovery-in-chatgpt/) 与 [ChatGPT Shopping 帮助页（2026-11-02 检索）](https://help.openai.com/en/articles/11128490-shopping-with-chatgpt-search) 明确已有商品比较及衣饰虚拟试穿场景；Google 的虚拟试穿商家说明当下仅列鞋、上衣、裤、连衣裙，**不含 accessories**，不能概括为“Google 已经为眼镜提供同类 try-on”。这提醒我们不押宝纯泛试戴，同时不能把 B2B Merchant Feed 与 Consumer GEO 混为一谈。
6. **正式定价/免费承诺需要使用当前生产网站事实而不是旧记忆：** 2026-11-02 查询 [pricing](https://www.visutry.com/en/pricing) 显示 **1 included credit**、$2.99 **30 credits**、Standard $8.99/90 credits per month；免费 Detector 始终免费。历史资料存在与此不同的额度，应在任何内容/营销实验时以生产真实计费代码再复核，不得用旧套餐数值写新落地页。本次仅只读核查，未确认支付后台的确切运行权益。

## 1. 证据清单与已知硬约束

### 1.1 一方基线（引用 2026-11-01 已核实窗口，**不是本次新读取的数据**）

| 指标 | 最近观察 | 解释边界 |
|---|---:|---|
| GA4 所有 sessions，2026-10-04～10-31 | 6,889（前期 7,804，-11.7%） | 包含尚未充分剔除的测试/非高质量访问，非严格 qualified |
| GA4 Organic Search | 5,015（前期 5,238，-4.3%） | 自然流量是主体，已经不是稳定上升趋势 |
| GA4 AI Assistant | 588（前期 850，-30.8%） | 与 GSC 生成式 AI 展示不能互换 |
| GA4 `begin_checkout` / `purchase` | 32 / 14，$41.86 GA4 | 全站事件且尚未 Stripe/Payment 核对 |
| GSC Web，2026-10-03～10-30 | 4,784 clicks / 120,491 impressions / 4.0% CTR | 本站搜索结果展示量，非市场月总搜索量 |
| EN Detector | 1,558 clicks / 54,546 impressions | 印度 mobile 曝光下降；不能直接判为页面技术故障 |
| EN Photo/AI guide | 967 / 20,374 | AI guide 有 4 GA4 落地页归因购买，待支付确认 |
| EN Gentle Monster 页面 | 532 / 1,610 | 高 CTR，但其真实试戴/付款质量未证 |
| EN Advisor 落地 | 454 GA4 sessions / 5 GA4 purchases | 需排除测试和 Stripe 一方核实 |
| EN Detector 落地 | 1,721 GA4 sessions / 0 landing-attributed purchase | 不能解释为跨页面“所有 detector 用户都不付钱” |
| GSC Image Search | 2,863 impressions / 5 clicks | 目前不是已证实的增长引擎 |

**10× 算术：** 历史约 1,824 sessions/月的 10× 为 18,240；相对最近 6,889/28d，还差 11,351 sessions，当前需再扩约 **2.65×**。严格说两个窗口并非完全同周期/同样 qualified 定义，因此这是规划参照，不是承诺。若仅靠新增 Google Web 曝光、维持约 4% CTR 和粗略假设每次点击≈一次 session，理论上需 **约 28.4 万新增 28d 曝光** 才对应这 11,351 次额外 visits；**这个是模型敏感性展示，不是关键词 volume 或可实现预测**。它否定了“小幅改标题就 10×”的简单叙事。

### 1.2 产品架构与当前页面的真实关系

| 实际用户任务 | 现有页面/能力 | 现有承诺与缺口 |
|---|---|---|
| 免费判断脸型 | `/en/face-shape-detector` | 无登录、照片在设备端；这是可规模化的低 CPU 获客工具；不产生个性 Top Picks |
| 哪种眼镜适合我 | `/en/blog/ai-face-analysis-for-glasses-guide` → `/en/face-analysis` | 通用建议免费、个人照片深度分析受 Credits/Unlock 保护；需要核实用户是否能理解边界 |
| 我就想试某一副 | `/en/try-on/glasses`, `/en/try-glasses-on-photo` | 用户必须自带个人头像和商品镜框图/截图；不能默认有品牌商品图已载入 |
| 具体品牌/镜框 | `/en/brand/gentle-monster` 等9个英文品牌页 | 现在给的是 **style directions 而非品牌 SKU**；对“试确切型号”的用户存在本质任务差异；#499 已澄清边界，仍待行动验证 |
| 对比后选一副 | Frame Compare（≤4生成框） | 已有能力，但跨渠道的自然分享/朋友投票回流尚无证据 |
| 确认物理尺寸 | `/en/glasses-guide/how-wide-should-glasses-be-for-my-face` | #500 新增真实尺寸指导；当前视觉生成不能等于物理 fit 判定 |

**高优先级诊断：** Gentle Monster 品牌页 Google CTR 很强，但页面明确四个示意 style，不是可直接使用的 Gentle Monster 官方商品。用户从搜索进入后，仍需额外寻找商品截图+上传肖像+登录才能看到自己佩戴的**特定款**。这是一条待实际测量的“需求→交付摩擦”链，不能简单归因于搜索算法。

## 2. 完整关键词意图研究：先建 taxonomy，再决定哪些值得研究

**标签规则：** `GSC` 表示上一轮已有 VisuTry 查询/页面数据；`EXTERNAL` 表示本轮公开竞品/用户/搜索结果证明有这一类问题或供给，但**没有搜索量**；`HYPOTHESIS` 表示合理扩词、未核验独立需求，**不得作为上线新页面的理由**。每个意图组内部按强相关购物→宽泛识别排序。所谓“关键词簇”是合并意图，不按单个同义词建 URL。

| 查询意图 | 核心/长尾种子（英文为主） | 证据类型 | 唯一推荐 owner / 决策 |
|---|---|---|---|
| **A. Free face shape** | `face shape detector`; `free face shape detector`; `face shape finder`; `face shape detector online free`; `face shape detector for glasses`; `what is my face shape`; `face shape test with photo`; `face shape detector without upload` | 前 5 项 GSC，其余部分 EXTERNAL/HYPOTHESIS | 统一 Detector + 现有 `face-shapes` 指南，不建免费 detector 同义页；India mobile 为搜索波动诊断对照 |
| **B. Photo eyewear decision** | `what glasses suit my face upload photo`; `what glasses suit my face upload photo online free`; `which glasses suit my face ai`; `which glasses suit my face ai free`; `glasses recommendation ai`; `glasses that suit my face from picture`; `recommend eyeglasses based on selfie`; `AI eyeglasses finder from photo` | 前 5 项 GSC，后 3 项 HYPOTHESIS | AI guide + Advisor；需区分“免费 face shape”与“credit-gated individual report” |
| **C. Direct frame-photo try-on** | `try glasses on photo`; `virtual glasses try on`; `virtual try on glasses upload photo`; `try eyeglasses from screenshot`; `upload glasses photo try on`; `try any glasses online`; `glasses product photo virtual try on`; `eyewear try on no app` | 泛试戴外部 Trends+SERP，截图/上传竞品 EXTERNAL；具体长尾量未知 | `/en/try-on/glasses` 与 `/en/try-glasses-on-photo` 两者必须单一意图归属，防止自相竞争；先看 exact URL 的 GSC |
| **D. Branded SKU / style** | `gentle monster virtual try on`; `gentle monster try on virtual`; `ray ban virtual try on`; `oakley virtual try on`; `warby parker virtual try on`; `zenni virtual try on`; `gentle monster [model] try on`; `ray ban [model] virtual try on`; `glasses from [brand] on my face` | 前六有 GSC/历史 Planner，型号级 HYPOTHESIS | 现有九品牌页/现有 Ray-Ban 指南；**型号级别未有真实商品 SKU 承载证据，禁止复制** |
| **E. Fit and frame size** | `how wide should glasses be for my face`; `frame width vs face width`; `52 18 145 glasses meaning`; `bridge width glasses fitting`; `low bridge fit glasses`; `glasses too wide for face`; `petite face glasses size`; `how accurate is virtual glasses try on`; `glasses virtual try on size accuracy`; `does try on match actual fit` | 现有 width-guide owner，用户/Zenni/竞品 EXTERNAL；逐词搜索量未知 | #500 现有 width-guide + 与 Try-On 的诚实边界；不谎称真实鼻梁/毫米级测量 |
| **F. Comparison / social validation** | `compare glasses frames on my face`; `which glasses look better on me`; `glasses before after comparison`; `side by side glasses virtual try on`; `help me choose between glasses`; `ask friends which glasses look best`; `glasses frame vote`; `share glasses try on results` | 外部 Reddit/产品场景 EXTERNAL，量未知 | 现有 Frame Compare/分享，不做“免费无限生成”；先量真实分享完成及回流 |
| **G. Sunglasses / style case** | `which sunglasses suit my face upload photo`; `sunglasses for round face`; `best rectangular frames for oval face`; `cat eye glasses for round face`; `oversized glasses petite face`; `browline glasses square face`; `sunglasses for low bridge` | 部分 GSC + 既有指南，其余 HYPOTHESIS | 既有 sunglasses/face-shape/style 组合页；避免批量造新页面 |
| **H. Privacy/trust** | `face shape detector safe`; `face shape detector without uploading photo`; `private glasses try on`; `glasses selfie photo privacy`; `AI glasses try on without login`; `will my photo be saved`; `are virtual glasses try on accurate` | JA “安全” GSC；竞品/社区 EXTERNAL；词级数量未知 | 免费 Detector 隐私优势 + 现有 Try-On/Privacy/FAQ；差异清晰呈现“端侧 Detector vs AI 生成要上传” |
| **I. Locale-specific** | `顔の形診断 カメラ 無料`; `顔の形診断カメラ 無料 安全`; `似合うメガネ 顔型 写真`; `gafas para mi forma de rostro`; `detector de forma de cara gratis`; `probar gafas virtualmente con foto`; `qué gafas me favorecen por foto` | JA 前两项 GSC；ES Detector 站内 URL 增长；其它 HYPOTHESIS/EXTERNAL | 现有 JA/ES 对应路由，先对付费/继续率做分组；不新增语言或大规模翻译 |
| **J. Non-core drift** | `face beauty score`; `best haircut for face shape`; `makeup by face shape`; `celebrity lookalike`; `general AR selfie filter` | 有公开竞品，非 eyewear 商业任务 | 不作为 Consumer 10× 主线；除非出现真实 eyewear 继续与收入证据 |

**本次比 V1.1 新增的关键候选群：** E 真实 fit/尺寸、F 多副并行比较和朋友确认、H 隐私信任，以及 C 的**现成商品截图/链接**入口摩擦。这里的“搜索种子”不是声称已找到大量新 Google search volume；真正开发之前必须以 GSC query×URL 与 Google Ads Planner（可用时）或独立需求样本复核。

## 3. 竞品按“用户完成任务”而非功能表评估

| 供给层 | 代表事实（公开产品资料） | VisuTry 机会 | 反证/威胁 |
|---|---|---|---|
| 眼镜零售商内部 | Warby Parker Advisor：脸扫/打分/推荐自有商品；Zenni：支持上传照片、PD校准、无限免费 VTO | 无商户绑定的第三方决策、跨店比较、用户自主选择 | 同店实际 SKU / 精确图 / 购买闭环明显有优势；宽泛品牌词偏官方导航 |
| 无账号一图试戴 | GlassesOnMe：无需账号的免费低清预览，邮件获取高清 | VisuTry 完整历史/Compare/付费 Advisor 形成深度 | VisuTry 登录和两图输入是首价值摩擦；不能凭“AI”证明领先 |
| 跨站 link-first | TryOnFrames / Mirra：产品链接导入；Mirra 设备端和 PD校准 | 用户不用手动找商品照片的任务价值真实存在 | 并非空白创新；URL 解析、版权、反盗链、质量与成本风险大，不应立即开发 |
| 分享型来源 | SpecFit：TikTok 分享导入，某些情况免费 fit check | 潜在社交→选镜链路，不依赖搜索长尾 | iOS 系统分享入口和源视频识别复杂，现有 VisuTry 浏览器能力差异显著 |
| 端侧免费识别+示意试戴 | FaceShapeDetector.app / FaceRater 等：免费本地检测与图形覆盖 | VisuTry 按需付费的写实生成+独立 Compare | 不能靠 Detector 本身的“免费、隐私”建立长期排他性 |
| 生成式 AI / Shopping 平台 | ChatGPT 已增加购物比较与部分品类 Try-on；Google 的官方 merchant try-on 当前文档不含 accessories | 为 Consumer 提供有可发现价值的独立、权威、诚实答案/工具入口 | 平台原生体验可能挤占“泛试戴工具”访问；GEO 引流不能依赖 llms.txt 或虚假引用 |

**SEO schema 严格边界：** Google [Merchant listings 文档](https://developers.google.com/search/docs/appearance/structured-data/merchant-listing) 说商品销售型 Merchant Listing 需要页面能够直接购买，单纯跳转到其他网站的独立 brand-style guide 不应假装是可购买 SKU page 或添加虚构 `Offer`；正确使用 editorial/product-snippet 需根据真实内容及结构化数据资格。这个边界尤其重要，避免为了 SEO 在九个品牌页伪造商品身份。

## 4. 用户真实痛点的方向性核验（小样本，非统计）

1. **不想逐副试、想同屏比较：** [2026-02 的 r/glasses 讨论](https://www.reddit.com/r/glasses/comments/1qzft1i/does_anyone_else_struggle_with_choosing_glasses/) 反映多框试戴步骤多且对 AI 推荐不信任。VisuTry 已有 Frame Compare，但使用者需要自己提交图片、消耗 credit；必须核实“完成多副比对”是否比只做单副 VTO 更能驱动付费。
2. **怕 VTO 把尺寸画得过于好看：** [2026-10 GenZ 求助](https://www.reddit.com/r/GenZ/comments/1xfzk7p/how_do_you_guys_select_glasses_when_buying_online/) 担心 $25 猫眼框在 VTO 看着好但实际太小；[2026-08 r/glasses 讨论](https://www.reddit.com/r/glasses/comments/1vvowkr/do_these_work_for_me/) 也建议真实尺寸对照；[2026-04 VTO 准确性讨论](https://www.reddit.com/r/glasses/comments/1sokvi2/virtual_try_on_accuracy/) 同样涉及 PD 与 bridge。品牌与第三方指导都反对将视觉图等于真实物理尺寸。
3. **选镜是带社会意见的决策：** [2026-09 r/glassesadvice](https://www.reddit.com/r/glassesadvice/comments/1wjxibg/please_help_me_pick_a_new_pair_of_glasses_virtual/) 用户上传多副 VTO 图片求反馈；具体需求可能是“哪副更好看”而非多生成 20 张图。现有 Frame Compare 能承载部分问题，但无增长回流实证。
4. **隐私/安全有吸引力也有边界：** JA `顔の形診断カメラ 無料 安全` 有本站 GSC 点击；VisuTry Detector 免费设备端；但 Advisor、Try-On 发送相片到 AI 服务的事实必须清楚，不能把 Detector 的“never upload”宣传延伸到整个服务。

## 5. 增长机制筛选：竞争、产品 fit、分发重复性、反证同看

| 假设 | 市场需求 | 当前产品可交付性 | 潜在可重复分发 | 最大反证 | 决策 |
|---|---|---|---|---|---|
| **H1 具体品牌→确切商品图 Try-On** | **较强**：Gentle Monster 既有实测，其他品牌差异极大 | **中**：两张图片可上传；品牌指南不是 exact SKU | 中：仅当多品牌/型号各自具备真实高意图和继续率 | GM 强流量却未上传真实镜框图，品牌误解/注册流失 | **P0 readback，暂不扩品牌或做 URL importer** |
| **H2 照片选镜→Advisor/Try-On→付费** | **较强**：多条 GSC 上传照片/AI 查询 | **高**：实际个性 Advisor 付费能力已有 | 中：自然搜索与高质量解释页可持续，但竞争激烈 | “free”搜索者只做 Detector、不付费，GA4 漏斗不可 join | **P0 商业质量主实验** |
| **H3 真实 fit/尺寸+视觉决策** | **中**：外部真实问题/竞品投入 | **中**：当前有尺寸指南和 VTO，非 true-to-size 引擎 | 中：尺寸问题长尾与可信原创图表可供检索引用 | 多数用户仅需要具体商品准确尺寸而非第三方服务 | **P1 desk-research + 原页低风险诊断** |
| **H4 Compare/Share/Vote 驱动回流** | **中**：多副比较定性需求 | **中高**：Compare 和分享已有部分基础 | **不明**：需要真实私密分享→访问→开始使用的 K 值 | 私密照片不愿公开、分享后朋友不愿再注册 | **P1 纯测量实验，不直接做社区/排行榜** |
| **H5 免费 Detector 海量 SEO** | 高站内曝光 | 高且低成本 | 高搜索但单一排名依赖、跨语种商业差异 | India mobile 展示下滑，0 直接归因购买 | **保卫、不作为单一 10×** |
| **H6 AI/GEO + Agent 链接发现** | AI Assistant 已有 588 sessions，Google GAI 曝光存在 | 中：公开产品内容/结构化基础已有 | 未证：平台固有强竞争且流量 -30.8% | 平台原生试戴/零点击答案吃掉直接访问 | **保留监测/原创内容，拒绝 GEO hacks** |
| **H7 站外 creator/专业引用/嵌入** | 有教程/工具讨论和网站产品模式 | 中：原始价值需具可引用的原创资产 | 可能，但当前没有内部有效转化证据 | 历史触达无回信、弱增量/低质量 | **P1 非接触性筛查，不批量外联** |

**权重说明：** 本轮不捏造“机会评分 92/100”；上表的强/中/不明是证据完备度而非市场规模或竞争难度量化。尤其 H3/H4 是**新研究线索，不等于批准新产品**。

### 5.1 10× 量级约束（情景而非 forecast）

- 过去 28d 6,889 sessions，目标历史算法 18,240，差额 11,351。两个小页面编辑无法单独解释如此大的规模。
- 即使 H1 增加 1,000 qualified sessions/月、H2 增加 2,000、H4 带来 500，也仅合计 **3,500**，仍距 11,351 差 **7,851**。这些数字仅是压力测试假设，不是真实预测。
- 若设想 H4 每位现有合格用户有 20% 自发分享、每次分享给 2 人、20% 的接收者访问，则平均每位仅产生 **0.08 次新增访问**，远未形成自传播爆发。真实数据若达不到高分享率、真实二次产品开始率，就不能将分享视作 10× 引擎。独立实验要测三段漏斗，而不是只数分享按钮。
- 真正足以支持 10× 的引擎必须满足：**可反复获得新增、相关的流量；用户能完成核心任务；新增用户总体付费质量与成本没有持续下降；可以在至少两个独立 cohort 或渠道复制。**

## 6. 立即可做的研究/实验设计，不改生产

### E1 — Brand intent mismatch audit（11/02～11/09）

**对照：** Gentle Monster（高 CTR）/ Ray-Ban（高展示低 CTR）/ Oakley（中低）三类，与品牌无关的 `/en/try-glasses-on-photo` 比。  
**第一个数据表：** GSC exact URL × exact brand-query × US/India/device × 最近/上个 28d；确认是否主要是官网导航。  
**第二个数据表：** GA4 Organic landing sessions；按 `seo_funnel_click` 的 `source_page`, `destination`, `cta_location` 统计事件，若不能去重只报事件。  
**第三个数据表：** Axiom `visutry-traffic-pro` 对相关 landing 去重 `consumer_funnel_id` 的实际 Try-On starts/completes、失败原因、7 天差异；生产 candidate 不等于已剔除内部。  
**第四个数据表：** 只读 Payment `COMPLETED` 按 `attribution.landing_page` 归属、退款和 Stripe 匹配，不推导个人 GSC 关键词。  
**假设被否证：** GM 的用户只是想看官方商品效果但找不到可直接使用的真实商品，`style-card` 点击后实际完成很低；若如此优先解决透明交接和素材摩擦，而不是推广更多品牌名。  
**不做：** 复制50个 brand pages、冒充官方、标记不销售的品牌页面为 Merchant `Offer`、未经验证直接建设 URL importer。

### E2 — Photo decision / commercial quality audit（11/02～11/09）

**对照：** `/en/blog/ai-face-analysis-for-glasses-guide` vs `/en/face-analysis` vs 免费 Detector（对照），再单列 direct custom try-on。  
**区分三种用户意图：** “只求免费的脸型标签”、 “想知道适合什么眼镜”、 “已经拿到某个商品想试戴”。这三类不能强迫走相同链路，也不能把后两类个性化能力免费化。  
**真正主要指标：** 去重合格 landing sessions → Advisor completed 或 Try-On completed → Stripe confirmed paid; 另列每完成一次实际 AI 生成的成本和失败率。  
**支付一致性：** 当前 `Payment` 模型有 `attribution` / `stripeSessionId` / `amount` / `status` / `completedAt`，但未天然关联 `consumer_funnel_id`；可以做 landing→verified-payment **聚合归因**，不能伪造逐用户 join。  
**不做：** 在 11/01 移动 CTA 观察期内修改 first-screen、降低付费个性 Advisor 边界或更改套餐。

### E3 — Trust/fit research (新增、仅桌面和现有资料，11/02～11/09)

对照现有 width-guide、低鼻梁、PD、frame-size 内容与问答，收集 **真实 GSC impression/CTR/query** 和业务 CTA；列“视觉效果能回答/不能回答”的用户任务矩阵。若已有高意图页面的 GSC/下游行为有证据，考虑**只更新该页一项原创示例图或解释**，不创造新 AI fit engine。依据 [Google 2026 生成式搜索指南](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide) 与 [Image SEO](https://developers.google.com/search/docs/appearance/google-images)，强调原创有效答案、可索引图片与真实 expertise；避免 LLMS.txt GEO 黑客、机械文本堆砌。

### E4 — Share/Compare research (新增、仅事件审计，11/02～11/09)

确认 `comparison_created/completed`、`tryon_shared` 等现有事件是否能区分 user-initiated share、打开量、新的产品行为；检查分享链接是否私密、过期、不会公开用户肖像；如果不能可靠量化传播回流，先补测量合同设计，不建公开投票和新社区。只有经过隐私审查和真实参与自愿分享，才试分享机制。

### D+7、D+14、D+28 可否证关口

| 检查日 | 充分可检验事项 | 停止/保留原则 |
|---|---|---|
| 11/08–09 | #484 移动 CTA 与 #499 品牌交接首次完整 7d；对照发布日期、CDN 可见时间、同周几 | 不把事件总数除以其它渠道 sessions；无可靠 join 判 `INCONCLUSIVE` |
| 11/15–16 | 新 GA4 自定义维度有实际事件后的人群分组、Axiom anonymized action cohort、Payment 聚合归因缺失率 | 付费样本少/内部排除无法核验，不以小样本“胜出” |
| 11/29 起（考虑 GSC 延迟） | 28d exact page/query 排名与 CTR、合格动作、Stripe-verified transaction、成本，严格同窗对照 | 仅当相关流量、真实完成和商业质量共同改善且可复制才 `PROMISING`；否则 `MODIFY/STOP` |

## 7. 数据取得状态与审计等级

- **VERIFIED (本轮公开外部)：** 竞争产品自述的已列能力、Warby Parker/Zenni 官方能力、Google Search Central/ChatGPT Shopping/Google Merchant Center 官方文档、VisuTry 当前公开页面 copy；这些不证明竞品实际输出质量或流量。
- **VERIFIED (既有 11/01 一方资料和代码)：** GA4/GSC 28d 基线、项目 current GTM、已发 #484/#499/#500/#503–#505，`Payment` 聚合字段/匿名服务端漏斗的代码契约。
- **DIRECTIONAL (本轮外部用户证据)：** 少量 Reddit 关于选择困难、真实镜框尺寸、试戴过于理想化、询问朋友的真实案例。非代表性样本、不能推算 TAM 或转化率。
- **OPEN / NOT REPRESENTED AS DONE：** 11/02 新鲜的已认证 GSC/GA4 分组、Google Keyword Planner 2026-11 实际按国家搜索量/竞争、Axiom 28d 去重 cohort、Stripe transaction reconciliation、跨品牌/平台的真实转化、任何 10× 新增流量实验结果。

**本轮结论：** 当前最值得押注的仍然是 H2 Photo Decision 和 H1 Exact-Frame Intent；新增可信的 H3 Fit Confidence/H4 Compare–Share 进入验证池，但**不直接成立**。现阶段最佳投入不是另建免费推荐工具，也不是再发布大量页面，而是对实际有需求的入口核实完成率/支付质量并锁定可复制的分发单元。

## 8. 核心来源与复核入口

### 内部
- [GTM v3.4 — 单一策略](https://github.com/franksunye/VisuTry/blob/main/docs/strategy/analytics/gtm.md)
- [Organic growth 11/01 证据](https://github.com/franksunye/VisuTry/blob/main/docs/ops/organic-growth-restart-2026-11-01.md)
- [SEO active backlog](https://github.com/franksunye/VisuTry/blob/main/docs/project/seo-backlog.md)
- [历史 Keyword Planner 官方账号区间](https://github.com/franksunye/VisuTry/blob/main/docs/strategy/seo/2026-07-27-google-keyword-planner-brand-opportunities.md)
- [VisuTry Price (live public)](https://www.visutry.com/en/pricing)
- [VisuTry Detector (live public)](https://www.visutry.com/en/face-shape-detector)
- [VisuTry Gentle Monster independent guide](https://www.visutry.com/en/brand/gentle-monster)
- [VisuTry Custom Try-On](https://www.visutry.com/en/try-on/glasses)

### 外部官方/产品
- [Warby Parker Advisor](https://www.warbyparker.com/advisor)
- [Zenni VTO and PD help](https://www.zennioptical.com/help/frames-fitting/virtual-try-on)
- [GlassesOnMe any-frame](https://glassesonme.com/en/)
- [Mirra private URL-to-try-on](https://mirra.logicaleap.com/try)
- [SpecFit TikTok URL-to-try-on](https://specfit.app/)
- [Google Search generative AI optimization official](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)
- [Google Image SEO](https://developers.google.com/search/docs/appearance/google-images)
- [Google merchant listing eligibility](https://developers.google.com/search/docs/appearance/structured-data/merchant-listing)
- [Google Shopping try-on category support](https://support.google.com/merchants/answer/16159685?hl=en)
- [ChatGPT Shopping and Try On](https://help.openai.com/en/articles/11128490-shopping-with-chatgpt-search)
- [OpenAI product discovery launch](https://openai.com/index/powering-product-discovery-in-chatgpt/)
- [Consumer Reports 2026 buyer preferences](https://www.consumerreports.org/money/eyeglass-contact-lens-stores/best-and-worst-eyeglass-and-contact-lens-stores-a3561396052/)

### 外部用户样本（非整体统计）
- [r/glasses 选择困难与多框比较](https://www.reddit.com/r/glasses/comments/1qzft1i/does_anyone_else_struggle_with_choosing_glasses/)
- [r/glassesadvice 多副 VTO 求反馈](https://www.reddit.com/r/glassesadvice/comments/1wjxibg/please_help_me_pick_a_new_pair_of_glasses_virtual/)
- [r/GenZ 害怕 VTO 尺寸失真](https://www.reddit.com/r/GenZ/comments/1xfzk7p/how_do_you_guys_select_glasses_when_buying_online/)
- [r/glasses VTO size accuracy](https://www.reddit.com/r/glasses/comments/1sokvi2/virtual_try_on_accuracy/)

---

## 9. 增量证据与持续研究终局决策协议（2026-11-02）

**定位：** 本附录承接 [V2 深度研究](https://github.com/franksunye/VisuTry/blob/main/docs/ops/2026-11-02-10x-growth-discovery-deep-research.md)，不另立 GTM 战略。**状态：RESEARCH ACTIVE / NO SCALE DECISION**。

### A. 本轮新增独立证据及边界

1. **线上用户确实经常购买多副眼镜。** The Vision Council 于 2026-10-27 发布的 Q3 2026 美国代表性成人调查（N=12,099，2026-07-29～09-12）报告：53% 的线上眼镜买家购买多副，相对线下买家 36%。这说明“多副选择”的任务真实且常见，**不能**由此推断他们需要 VisuTry 的付费 AI Compare，或愿意公开分享照片。来源：https://thevisioncouncil.org/blog/new-research-vision-council-explores-consumer-behavior-q3-2026
2. **输入照片是独立 VTO 的重要行为摩擦。** Genlook 2026 Q3 自有商户端数据：890 个使用其 VTO 的商店、28.2万余次 Try-On；在约33万次打开 widget 的会话中，41.9% 添加照片，38.4% 获得试戴结果；92% 的 Try-On 在手机上完成。**只可作为产品研究的外部参照，不等于 VisuTry Consumer 登录/上传/二图生成的同口径转化率。** Genlook 自身为供应商，有客户自选择、cookie 同意、主要是服饰且非随机对照限制。来源：https://genlook.app/reports/state-of-virtual-try-on-2026-q3
3. **重复比较与购买同向相关，但非因果证据。** Genlook 同一报告：3次以上 try-on 的 shopper 有21%下单，一次 try-on 的为10%；自选的高购买意图同样可能导致更频繁试戴。眼镜类“试戴特定商品后30天内购买该商品”的比例报告为4.1%，比平台整体6.7%低。**不能把这个下单率用于预测 VisuTry 的消费者付费 credits**；两种转化事件、场景和人群不同。
4. **分享不能默认构成 10× 传播机制。** Genlook 报告中 5.8% 的试戴 shopper 点击 share，其中64%完成分享，但未提供由分享带来的新用户激活率；因此无法据此推导病毒系数。VisuTry 需先量真实分享→打开→完成动作→回流，且保持隐私和过期链接边界。
5. **独立学术证据支持“交互对体验有影响”，不直接证明长期成交。** 2025 发表的 265 人三组 eyewear VTO 实验比较无 AR、照片型 VTO 与实时高交互 AR，报告高交互增强 engagement 和 product enticement。实验研究的是心理指标，不是 VisuTry 生成式图片付费转换。来源：https://doi.org/10.1016/j.chbr.2025.100772
6. **Google 不要求 AI 专属 SEO 文件。** Google Search Central 明确 AI Overview/AI Mode 与常规搜索同样依赖可抓取、已索引、真实可信内容；不应把 `llms.txt` 等当作能够带来额外曝光的必要工程。来源：https://developers.google.com/search/docs/appearance/ai-features

**证据综合：** 相比“新增功能清单”，更值得研究 VisuTry 的 **真实商品图取得/双图输入 → 高质量完成一次试戴 → 多副比较 → 有效付费** 是否连续成立。此优先级是“证据驱动的研究排序”，不是已验证增长成功。

### B. 唯一可判断的 10× 定义

- **核心目标：** 在规定完整 28d 口径下，可重复出现的 **合格 Consumer sessions**；至少完成 Detector 后有效进入眼镜决策、完成 Advisor、完成 Try-On、Compare 或经核实支付中的某一适当定义动作。定义须排除 B2B Merchant 和已识别测试/内部访问，且不要将事件总数直接当作会话数。
- **经营护栏：** 每 1,000 合格 Consumer sessions 的 verified revenue、实际支付笔数、退款、每次有效生成成本及失败率；需要真实 Stripe/Payment 和可关联的采样边界。
- **历史参照而非已验收目标：** 2026-08-03 约1,824 total sessions/月，10× 算术值18,240；2026-10-04～10-31 total sessions 6,889（并非相同 qualified 定义）。必须先建立一个完整、去重且可重现的 qualified baseline，才能正式判定 10×。未取得该基线时报告 `METRIC BASELINE NOT VERIFIED`，不强行作达成率。

### C. 五个工作包：每次都要双向质询，并优先得出结论

| 包 | 市场→产品问题 | 产品→市场问题 | 关键数据 | 可否定条件 |
|---|---|---|---|---|
| E1 Branded exact frame | 搜索指定品牌/型号的人，究竟是找官网试戴还是愿用独立站？ | 目前 style reference + 需自带镜框图是否满足任务？ | GM/RB/OK exact query×page GSC；GA4 landing/CTA；Axiom Try-On completion；Payment landing 来源 | 有搜索点击但完成率低；主要是官方导航需求；误解为官方商品 |
| E2 Photo→Advisor | 免费识别与个性化购买建议对应哪些不同付费意愿？ | 现有 Guide→Advisor/直接 Try-On 路径是否留住高意图？ | Guide/Advisor/Detector 对照；去重完成；Verified payment；登录/Unlock dropoff | “free”带来非商业流量或实际解锁/付费无增长 |
| E3 Fit Confidence | 尺寸/桥宽/PD 的搜索需求有多大，消费者愿意信任哪种解释？ | 现有 width guide 能提供可靠非毫米级购买指导吗？ | 现有 URL exact GSC；CTA；用户问题；安全声明 | 市场需要真尺寸测量而非生成式预览；新增功能无法诚实交付 |
| E4 Compare/Share | 决策者会向朋友确认吗，接收者会成为独立用户吗？ | 现有 Compare/Share 完成后回流是否有可测量链路？ | comparison_created/completed；share→open→new qualified action 的合法聚合 | 分享率低，回访无独立激活或隐私风险高 |
| E5 New distribution | 在 SEO 以外，谁会不断产生新的眼镜决策需求流量？ | VisuTry 是否有可重复引用而不需要新大功能的资产？ | ChatGPT/Google AI/第三方可验证引用、真实 referral sessions 和下游质量 | 只增长曝光而没有有价值点击；外联无有效来源；获取成本过高 |

**禁止事项：** 不能预先选择一个方向后只找支持材料。每一包必须至少列一条可信反证和一个与已有产品契约的冲突；不释放免费照片个性化 Top Picks；不承诺真尺寸 fit；不批量新增薄 SEO 页面；不在 11/1 CTA 观察期重写页面。

### D. 研究的实质性终止标准

一个方向在以下任一结果出现时必须形成决策，不再无限扩大关键词池：

- **SCALE（可复制增长）**：至少两次完整可比观察窗或独立 cohort 复现正向增量，真实合格产品完成增长且付费/成本护栏不恶化；将潜在可扩规模估算与距 10× 的缺口对照。只凭 GM 一页点击增长不得 SCALE。
- **MODIFY（用户任务存在但产品摩擦显著）**：GSC/外部证据支持需求，但实际投入 Advisor/Try-On 或完成明显流失；优先针对识别出的唯一摩擦做小实验，不改变价格/免费边界。
- **STOP（不值得投入）**：需求不足、只能吸引泛娱乐流量、无法合法准确交付、付费质量不成立，或获得流量的边际成本显著不经济。
- **INCONCLUSIVE（证据不足）**：无法剔除测试、未取得授权支付核验、数据无会话关联、样本不足/窗口未完整；必须清楚列出唯一关键阻断和进一步最小数据取得方式。不得用“还要继续调研”代替结论格式。
- **NO 10× WINNER（允许的全局结论）**：若所有包完成初验证仍不能证明可复制的 10× 增长机制，明确否决近期大规模产品开发/内容生产，并改为“守住现有 SEO + 修补已证实的转化摩擦 + 探索新分发”的资源配置，而不是继续凑增长故事。

**主要节点：** 2026-11-08/09 既有 #484/#499 7 日初读；11-15/16 检查 GA4 新自定义维度和一方匿名 cohort；11-29 后读取 GSC 28 日完备窗、Payment/Stripe 对账与真正的跨期变化。观察时刻须以真实 Cloudflare canonical HTML 生效/Google GSC 延迟为准；无完整窗口不作因果判断。研究没有固定“保证找到赢法”的截止日，但每个节点必须形成 SCALE/MODIFY/STOP/INCONCLUSIVE 决策。

### E. 自动持续研究与数据权限边界

- 每周进行两次专门的 **10× 机制研究**，聚焦 H1/H2/H3/H4/H5 的用户任务→完成→付费→可复制性，不替代现有每周一的通用 SEO/GEO 周报。仅当有实质进展、阻断或研究终局时向用户发送通知。
- 研究档案必须保留来源、窗口、样本、能否关联、反证、下一决策，不再重复写新的并行 GTM 战略。需要的生产变更仍遵循分支/CI/审批/上线质量门槛。
- 不凭现有代码路径宣称已获得数据库/Stripe 真实读取；取不到就是 UNAVAILABLE。凡涉及个人照片、PII、具体账户和内部测试标记，分析优先使用安全的聚合数据。

---

## 10. 两个 P0 的实证裁决（2026-11-02）

**研究性质：** 将此前已登录 GA4/GSC 2026-11-01 导出的真实指标（不同渠道、窗口严格注明）与 GitHub #484/#499 的产品代码事实、当前可公开读取的页面对照。**本轮未获得新的 GA4 同会话探索结果、生产 Payment/Stripe 明细或 Axiom 28d 去重查询**，因此将已证实的发现与尚未证实的转换分开，禁止以历史流量代替新转化。

### P0-1：照片选镜 → 付费 Advisor

GA4 2026-10-04 至 10-31，Landing Page 归因：

| 入口 | Landing sessions | GA4 purchase 事件 | 事件数 / sessions（非已核实付款转化率） | 95% Wilson 描述性区间 |
|---|---:|---:|---:|---|
| EN AI glasses guide | 1,001 | 4 | 0.40% | 0.16%–1.02% |
| EN Face Analysis / Advisor | 454 | 5 | 1.10% | 0.47%–2.55% |
| EN free Detector（对照） | 1,721 | 0 | 0% | 0%–0.22% |

前两者有 1,455 个 landing sessions（占全属性 6,889 的 21.1%），关联 9/14（64.3%）的全属性 GA4 purchase 事件。**仅能说明当前落地归因集中，不证明产品产生增量收入**：未验证 Stripe Payment、渠道/国家/测试过滤和交易类型；5 次 Advisor landing-attributed purchase 可能买的是 Credits Pack、不是报告解锁。Advisor 1.10% 与指南 0.40% 都属于极小样本，区间重叠，不能称 Advisor 显著更优。

GSC 的对应需求真实存在：2026-10-03 至 10-30，照片词 “what glasses suit my face upload photo” 99 点击/1,313 展示、“...upload photo online free” 102/1,001、“which glasses suit my face ai” 75/834；宽泛 “which glasses suit my face” 22/1,449、“what glasses suit my face” 9/949。**GSC 点击并非购买同一批人，GSC impressions 并非市场搜索总量。** 当前 EN guide 明确导向免费 Detector、个人化 Advisor 或直接 Try-On，产品链路与意图大体匹配。反证是 “free” 意图可能仅接受免费检测，以及需要登录/解锁的进一步摩擦。

**阶段裁决：** 需求 VERIFIED；GA4 购买关联 VERIFIED-BUT-UNRECONCILED；“用户为个性化 Advisor 报告买单” INCONCLUSIVE；10× SCALE NOT APPROVED。**P0 顺位更高，但不开发免费的个人化 Top Picks，不在现有移动 CTA 七日观察期重写 Guide。**

### P0-2：品牌搜索 → 实际镜框 Try-On

GSC Web exact page，2026-10-03 至 10-30：

| 内容 owner | 点击 | 展示 | CTR | 重要对照 |
|---|---:|---:|---:|---|
| Gentle Monster 品牌页 | 535 | 1,604 | 33.4% | 同口径前28天 625/1,591，点击 -14.4%，CTR 39.3%→33.4%，没有稳定增长 |
| Oakley 品牌页 | 37 | 1,206 | 3.1% | 品牌 SERP 和用户意图不同，不是 GM 的随机对照 |
| Ray-Ban 指南（不是同型品牌页） | 26 | 4,128 | 0.6% | 不能将低 CTR 直接认定无市场需求 |

GitHub #499（2026-11-01 merged，https://github.com/franksunye/VisuTry/pull/499）证实：9 个 curated 品牌页展示的是独立风格图片，不是可自动预载的品牌商品；CTA 到 generic /en/try-on/glasses，用户仍必须自己获取具体镜框照片/截图，再上传自己的肖像。#499 改良了说明和 3 步指导，**没有取消双图输入门槛**。因此“搜索特定品牌直接试戴”与当前实际交付存在可查证的任务-产品缺口；这是 UX/代码事实，**不是已测量的流失比例**。公开页面抓取仍可能有旧文案缓存；不能仅凭抓取断言生产 CDN 版本。

同一 GA4 28d 整站记录 tryon_started 119、tryon_completed 56 个事件，但既非同一品牌 cohort，也不是品牌 GSC 点击者；**禁止直接相除推导品牌成功率**。目前没有 GM/Oakley/Ray-Ban 的去重 organic landing→CTA→实际生成完成→Verified Payment 漏斗，品牌商业成果仍未验证。

**阶段裁决：** 品牌搜索入口 VERIFIED-BUT-UNEVEN；实际商品试戴的产品任务匹配需要 MODIFY；品牌来源的真实完成/付费 INCONCLUSIVE；10× SCALE NOT APPROVED。**停止批量增加品牌页；优先复核现有三页在 #499 后的真实动作与支付，不因高 CTR 立即投资更多品牌或新模型功能。**

### 缺的不是更多关键词，而是一份可重现的真实商业 cohort 表

严格使用三个同周期但不同粒度的来源，不做伪造身份 join：

1. **GSC**：三个品牌与 Guide/Advisor/Detector owner 的 exact page × 真实查询 × 国家/设备点击、展示、CTR。查询为聚合而非交易身份。
2. **GA4 + Consumer Axiom**：organic landing sessions 为分母；同会话去重的 CTA、Advisor start/complete、Try-On start/complete；按 source_page / destination / cta_location / landing_page / source_class 分组。排除有证据的 TEST/INTERNAL/Reference，未知另列；免费 Detector 的完成事件故意不上报服务端，不能以 Axiom 作为所有 Detector 的总分母。2026-11-01 才注册的 GA4 自定义维度不可追溯历史。
3. **Production Payment + Stripe（只读授权）**：completedAt、status、amount、currency、productType、unlockTaskId、attribution、refundedAt，按唯一 stripeSessionId 去重及审核；**仅以 Advisor landing 路径不能判定交易属于 Advisor unlock，必须用 unlockTaskId / purchaseContext 及真实款项核验。** 客户端的 consumer_funnel_id 没有直接存在 Payment，不能把独立 Axiom 会话与交易近似时间强行配对。

六个固定 cohort：E2 Guide / E2 Advisor / E2 Detector（免费对照）；E1 Gentle Monster / E1 Oakley / E1 Ray-Ban guide。对每个输出 eligible organic landing sessions、实际去重 starts/completions、Payment completed USD、report unlock vs credits、退款、来源缺失率，以及对照窗口。一项缺失须保持 UNAVAILABLE，不能填零。

**研究终局标准：** 在两个完整可比窗口显示新增合格完成，且经核实付款和单位成本护栏不恶化，才从 PROMISING 提交 SCALE 评审；有需求但完成低则 MODIFY 已确认摩擦；商业质量不足则 STOP；身份与支付数据不足则 INCONCLUSIVE。现有 2026-11-01 的 #484 / #499 更新尚未满七日，不能作因果宣称。2026-11-08/09 首轮读取；随后 28 天复核。研究优先级 **E2 > E1**，两者均无已验证的 10× 成功机制。

**可追溯资料：** GitHub docs/ops/organic-growth-restart-2026-11-01.md、PR #484 / #499、docs/strategy/analytics/gtm.md；当前公开路径 https://www.visutry.com/en/brand/gentle-monster 、https://www.visutry.com/en/blog/ai-face-analysis-for-glasses-guide 、https://www.visutry.com/en/face-analysis 、https://www.visutry.com/en/try-on/glasses 。


---

## 11. P0 新一轮独立 GSC API 复核（2026-11-02）

**来源：** 已连接 Windsor.ai `searchconsole` 的 `https://www.visutry.com/`，按 exact `page` 读取 `clicks`, `impressions`, `ctr`, `position`。不是此前浏览器截图的重新引用。本轮查询 2026-10-03–10-30 vs 2026-09-05–10-02，均 28 日，Web 口径；同一时间窗的 Google API 细分数据可能因匿名查询和聚合方式与原始页面总计不一致。未获得此次 GA4/Stripe/Axiom 历史去重交易报表。

| URL owner | 先前 clicks | 最近 clicks | Δ clicks | 最近 impressions / CTR / position |
|---|---:|---:|---:|---|
| `/en/blog/ai-face-analysis-for-glasses-guide` | 1,118 | 967 | −13.5% | 20,374 / 4.75% / 8.10 |
| `/en/face-analysis` | 236 | 263 | +11.4% | 4,454 / 5.90% / 8.62 |
| `/en/face-shape-detector` | 1,901 | 1,558 | −18.0% | 54,546 / 2.86% / 8.04 |
| `/en/brand/gentle-monster` | 623 | 532 | −14.6% | 1,610 / 33.04% / 3.33 |
| `/en/brand/oakley` | 43 | 37 | −14.0% | 1,206 / 3.07% / 7.64 |
| `/en/blog/rayban-glasses-virtual-tryon-guide` | 34 | 26 | −23.5% | 4,128 / 0.63% / 8.01 |

**关键查询层复核（本窗口）：** Gentle Monster exact owner `gentle monster virtual try on` 85 clicks / 196 impressions；`gentle monster try on virtual` 52/92；`gentle monster try on` 41/75。Guide exact owner `what glasses suit my face upload photo online free` 101/991，`what glasses suit my face upload photo` 99/1,238，`which glasses suit my face ai free` 65/440，`which glasses suit my face ai` 63/701。Oakley owner `oakley virtual try on` 0/143，`oakley try on` 2/107。可见品牌间 CTR 差异显著，但没有随机控制国家/品牌官网竞争；不可据此推因果。

**重要取数质量警示：** 带 `country`/`device` 维度的 GSC 结果，在 GM owner 上返回的设备分行 click 合计为 233，少于无维度 exact owner 的 532；按国家分行也明显不足。**不要拿细分行除以 532 宣称地理/设备流量占比**。实际站点数据需要在原生 GSC 页面验证完整性，保留维度和过滤条件后使用。

**新证据裁决：** P0-1 的 Guide 下降与 Advisor 上升方向不同，无法凭排名/流量判定付费产品验证通过；P0-2 GM 仍有显著点击但近期未增长，其它两个对照弱。`SEARCH INTENT = VERIFIED`，`PAID ADVISOR / BRANDED TRY-ON BUSINESS OUTCOME = UNAVAILABLE / INCONCLUSIVE`。

**本轮数据访问边界：** 当前 Chat 工具仅能读取已经打开的浏览器标签；已打开 Axiom Stream 页面展示实时运行日志，不是可筛选的 28 日 consumer funnel 聚合。Stripe 和 GA4 登录态本身不足以授权当前工具打开新标签/操作控制台；此次浏览器标签列表里没有 Stripe 或 GA4 页面。Windsor 当前账号只连接了 Search Console，未连接 GA4 或 Stripe。要执行真实订单对账，需在具有浏览器导航/交互权限的 Work 模式访问原有已登录控制台，或显式连接可读取 GA4/Stripe 的数据源。避免误报“已访问并完成对账”。


---
## 12. Stripe–Neon 付款上下文与 Advisor 的双路径归因（2026-11-02）

**已获得 Stripe 付款人工对账（用户在当前对话提供；不是本轮自主查询）**：2026-10-04～10-31 UTC，20×$2.99 Credits Pack + 2×$8.99 Standard 月订阅，共 22 笔成功、$77.78，另 1 笔 $2.99 失败，退款 0。**GA4 旧报表 14 个 purchase/$41.86 与 Stripe 22 笔不能直接逐一映射**：UTC vs GA4 属性时区、客户端成功跳转/事件与 Stripe 已确认账务的差异都要逐单校正。

### 代码已确认的事实（GitHub main 的实际实现）

- prisma/schema.prisma: Payment 有 status/productType/stripeSessionId（unique）/amount/currency/completedAt/attribution（JSON）/unlockTaskId；FaceAnalysisTask 有 reportUnlocked/status/userId/createdAt；TryOnTask、GenerationRequest 可审计服务完成动作。
- src/app/api/payment/create-session/route.ts 153–191, 222–246：如果调用时提供 unlockTaskId，先验证同一用户已完成且未解锁的 FaceAnalysisTask，再在创建 Checkout 前将 unlockTaskId 与完整 attribution 保存到 Payment PENDING。未提供则作为一般 Credits/订阅付款。
- src/lib/stripe.ts 147–229：userId、productType、unlockTaskId、压缩 attribution 写入 **Stripe Checkout Session metadata**；不保证这些字段能在 PaymentIntent 的付款详情 metadata 直接看到。仅订阅上下文另写 subscription_data.metadata，不含 unlockTaskId。
- src/app/api/payment/webhook/route.ts 155–251：签名确认付款后，Payment 完成、Credits 发放（如有）、对指定 task reportUnlocked=true 同属一次 Prisma transaction；若 checkout 元信息压缩，优先合并原有完整 Payment.attribution。必须剔除失败/重复/退款并与 Stripe session ID 一一比对。
- src/app/api/payment/conversion/route.ts 55–68：purchaseContext 是响应时根据 Payment.unlockTaskId 推导的 face_analysis_report/pricing 标签，**不是 Prisma 表上的独立持久字段**。
- src/app/api/face-analysis/submit/route.ts 69–83：用户带 credit/subscription quota 成功提交新的 Face Analysis 时，调用 reportUnlocked: quotaSource !== 'free_trial'；这类 Advisor 使用即使 Payment.unlockTaskId 为空也能解锁，不属于用户在 Checkout 时绑定旧报告的 direct unlock。当前 FaceAnalysisTask 未单独持久化每次解锁的 credit 来源，历史确切资金消耗来源可能需要 quota 日志证实。

### 本轮实际连接状态

- 已登录 Vercel Neon Data Editor，直接看到 public.Payment 及上述列，页面显示共 123 行历史付款数据；当前只读浏览器工具不能在 Query 编辑器里输入/执行 SQL，且表格当前视口未显示用于审计的 attribution/unlockTaskId 列值。因此 **23 笔 Stripe 记录尚未与实际 Payment 行实现逐行对账**；不能填写未经执行的 Advisor direct unlock 数值。
- 必须在相同 UTC 窗口执行纯 SELECT 聚合；匹配字符串 stripeSessionId 与 Stripe Checkout Session，而非仅按金额/日期推断。
- 需要分成两个口径：A. Payment.unlockTaskId 非空且完成付款的 direct report checkout；B. FaceAnalysisTask.status=COMPLETED & reportUnlocked=true、无 direct linked checkout 的已解锁报告（可能来自之前购买的 credits/订阅，不等同新收入）。A+B 不等于该周期全部 Stripe 收入，也不应按用户和日期粗略 join 制造精确付款链路。
- 需要考虑历史 Task retention 清理：Payment 指向已清理任务时 join 不到 FaceAnalysisTask，并不意味着付款或解锁失败；未关联旧 task 的实际值由 Stripe/Webhook 审计与历史日志共同验证。

**最新裁决：** Stripe 实际 Consumer 收入规模 $77.78/22 payments 已确认（用户提供）；direct Advisor report checkout **INCONCLUSIVE，缺 Production Payment.unlockTaskId 聚合结果**；先买 Credits 后使用 Advisor **INCONCLUSIVE，缺已解锁 FaceAnalysisTask/服务端 quotaSource 去重结果**。不得把 $77.78 归为 Advisor 收入，也不能把 0 个 Stripe 专门 Advisor 商品当成零 Advisor 付费使用。

**只读 SQL 查询工具：** 见 /mnt/data/visutry-p0-advisor-payment-readonly.sql（本地会话工件，不代表已在 Neon 执行）。


---

## 13. Production Neon 实证裁决：Advisor 付款及付费后 Try-On（2026-11-02）

**证据属性：** 用户直接提供已在 Neon Production 执行的两轮 SQL 汇总结果。查询按 Payment.completedAt 2026-10-04 00:00 UTC 至 2026-11-01 00:00 UTC（左闭右开）；第二轮 SQL 源文件 `visutry-p0-remaining-evidence-readonly-v2.sql` 已核对。以下不把不同日期窗口/系统口径拼接成用户漏斗，也不披露个人身份。

### 13.1 付款时明确绑定 Advisor 报告

第一轮 Q1：Payment.COMPLETED 22 笔，总额 $71.78。16 笔 CREDITS_PACK / $47.84 有 unlockTaskId，属于 **direct Advisor report-attached Checkout**；另5笔 CREDITS_PACK / $14.95 和1笔 PREMIUM_MONTHLY / $8.99 没有 attached report。12个历史 attached task 当前不在 FaceAnalysisTask 保留表；不能因任务缺失推断未解锁，仍保留的4个均 reportUnlocked=true。

第一轮 Q3：同期创建的 FaceAnalysisTask，当前保留134条、完成101条，其中24个 completed reportUnlocked，分布13个用户；4个与 attached Checkout 关联，20个无直接 attached Checkout 但该用户存在先前成功支付。**20个不是额外20笔付款，也不能只凭历史付款记录证实逐任务花费来源**。

第一轮 Q2：Google Organic + landing EN AI guide 有6笔/$17.94，全部 attached Advisor；EN Face Analysis 有2笔/$5.98，2笔 attached；EN Detector 有2笔/$5.98，2笔 attached；Gentle Monster 品牌页有2笔/$5.98，2笔 attached。以上是 Payment attribution 中的首次 landing 与来源，不等于某次 Try-On 的精确来源。

### 13.2 付款用户 Try-On（第二轮已执行 SQL）

| First landing cohort（不限制来源） | Completed payments | Gross USD | Attached Advisor | Consumer Try-On 7d post | Completed Try-On 7d post | Payment records with >=1 completed Try-On post |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| EN AI guide | 6 | 17.94 | 6 | 26 | 25 | 5 |
| EN Face Analysis | 4 | 11.96 | 3 | 38 | 35 | 3 |
| EN Detector | 6 | 23.94 | 4 | 56 | 56 | 5 |
| Gentle Monster | 2 | 5.98 | 2 | 12 | 9 | 2 |
| Other landing | 4 | 11.96 | 1 | 28 | 16 | 2 |
| **Total（付款 cohort 的聚合，不是去重用户总数）** | **22** | **71.78** | **16** | **160** | **141** | **17** |

SQL 使用 payment.checkout_id 去重付款、task.id 去重任务；Try-On 仅限定 t.userId=Payment.userId、t.origin=CONSUMER、createdAt 在付款前/后7日。**141/160=88.1% 只是这批付费用户的付款后任务完成比例，不是全站 Try-On 完成率；17/22=77.3% 是付款记录有后续成功任务的覆盖比例，不是唯一付费用户率或因果转化率。** 一名用户可能多笔付款且多个窗口交叉；同一 Try-On 可在不同付款 cohort 计入多次，故总和可能重复，不能当全局去重任务。且2026-11-02查询时10月末付款的后7天观察**尚未成熟**，并且历史任务可能因留存策略被删除，付款前仅4次观察不代表没有先前使用。需固定成熟 cohort 后复核。

**P0-1 Decision：** `PAID DEMAND = VERIFIED`、`PAID BUYER PRODUCT USE = VERIFIED`、`10x REPLICABILITY = INCONCLUSIVE`。可针对已经带来 Advisor 付款的 Guide/Detector/Advisor 自然入口做小范围转换实验，保留付费个性化产品边界。

**P0-2 Decision：** Gentle Monster 的2笔来源付费均 attached Advisor；2笔付款后共关联12个 Consumer Try-On、其中9个完成，且2笔均对应付款用户后续有成功 Try-On。`BRAND-LANDING → PAYMENT → USER-LEVEL TRY-ON = VERIFIED`，但没有逐次 task 的实际镜框品牌/商品 ID 或可审计同会话品牌来源，**`ACTUAL GENTLE MONSTER SKU TRY-ON = UNVERIFIED`**；不能扩张9→90品牌，也不能声称品牌试戴已实现10×。

### 13.3 失败 Checkout 与账务差额

第二轮 Q2：**14条 FAILED Payment，合计标价 $41.86，全部 statusReason=checkout_session_expired**，即结账会话过期/未完成，不是14次支付方式拒绝，也不是收入。GA4恰好14 purchase/$41.86属数值巧合，未经 stripeSessionId 关联不能推断为同一批交易。

第二轮 Q3：COMPLETED Payment 21 CREDITS_PACK/$62.79 + 1 PREMIUM_MONTHLY/$8.99，均 `stripe_webhook_paid`，且 createdAt 全在同期窗口内。**Stripe 用户提供的对账为20 Credits Pack/$59.80 +2月订阅/$17.98，共22笔/$77.78；Neon 总金额差$6、类型各差1，仍不可称逐单 reconcile PASS。** 当前代码 `invoice.payment_succeeded` 重置订阅配额但不记独立 Payment 收入行，可能解释部分续费漏记；必须核对 Stripe Checkout Session/Invoice/PaymentIntent ID 和具体事件时间后才能 RCA。

**行动门槛：** (1) Stripe/Neon 一笔笔对账消除$6差额或确认其原因；(2) 完整成熟7天的 paid-buyer task 窗口重新核算去重用户及避免交叉 cohort；(3) Axiom/GA4 的品牌页面→具体试戴同会话链路或合法品牌SKU来源证据。现阶段停止无依据的批量品牌内容扩张。
