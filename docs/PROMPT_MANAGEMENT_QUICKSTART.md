# Prompt 管理快速开始指南

## 🚀 5 分钟实施 Prompt 分离

这是一个最小化的实施方案，让你立即开始使用 prompt 管理。

---

## 步骤 1: 创建目录结构

```bash
mkdir -p prompts/try-on/versions
mkdir -p prompts/utils
```

---

## 步骤 2: 创建 Prompt 文件

### `prompts/try-on/versions/v1-original.json`

```json
{
  "id": "try-on-v1-original",
  "name": "Virtual Try-On - Original (Best)",
  "version": "1.0.0",
  "model": "gemini-2.0-flash-preview-image-generation",
  "description": "Original simple prompt that works best - preserves face while adding glasses naturally",
  "author": "Team",
  "createdAt": "2025-01-13",
  "tags": ["try-on", "glasses", "production", "best-performer"],
  "prompt": "You are an expert at virtual glasses try-on. I will provide you with two images:\n1. A person's face photo\n2. A pair of glasses\n\nPlease create a photorealistic image where the glasses are naturally placed on the person's face.\n\nRequirements:\n- Position the glasses correctly on the nose bridge and ears\n- Match the perspective and angle of the face\n- Adjust the size of the glasses to fit the face proportionally\n- Match the lighting conditions of the original photo\n- Ensure the glasses look natural and realistic\n- Preserve the person's facial features and expression\n- Make sure the glasses don't obscure important facial features unnaturally",
  "parameters": {
    "temperature": 0.7,
    "responseModalities": ["IMAGE", "TEXT"]
  },
  "metadata": {
    "testResults": {
      "successRate": 0.95,
      "avgProcessingTime": 4.5,
      "preservesFaceQuality": "excellent",
      "notes": "Best balance between preserving original photo and natural glasses placement"
    }
  }
}
```

### `prompts/try-on/active.json`

```json
{
  "activeVersion": "v1-original",
  "lastUpdated": "2025-01-13T10:00:00Z",
  "updatedBy": "system"
}
```

---

## 步骤 3: 创建 Prompt 加载器

### `prompts/utils/loader.ts`

```typescript
import fs from 'fs'
import path from 'path'

export interface PromptConfig {
  id: string
  name: string
  version: string
  model: string
  description: string
  prompt: string
  parameters?: {
    temperature?: number
    responseModalities?: string[]
    [key: string]: any
  }
  metadata?: any
}

export interface ActiveConfig {
  activeVersion: string
  lastUpdated: string
  updatedBy: string
}

export class PromptLoader {
  private static cache: Map<string, PromptConfig> = new Map()
  private static cacheTimestamp: Map<string, number> = new Map()
  private static cacheTTL = 60000 // 1 minute in development, can be longer in production
  
  /**
   * Load a specific prompt version
   */
  static load(category: string, version: string): PromptConfig {
    const cacheKey = `${category}:${version}`
    
    // Check cache
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey)!
    }
    
    // Load from file
    const filePath = path.join(
      process.cwd(),
      'prompts',
      category,
      'versions',
      `${version}.json`
    )
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`Prompt file not found: ${filePath}`)
    }
    
    const content = fs.readFileSync(filePath, 'utf-8')
    const config = JSON.parse(content) as PromptConfig
    
    // Validate
    this.validate(config)
    
    // Cache
    this.cache.set(cacheKey, config)
    this.cacheTimestamp.set(cacheKey, Date.now())
    
    return config
  }
  
  /**
   * Load the currently active prompt for a category
   */
  static loadActive(category: string): PromptConfig {
    // Load active configuration
    const activeConfigPath = path.join(
      process.cwd(),
      'prompts',
      category,
      'active.json'
    )
    
    if (!fs.existsSync(activeConfigPath)) {
      throw new Error(`Active config not found for category: ${category}`)
    }
    
    const activeConfig = JSON.parse(
      fs.readFileSync(activeConfigPath, 'utf-8')
    ) as ActiveConfig
    
    // Load the active version
    return this.load(category, activeConfig.activeVersion)
  }
  
  /**
   * List all available versions for a category
   */
  static listVersions(category: string): string[] {
    const versionsDir = path.join(
      process.cwd(),
      'prompts',
      category,
      'versions'
    )
    
    if (!fs.existsSync(versionsDir)) {
      return []
    }
    
    return fs.readdirSync(versionsDir)
      .filter(file => file.endsWith('.json'))
      .map(file => file.replace('.json', ''))
  }
  
  /**
   * Validate prompt configuration
   */
  private static validate(config: PromptConfig): void {
    if (!config.id) {
      throw new Error('Prompt config missing required field: id')
    }
    if (!config.prompt) {
      throw new Error('Prompt config missing required field: prompt')
    }
    if (!config.version) {
      throw new Error('Prompt config missing required field: version')
    }
  }
  
  /**
   * Check if cache is still valid
   */
  private static isCacheValid(key: string): boolean {
    if (!this.cache.has(key)) {
      return false
    }
    
    const timestamp = this.cacheTimestamp.get(key)
    if (!timestamp) {
      return false
    }
    
    return Date.now() - timestamp < this.cacheTTL
  }
  
  /**
   * Clear cache (useful for testing or hot reload)
   */
  static clearCache(): void {
    this.cache.clear()
    this.cacheTimestamp.clear()
  }
  
  /**
   * Get cache statistics
   */
  static getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }
}
```

---

## 步骤 4: 更新 Gemini 代码

### `src/lib/gemini.ts` (修改部分)

```typescript
import { PromptLoader } from '@/prompts/utils/loader'

export async function generateTryOnImage({
  userImageUrl,
  glassesImageUrl,
  promptOverride
}: TryOnRequest): Promise<TryOnResult> {
  // ... existing code ...
  
  try {
    const totalStartTime = Date.now()
    console.log("🎨 Starting Gemini 2.0 Flash Image Generation virtual try-on...")
    
    // Load prompt from JSON file instead of hardcoding
    const promptConfig = PromptLoader.loadActive('try-on')
    console.log(`📝 Using prompt: ${promptConfig.name} (${promptConfig.version})`)
    
    // Use Gemini 2.0 Flash Preview Image Generation
    const model = genAI.getGenerativeModel({
      model: promptConfig.model,
      generationConfig: {
        // @ts-ignore - responseModalities is not in the type definition yet
        responseModalities: promptConfig.parameters?.responseModalities || ["IMAGE", "TEXT"]
      }
    })
    
    // ... existing image loading code ...
    
    // Use prompt from config
    const tryOnPrompt = promptOverride || promptConfig.prompt
    
    // ... rest of existing code ...
  }
}
```

---

## 步骤 5: 测试

### 创建测试脚本 `scripts/test-prompt-loader.ts`

```typescript
import { PromptLoader } from '../prompts/utils/loader'

async function testPromptLoader() {
  console.log('🧪 Testing Prompt Loader...\n')
  
  try {
    // Test 1: Load active prompt
    console.log('Test 1: Load active prompt')
    const activePrompt = PromptLoader.loadActive('try-on')
    console.log('✅ Active prompt loaded:', activePrompt.name)
    console.log('   Version:', activePrompt.version)
    console.log('   Model:', activePrompt.model)
    console.log('   Prompt length:', activePrompt.prompt.length, 'characters\n')
    
    // Test 2: List all versions
    console.log('Test 2: List all versions')
    const versions = PromptLoader.listVersions('try-on')
    console.log('✅ Available versions:', versions.join(', '), '\n')
    
    // Test 3: Load specific version
    console.log('Test 3: Load specific version')
    const v1 = PromptLoader.load('try-on', 'v1-original')
    console.log('✅ Loaded v1-original:', v1.name, '\n')
    
    // Test 4: Cache statistics
    console.log('Test 4: Cache statistics')
    const stats = PromptLoader.getCacheStats()
    console.log('✅ Cache stats:', stats, '\n')
    
    console.log('🎉 All tests passed!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    process.exit(1)
  }
}

testPromptLoader()
```

运行测试:
```bash
npx ts-node scripts/test-prompt-loader.ts
```

---

## 步骤 6: 添加更多版本（可选）

### `prompts/try-on/versions/v2-detailed.json`

```json
{
  "id": "try-on-v2-detailed",
  "name": "Virtual Try-On - Detailed Instructions",
  "version": "2.0.0",
  "model": "gemini-2.0-flash-preview-image-generation",
  "description": "More detailed prompt with explicit requirements",
  "prompt": "I need you to create a virtual try-on image by compositing two images together.\n\nINPUT IMAGES:\n- First image: A person's face/portrait\n- Second image: A pair of glasses\n\nYOUR TASK:\nCreate a single photorealistic image showing the PERSON from the first image WEARING the GLASSES from the second image.\n\nCRITICAL REQUIREMENTS:\n1. START with the person's face from the first image as your base\n2. PLACE the glasses from the second image ONTO the person's face\n3. The glasses must be positioned on the nose bridge, aligned with the eyes\n4. Scale the glasses proportionally to fit the face size\n5. Match the perspective and angle of the person's face\n6. Blend lighting, shadows, and reflections naturally\n7. Keep all facial features, skin tone, hair, and background from the person's image\n8. The result must look like a real photograph of this person wearing these glasses",
  "metadata": {
    "testResults": {
      "successRate": 0.85,
      "avgProcessingTime": 4.8,
      "notes": "More detailed but sometimes over-constrains the model"
    }
  }
}
```

---

## 使用方法

### 切换 Prompt 版本

只需修改 `prompts/try-on/active.json`:

```json
{
  "activeVersion": "v2-detailed",
  "lastUpdated": "2025-01-13T11:00:00Z",
  "updatedBy": "admin"
}
```

然后重新部署或重启服务（如果有缓存，等待缓存过期）。

### 在代码中使用

```typescript
// 使用当前激活的版本
const prompt = PromptLoader.loadActive('try-on')

// 或者加载特定版本
const v1 = PromptLoader.load('try-on', 'v1-original')
const v2 = PromptLoader.load('try-on', 'v2-detailed')
```

---

## 优势

✅ **代码与 Prompt 分离** - 修改 prompt 不需要改代码
✅ **版本管理** - 所有版本都在 Git 中追踪
✅ **易于切换** - 修改一个 JSON 文件即可
✅ **易于测试** - 可以快速对比不同版本
✅ **零成本** - 不需要额外服务
✅ **类型安全** - TypeScript 支持

---

## 下一步

1. ✅ 实施基础 prompt 加载器（完成）
2. 🔄 添加 A/B 测试支持
3. 🔄 添加性能监控
4. 🔄 考虑数据库存储（如果需要动态更新）

查看完整方案: [PROMPT_MANAGEMENT_STRATEGY.md](./PROMPT_MANAGEMENT_STRATEGY.md)

