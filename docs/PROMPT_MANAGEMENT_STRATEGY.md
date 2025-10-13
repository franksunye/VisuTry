# Prompt 管理工程化方案

## 📋 目录
1. [需求分析](#需求分析)
2. [行业最佳实践](#行业最佳实践)
3. [推荐方案对比](#推荐方案对比)
4. [实施方案](#实施方案)
5. [A/B 测试策略](#ab-测试策略)
6. [实施路线图](#实施路线图)

---

## 需求分析

### 核心需求
1. ✅ **代码与 Prompt 分离** - Prompt 修改不需要改动代码
2. ✅ **版本管理** - 跟踪 prompt 的历史版本
3. ✅ **动态加载** - 运行时获取最新 prompt
4. ✅ **A/B 测试** - 对比不同 prompt 的效果
5. ✅ **易于协作** - 非技术人员也能修改 prompt
6. ✅ **环境隔离** - dev/staging/production 使用不同 prompt

### 当前痛点
- ❌ Prompt 硬编码在 `src/lib/gemini.ts` 中
- ❌ 修改 prompt 需要改代码、提交、部署
- ❌ 无法快速测试不同版本
- ❌ 无法进行 A/B 测试
- ❌ 无版本历史记录

---

## 行业最佳实践

### 🏆 主流方案对比

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| **1. 配置文件 (JSON/YAML)** | 简单、免费、易于版本控制 | 需要重新部署、无 UI | 小型项目、快速迭代 |
| **2. 数据库存储** | 动态更新、支持 A/B 测试 | 需要额外基础设施 | 中大型项目 |
| **3. 环境变量** | 简单、安全 | 不适合长文本、难以管理 | 简单配置 |
| **4. Prompt 管理平台** | 功能完善、UI 友好 | 成本高、依赖第三方 | 企业级应用 |
| **5. CMS/Headless CMS** | 非技术人员友好、版本控制 | 需要额外服务 | 内容驱动型应用 |

### 🔧 主流工具

#### 专业 Prompt 管理平台
1. **PromptLayer** - 最流行的 prompt 管理平台
   - ✅ Prompt 版本控制
   - ✅ A/B 测试
   - ✅ 分析和监控
   - ❌ 付费服务

2. **Langfuse** - 开源 LLM 工程平台
   - ✅ 开源免费
   - ✅ Prompt 管理和版本控制
   - ✅ A/B 测试
   - ✅ 可自托管

3. **LangSmith** (LangChain)
   - ✅ 与 LangChain 深度集成
   - ✅ Prompt Hub
   - ❌ 主要面向 LangChain 用户

4. **Helicone** - LLM 可观测性平台
   - ✅ Prompt 版本控制
   - ✅ 成本追踪
   - ✅ 缓存功能

---

## 推荐方案对比

### 方案 A: 本地 JSON 文件 + Git 版本控制 ⭐ 推荐（短期）

**架构**:
```
prompts/
  ├── try-on/
  │   ├── v1.json
  │   ├── v2.json
  │   └── current.json (symlink or copy)
  └── schema.json
```

**优点**:
- ✅ 零成本
- ✅ 简单易实现
- ✅ Git 天然版本控制
- ✅ 支持代码审查
- ✅ 可以快速切换版本

**缺点**:
- ❌ 需要重新部署
- ❌ 无法动态 A/B 测试
- ❌ 无 UI 界面

**适用性**: ⭐⭐⭐⭐⭐
- 当前阶段最合适
- 快速迭代测试
- 成本为零

---

### 方案 B: Supabase 数据库存储 ⭐⭐ 推荐（中期）

**架构**:
```sql
CREATE TABLE prompts (
  id UUID PRIMARY KEY,
  name VARCHAR(100),
  version VARCHAR(20),
  content TEXT,
  model VARCHAR(50),
  is_active BOOLEAN,
  environment VARCHAR(20), -- dev/staging/production
  metadata JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**优点**:
- ✅ 动态更新（无需重新部署）
- ✅ 支持 A/B 测试
- ✅ 已有 Supabase 基础设施
- ✅ 可以构建管理 UI
- ✅ 支持环境隔离

**缺点**:
- ❌ 需要开发管理界面
- ❌ 增加系统复杂度

**适用性**: ⭐⭐⭐⭐
- 产品成熟后
- 需要频繁调整 prompt
- 需要 A/B 测试

---

### 方案 C: Vercel Edge Config ⭐⭐⭐ 推荐（中期）

**特点**:
- Vercel 原生支持
- 超低延迟（边缘缓存）
- 无需额外数据库
- 支持动态更新

**优点**:
- ✅ 与 Vercel 深度集成
- ✅ 极低延迟（<1ms）
- ✅ 免费额度充足
- ✅ 简单易用

**缺点**:
- ❌ 锁定 Vercel 平台
- ❌ 免费版有限制（1KB 存储）

**适用性**: ⭐⭐⭐⭐
- 如果长期使用 Vercel
- 需要低延迟
- Prompt 不太大

---

### 方案 D: 开源平台 Langfuse ⭐⭐⭐ 推荐（长期）

**特点**:
- 开源免费
- 功能完善
- 可自托管

**优点**:
- ✅ 专业的 prompt 管理
- ✅ A/B 测试内置
- ✅ 分析和监控
- ✅ 开源可控

**缺点**:
- ❌ 需要额外部署
- ❌ 学习曲线

**适用性**: ⭐⭐⭐
- 企业级需求
- 多个 AI 功能
- 需要专业工具

---

## 实施方案

### 🚀 阶段 1: 本地 JSON 文件方案（立即实施）

#### 1.1 目录结构
```
prompts/
  ├── README.md                    # Prompt 管理说明
  ├── schema.json                  # Prompt 结构定义
  ├── try-on/
  │   ├── versions/
  │   │   ├── v1-original.json    # 第一版（当前最好）
  │   │   ├── v2-detailed.json    # 第二版
  │   │   └── v3-overlay.json     # 第三版
  │   ├── active.json              # 当前激活版本
  │   └── experiments/
  │       ├── exp-001-natural.json
  │       └── exp-002-photoshop.json
  └── utils/
      └── validator.ts             # Prompt 验证工具
```

#### 1.2 Prompt JSON 结构
```json
{
  "id": "try-on-v1",
  "name": "Virtual Try-On - Original",
  "version": "1.0.0",
  "model": "gemini-2.0-flash-preview-image-generation",
  "description": "Original simple prompt that works best",
  "author": "Team",
  "createdAt": "2025-01-13",
  "tags": ["try-on", "glasses", "production"],
  "prompt": {
    "system": "You are an expert at virtual glasses try-on.",
    "user": "I will provide you with two images:\n1. A person's face photo\n2. A pair of glasses\n\nPlease create a photorealistic image where the glasses are naturally placed on the person's face.\n\nRequirements:\n- Position the glasses correctly on the nose bridge and ears\n- Match the perspective and angle of the face\n- Adjust the size of the glasses to fit the face proportionally\n- Match the lighting conditions of the original photo\n- Ensure the glasses look natural and realistic\n- Preserve the person's facial features and expression\n- Make sure the glasses don't obscure important facial features unnaturally"
  },
  "parameters": {
    "temperature": 0.7,
    "maxTokens": 2048
  },
  "metadata": {
    "testResults": {
      "successRate": 0.95,
      "avgProcessingTime": 4.5,
      "userSatisfaction": 4.2
    }
  }
}
```

#### 1.3 代码实现

**prompts/utils/loader.ts**:
```typescript
import fs from 'fs'
import path from 'path'

export interface PromptConfig {
  id: string
  name: string
  version: string
  model: string
  description: string
  prompt: {
    system?: string
    user: string
  }
  parameters?: {
    temperature?: number
    maxTokens?: number
  }
  metadata?: any
}

export class PromptLoader {
  private static cache: Map<string, PromptConfig> = new Map()

  static load(promptPath: string): PromptConfig {
    // Check cache first
    if (this.cache.has(promptPath)) {
      return this.cache.get(promptPath)!
    }

    // Load from file
    const fullPath = path.join(process.cwd(), 'prompts', promptPath)
    const content = fs.readFileSync(fullPath, 'utf-8')
    const config = JSON.parse(content) as PromptConfig

    // Validate
    this.validate(config)

    // Cache
    this.cache.set(promptPath, config)

    return config
  }

  static loadActive(category: string): PromptConfig {
    return this.load(`${category}/active.json`)
  }

  private static validate(config: PromptConfig): void {
    if (!config.id || !config.prompt?.user) {
      throw new Error('Invalid prompt configuration')
    }
  }

  static clearCache(): void {
    this.cache.clear()
  }
}


---

### 🗄️ 阶段 3: Supabase 数据库方案（可选）

#### 3.1 数据库 Schema

**prisma/schema.prisma** (添加):
```prisma
model Prompt {
  id          String   @id @default(cuid())
  name        String
  category    String   // 'try-on', 'analysis', etc.
  version     String
  content     String   @db.Text
  model       String
  isActive    Boolean  @default(false)
  environment String   @default("production") // dev/staging/production
  metadata    Json?

  // A/B Testing
  experimentId String?
  variantId    String?
  weight       Float?   @default(1.0)

  // Analytics
  usageCount   Int      @default(0)
  successRate  Float?
  avgDuration  Float?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([category, isActive, environment])
  @@index([experimentId])
}

model PromptExecution {
  id           String   @id @default(cuid())
  promptId     String
  userId       String
  success      Boolean
  duration     Float    // milliseconds
  errorMessage String?
  metadata     Json?
  createdAt    DateTime @default(now())

  user         User     @relation(fields: [userId], references: [id])

  @@index([promptId, createdAt])
  @@index([userId, createdAt])
}
```

#### 3.2 Prompt 管理 API

**src/app/api/admin/prompts/route.ts**:
```typescript
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"

// GET /api/admin/prompts - List all prompts
export async function GET(req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const environment = searchParams.get('environment') || 'production'

  const prompts = await prisma.prompt.findMany({
    where: {
      category: category || undefined,
      environment
    },
    orderBy: { createdAt: 'desc' }
  })

  return NextResponse.json({ prompts })
}

// POST /api/admin/prompts - Create new prompt
export async function POST(req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const data = await req.json()

  const prompt = await prisma.prompt.create({
    data: {
      name: data.name,
      category: data.category,
      version: data.version,
      content: data.content,
      model: data.model,
      isActive: data.isActive || false,
      environment: data.environment || 'production',
      metadata: data.metadata
    }
  })

  return NextResponse.json({ prompt })
}
```

#### 3.3 动态 Prompt 加载器

**src/lib/prompt-manager.ts**:
```typescript
import { prisma } from './prisma'

export class PromptManager {
  private static cache: Map<string, any> = new Map()
  private static cacheTTL = 60000 // 1 minute

  static async getActivePrompt(
    category: string,
    environment: string = process.env.NODE_ENV || 'production'
  ) {
    const cacheKey = `${category}:${environment}`
    const cached = this.cache.get(cacheKey)

    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data
    }

    const prompt = await prisma.prompt.findFirst({
      where: {
        category,
        environment,
        isActive: true
      },
      orderBy: { updatedAt: 'desc' }
    })

    if (!prompt) {
      throw new Error(`No active prompt found for ${category}`)
    }

    this.cache.set(cacheKey, {
      data: prompt,
      timestamp: Date.now()
    })

    return prompt
  }

  static async logExecution(
    promptId: string,
    userId: string,
    success: boolean,
    duration: number,
    errorMessage?: string
  ) {
    await prisma.promptExecution.create({
      data: {
        promptId,
        userId,
        success,
        duration,
        errorMessage
      }
    })

    // Update prompt statistics
    await this.updatePromptStats(promptId)
  }

  private static async updatePromptStats(promptId: string) {
    const executions = await prisma.promptExecution.findMany({
      where: { promptId },
      select: {
        success: true,
        duration: true
      }
    })

    const successRate = executions.filter(e => e.success).length / executions.length
    const avgDuration = executions.reduce((sum, e) => sum + e.duration, 0) / executions.length

    await prisma.prompt.update({
      where: { id: promptId },
      data: {
        usageCount: executions.length,
        successRate,
        avgDuration
      }
    })
  }
}
```

---

## A/B 测试策略

### 测试框架

#### 1. 实验设计
```typescript
interface Experiment {
  id: string
  name: string
  hypothesis: string
  variants: Variant[]
  metrics: Metric[]
  sampleSize: number
  duration: number // days
  status: 'draft' | 'running' | 'completed' | 'cancelled'
}

interface Variant {
  id: string
  name: string
  promptId: string
  weight: number // 0-1, sum should be 1
}

interface Metric {
  name: string
  type: 'success_rate' | 'duration' | 'user_rating' | 'custom'
  target?: number
}
```

#### 2. 用户分配策略

**一致性哈希**（推荐）:
```typescript
function assignVariant(userId: string, experiment: Experiment): Variant {
  // Use consistent hashing to ensure same user always gets same variant
  const hash = hashString(`${experiment.id}:${userId}`)
  const normalized = hash / MAX_HASH_VALUE

  let cumulative = 0
  for (const variant of experiment.variants) {
    cumulative += variant.weight
    if (normalized < cumulative) {
      return variant
    }
  }

  return experiment.variants[0]
}
```

#### 3. 结果分析

**src/lib/ab-analytics.ts**:
```typescript
export class ABAnalytics {
  static async getExperimentResults(experimentId: string) {
    const executions = await prisma.promptExecution.findMany({
      where: {
        prompt: {
          experimentId
        }
      },
      include: {
        prompt: true
      }
    })

    // Group by variant
    const byVariant = new Map()
    for (const exec of executions) {
      const variantId = exec.prompt.variantId
      if (!byVariant.has(variantId)) {
        byVariant.set(variantId, [])
      }
      byVariant.get(variantId).push(exec)
    }

    // Calculate metrics for each variant
    const results = []
    for (const [variantId, execs] of byVariant) {
      results.push({
        variantId,
        sampleSize: execs.length,
        successRate: execs.filter(e => e.success).length / execs.length,
        avgDuration: execs.reduce((sum, e) => sum + e.duration, 0) / execs.length,
        p95Duration: this.percentile(execs.map(e => e.duration), 0.95)
      })
    }

    // Statistical significance test
    const significance = this.calculateSignificance(results)

    return {
      results,
      significance,
      winner: this.determineWinner(results, significance)
    }
  }

  private static calculateSignificance(results: any[]): any {
    // Implement chi-square test or t-test
    // For simplicity, using basic comparison
    if (results.length < 2) return null

    const [control, treatment] = results
    const diff = Math.abs(control.successRate - treatment.successRate)

    // Simple threshold-based significance (should use proper statistical test)
    return {
      isSignificant: diff > 0.05,
      pValue: null, // TODO: implement proper test
      confidenceLevel: 0.95
    }
  }

  private static determineWinner(results: any[], significance: any): string | null {
    if (!significance?.isSignificant) return null

    return results.reduce((best, current) =>
      current.successRate > best.successRate ? current : best
    ).variantId
  }

  private static percentile(values: number[], p: number): number {
    const sorted = values.sort((a, b) => a - b)
    const index = Math.ceil(sorted.length * p) - 1
    return sorted[index]
  }
}
```

---

## 实施路线图

### 🎯 Phase 1: 基础设施（1-2 天）

**目标**: 实现 prompt 与代码分离

- [ ] 创建 `prompts/` 目录结构
- [ ] 定义 JSON schema
- [ ] 实现 PromptLoader 工具类
- [ ] 迁移现有 prompt 到 JSON 文件
- [ ] 更新 `src/lib/gemini.ts` 使用 PromptLoader
- [ ] 添加单元测试
- [ ] 文档更新

**验收标准**:
- ✅ Prompt 存储在独立 JSON 文件中
- ✅ 代码通过 PromptLoader 加载 prompt
- ✅ 可以通过修改 JSON 文件切换 prompt 版本
- ✅ 测试通过

---

### 🧪 Phase 2: 版本管理和测试（2-3 天）

**目标**: 支持多版本管理和简单 A/B 测试

- [ ] 创建多个 prompt 版本文件
- [ ] 实现版本切换机制
- [ ] 实现简单的 A/B 测试框架
- [ ] 添加 prompt 验证工具
- [ ] 创建 prompt 测试脚本
- [ ] 添加性能监控

**验收标准**:
- ✅ 可以轻松切换不同版本
- ✅ 支持基于用户 ID 的 A/B 测试
- ✅ 有测试工具验证 prompt 效果
- ✅ 记录每个版本的性能指标

---

### 📊 Phase 3: 数据库集成（可选，3-5 天）

**目标**: 实现动态 prompt 管理

- [ ] 添加 Prisma schema
- [ ] 创建数据库迁移
- [ ] 实现 PromptManager 类
- [ ] 创建管理 API
- [ ] 构建简单的管理 UI
- [ ] 实现缓存机制
- [ ] 添加分析功能

**验收标准**:
- ✅ Prompt 存储在数据库中
- ✅ 可以通过 UI 管理 prompt
- ✅ 支持动态更新（无需重新部署）
- ✅ 有完整的分析数据

---

### 🎨 Phase 4: 高级功能（可选，5-7 天）

**目标**: 企业级 prompt 管理

- [ ] 集成 Langfuse 或类似平台
- [ ] 实现高级 A/B 测试
- [ ] 添加 prompt 模板系统
- [ ] 实现多语言支持
- [ ] 添加 prompt 优化建议
- [ ] 集成 LLM 评估工具

---

## 最佳实践建议

### 1. Prompt 命名规范
```
{category}-{version}-{variant}.json

例如:
- try-on-v1-original.json
- try-on-v2-detailed.json
- try-on-v1-exp-natural.json
```

### 2. 版本控制策略
- 使用语义化版本号（Semantic Versioning）
- 主版本号：重大改变
- 次版本号：功能增加
- 修订号：小修复

### 3. 测试流程
1. 在 `experiments/` 目录创建新 prompt
2. 本地测试验证
3. 移到 `versions/` 目录
4. 更新 `active.json` 指向新版本
5. 部署到 staging 环境
6. A/B 测试
7. 根据数据决定是否推广到 production

### 4. 监控指标
- **成功率**: 生成成功的比例
- **处理时间**: 平均响应时间
- **用户满意度**: 用户评分
- **错误率**: 失败原因分类
- **成本**: API 调用成本

---

## 快速开始

### 立即可实施的最小方案

1. **创建 prompts 目录**:
```bash
mkdir -p prompts/try-on/versions
```

2. **创建第一个 prompt 文件** `prompts/try-on/versions/v1.json`:
```json
{
  "id": "try-on-v1",
  "version": "1.0.0",
  "prompt": "You are an expert at virtual glasses try-on..."
}
```

3. **创建加载器** `prompts/loader.ts`:
```typescript
import fs from 'fs'
import path from 'path'

export function loadPrompt(name: string) {
  const file = path.join(process.cwd(), 'prompts', name)
  return JSON.parse(fs.readFileSync(file, 'utf-8'))
}
```

4. **更新代码**:
```typescript
import { loadPrompt } from '@/prompts/loader'

const config = loadPrompt('try-on/versions/v1.json')
const prompt = config.prompt
```

**完成！** 现在你可以修改 JSON 文件来更新 prompt，无需改动代码。

---

## 总结

### 推荐实施顺序

1. **立即**: Phase 1 - 本地 JSON 文件方案
   - 成本：零
   - 时间：1-2 天
   - 收益：prompt 与代码分离，易于测试

2. **短期**: Phase 2 - 版本管理和 A/B 测试
   - 成本：零
   - 时间：2-3 天
   - 收益：科学的 prompt 优化流程

3. **中期**: Phase 3 - Supabase 数据库方案（如果需要）
   - 成本：低（已有 Supabase）
   - 时间：3-5 天
   - 收益：动态更新，无需重新部署

4. **长期**: Phase 4 - 专业平台（如果规模扩大）
   - 成本：中等（开源自托管）或高（SaaS）
   - 时间：5-7 天
   - 收益：企业级功能

### 关键成功因素

- ✅ 从简单开始，逐步演进
- ✅ 数据驱动决策（A/B 测试）
- ✅ 保持灵活性（不过早优化）
- ✅ 文档化所有 prompt 变更
- ✅ 建立测试和评估流程


