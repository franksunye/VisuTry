# 🧭 VisuTry GTM + SEO 增长策略手册

**版本 1.0 | 适用于 2025 Q4 ~ 2026 Q2**

---

## 一、总体目标与战略定位

### 🎯 核心目标

构建一个以 **“AI虚拟眼镜试戴工具”** 为核心的增长引擎，通过：

1. SEO + 内容营销获取自然流量；
2. 工具功能吸引用户体验；
3. 工具嵌入与品牌合作推动商业转化。

---

### 💡 核心增长逻辑：内容 × 工具双引擎

| 引擎                        | 目标      | 形式             | 转化路径              |
| ------------------------- | ------- | -------------- | ----------------- |
| **内容引擎（Content SEO）**     | 获取精准流量  | 博客 / 教程 / 对比文章 | 搜索 → 内容 → 工具体验    |
| **工具引擎（Product-Led SEO）** | 提升停留与转化 | 在线试戴工具 / 程序化页面 | 搜索 → 功能 → 注册 / 合作 |

---

## 二、SEO战略蓝图

### 1️⃣ 关键词战略

关键词分三类：

| 类别             | 示例关键词                                 | 意图        |
| -------------- | ------------------------------------- | --------- |
| **工具型（高转化）**   | “虚拟眼镜试戴”、"AI glasses try-on"、“在线试眼镜”  | 明确使用工具意图  |
| **产品/品牌型（长尾）** | “Ray-Ban 眼镜试戴”、“Gentle Monster 太阳镜试戴” | 品牌精准流量    |
| **教育型（引导）**    | “如何选适合自己脸型的眼镜”、“圆脸适合什么眼镜”             | 流量入口、品牌认知 |

💡 建议：
优先布局「工具型 + 品牌型」，后续扩展教育型。

#### ✅ **当前关键词配置状态（已实施 - 2025-10-21）**

**核心关键词（Core Keywords）：**
- virtual glasses try-on
- AI glasses try-on
- online glasses fitting
- virtual eyewear try-on
- glasses try-on tool

**功能关键词（Feature Keywords）：**
- face shape glasses matcher
- smart glasses recommendation
- AI-powered eyewear fitting
- virtual frame fitting
- online optical try-on

**长尾关键词（Long-tail Keywords）：**
- best glasses for round face
- how to choose glasses online
- prescription glasses virtual try-on
- try on glasses before buying
- virtual glasses fitting app
- online eyewear shopping tool

**品牌关键词（Brand Keywords）：**
- Ray-Ban virtual try-on
- designer glasses online
- premium eyewear try-on
- luxury glasses virtual fitting

**问题解决型关键词（Problem-solving Keywords）：**
- find perfect glasses online
- glasses shopping made easy
- try glasses without visiting store

**总计：27个关键词** 覆盖不同用户搜索意图和转化阶段。

**关键词管理方式：**
- 集中配置在 `src/lib/seo.ts` 文件
- 使用分层结构（core, features, longTail, brands, problemSolving）
- 支持按页面类型动态选择关键词组合
- 无需每个页面单独配置，统一维护

---

### 2️⃣ 内容结构（Content Architecture）

#### 目录规划：

```
/blog
  ├── how-to-choose-glasses-for-your-face
  ├── round-face-best-glasses
  ├── ai-glasses-tryon-tools-comparison
  ├── rayban-try-on-guide
  ├── best-glasses-for-students
```

#### 每篇文章结构模板：

| 区块    | 内容示例                             |
| ----- | -------------------------------- |
| H1    | 圆脸适合什么眼镜？附AI试戴体验                 |
| 引言    | 为什么选对眼镜这么难？                      |
| 主体    | 脸型分析 + 风格建议                      |
| 插入工具  | 👉「立即上传照片试戴看看！」（嵌入VisuTry）       |
| 结论    | 鼓励分享或收藏                          |
| SEO优化 | meta、title、结构化数据（Article Schema） |

---

### 3️⃣ 工具型SEO（Programmatic SEO）

利用工具生成大量 **可索引页面**：

| 页面类型   | URL 示例                      | 内容要素                     |
| ------ | --------------------------- | ------------------------ |
| 品牌/型号页 | `/try/rayban-rx5121`        | 眼镜图 + 试戴模块 + 产品描述 + 相似推荐 |
| 脸型风格页  | `/style/round-face-glasses` | 推荐眼镜 + 试戴入口              |
| 类别页    | `/try/sunglasses`           | 类别导航 + 热门款式 + 试戴入口       |

每个页面：

* 静态生成（Next.js `getStaticProps`）
* 含独立 meta/title
* 提供试戴入口（或预加载功能）
* 收录到 sitemap.xml

📈 目标：生成 **1000+ 长尾可索引URL**，覆盖眼镜品牌生态。

---

## 三、执行路线图

| 阶段                       | 时间    | 目标         | 关键任务                                                       | 状态 |
| ------------------------ | ----- | ---------- | ---------------------------------------------------------- | --- |
| **阶段1：SEO基础建设**          | 第1月   | 可被Google识别 | robots.txt / sitemap.xml / meta优化 / GA4 / Search Console接入 | ✅ 已完成 |
| **阶段1.5：关键词优化**          | 第1月   | 提升关键词覆盖 | 扩展关键词至27个 / 优化页面内容关键词密度 / 分层关键词管理 | ✅ 已完成 (2025-10-21) |
| **阶段2：内容中心建设**           | 第2~3月 | 建立流量入口     | `/blog`结构搭建 + 每周2篇内容                                       | 🔄 进行中 |
| **阶段3：Programmatic SEO** | 第3~6月 | 扩展规模化页面    | 自动生成品牌/款式试戴页                                               | ⏳ 待开始 |
| **阶段4：外链与传播**            | 第4~7月 | 提升权重       | 在 Reddit / Medium / 产品榜单投稿                                 | ⏳ 待开始 |
| **阶段5：分析与转化优化**          | 第5~9月 | 追踪效果并优化    | GA4 + 热图 + 试戴转化漏斗分析                                        | ⏳ 待开始 |

---

## 四、网站技术与结构优化

### 🔧 技术建议（Next.js）

1. **静态生成（SSG）**

   * 内容页与品牌试戴页使用 `getStaticProps` 生成
   * 确保每个页面在构建时就生成 HTML（可被Google索引）

2. **动态试戴模块**

   * 用 `<iframe>` 或组件异步加载
   * 避免阻塞首屏加载速度

3. **SEO元数据自动化**

   * 使用 Next.js 的 `next-seo` 插件
   * 自动为每个试戴页生成：

     ```js
     <title>Ray-Ban RX5121 虚拟试戴 | VisuTry</title>
     <meta name="description" content="在线试戴 Ray-Ban RX5121，看看是否适合你。支持AI脸型识别。">
     ```

4. **多语言支持**

   * 使用 `next-i18next`
   * 中英文页面各自优化关键词（例：“虚拟眼镜试戴” vs “virtual glasses try-on”）

---

## 五、内容生产计划

| 周期  | 目标        | 内容类型                             | 发布节奏 |
| --- | --------- | -------------------------------- | ---- |
| 每周  | 教育型 + 工具型 | 「如何选眼镜」、「最佳AI试戴工具」               | 1~2篇 |
| 每两周 | 品牌/款式     | 「Ray-Ban 试戴」、「Gentle Monster 试戴」 | 1篇   |
| 每月  | 合作/案例     | 「如何将VisuTry嵌入你的电商网站」             | 1篇   |

💡 每篇文章都应引导用户：

> “上传照片立即试戴” → 跳转到 `/try` 页面。

这一步是转化关键。

---

## 六、追踪与分析体系

### 📊 必备工具

| 工具                             | 用途         |
| ------------------------------ | ---------- |
| **Google Analytics 4 (GA4)**   | 用户行为与转化追踪  |
| **Google Search Console**      | 关键词排名、索引监控 |
| **Vercel Analytics**           | 页面访问与性能监控  |
| **Hotjar / Microsoft Clarity** | 热图、滚动深度分析  |
| **Ahrefs / SEMrush**           | 外链与关键词竞争分析 |

### 🔁 关键指标（KPI）

| 指标      | 目标（6个月内）      |
| ------- | ------------- |
| 每月自然访问量 | ≥ 10,000      |
| 主要关键词排名 | Top 10 至少 5 个 |
| 平均停留时长  | > 1分30秒       |
| 工具试戴转化率 | ≥ 3%          |
| 邮件/注册转化 | ≥ 2%          |

---

## 七、品牌与传播建议

| 渠道                              | 内容类型                | 目的             |
| ------------------------------- | ------------------- | -------------- |
| **Product Hunt / IndieHackers** | 产品发布介绍              | 获取初期曝光与反馈      |
| **Medium / Substack**           | 技术 + 产品文章           | 展示技术实力，提升权威性   |
| **Reddit / Twitter (X)**        | 有趣试戴内容              | 获取自然传播         |
| **合作伙伴页面**                      | “Integrate VisuTry” | 为B端客户提供API接入说明 |

---

## 八、长期发展方向（GTM扩展）

1. **B2B商业化路径**

   * 提供 iframe / JS SDK 嵌入试戴模块
   * SaaS化收费（按月 / 按API调用）
2. **B2C社区扩展**

   * 用户上传照片 → 保存试戴图 → 可分享社交平台
   * 形成“UGC内容 + 二次SEO流量”
3. **AI推荐算法**

   * 通过脸型识别 + 推荐算法 → “最适合你脸型的眼镜”
   * 提升转化率与品牌壁垒

---

## ✅ 最后总结

| 模块     | 核心动作                 | 目标      |
| ------ | -------------------- | ------- |
| 内容中心   | 每周发布文章，嵌入试戴工具        | 获取自然流量  |
| 工具页SEO | 程序化生成品牌/款式页面         | 扩展长尾流量  |
| 技术优化   | 静态化 + 多语言 + Schema   | 提升收录率   |
| 数据分析   | GA4 + Search Console | 精准追踪效果  |
| 品牌传播   | 技术社区 + 产品榜单曝光        | 品牌信任度提升 |

---

是否希望我将这份手册导出成一份 **PDF 文件（《VisuTry GTM + SEO策略执行手册》）**，方便你在团队内部共享和打印？
（我可以自动格式化、分页、生成标题目录和章节结构）
