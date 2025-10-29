# 📊 VisuTry Programmatic SEO 数据准备指南

**版本 1.0 | 数据结构和导入流程**

---

## 📋 数据集结构

### 1. 品牌数据 (`data/brands.json`)

```json
[
  {
    "id": "rayban",
    "name": "Ray-Ban",
    "displayName": "Ray-Ban",
    "description": "Ray-Ban is a brand of sunglasses and eyeglasses founded in 1936.",
    "website": "https://www.ray-ban.com",
    "logo": "https://...",
    "isActive": true
  },
  {
    "id": "oliver-peoples",
    "name": "Oliver Peoples",
    "displayName": "Oliver Peoples",
    "description": "Oliver Peoples is an American luxury eyewear brand.",
    "website": "https://www.oliverpeoples.com",
    "logo": "https://...",
    "isActive": true
  }
]
```

**字段说明**：
- `id`: 唯一标识符（用于 URL slug）
- `name`: 品牌名称
- `displayName`: 显示名称
- `description`: 品牌描述（用于 SEO）
- `website`: 官方网站
- `logo`: 品牌 logo URL
- `isActive`: 是否激活

**数据来源**：
- 眼镜品牌官网
- 电商平台（Amazon, Warby Parker, Zenni）
- 眼镜评测网站

**目标数量**：50-100 个品牌

---

### 2. 型号数据 (`data/models.json`)

```json
[
  {
    "id": "rayban-rx5121",
    "brand": "rayban",
    "name": "RX5121",
    "displayName": "Ray-Ban RX5121",
    "description": "Classic clubmaster style prescription glasses",
    "imageUrl": "https://...",
    "category": "prescription",
    "style": "clubmaster",
    "material": "acetate",
    "color": "black",
    "price": 149.99,
    "faceShapes": ["round", "oval", "heart"],
    "isActive": true
  }
]
```

**字段说明**：
- `id`: 唯一标识符
- `brand`: 品牌 ID（关联 brands.json）
- `name`: 型号代码
- `displayName`: 显示名称
- `description`: 型号描述
- `imageUrl`: 产品图片 URL
- `category`: 类别 ID（关联 categories.json）
- `style`: 风格（clubmaster, round, cat-eye, etc.）
- `material`: 材质（acetate, metal, plastic）
- `color`: 颜色
- `price`: 价格
- `faceShapes`: 推荐脸型数组
- `isActive`: 是否激活

**数据来源**：
- 品牌官网产品页
- 电商平台产品数据
- 眼镜评测网站

**目标数量**：400-500 个型号

---

### 3. 脸型数据 (`data/face-shapes.json`)

```json
[
  {
    "id": "round",
    "name": "round",
    "displayName": "Round Face",
    "description": "Round faces have equal width and length",
    "characteristics": "Full cheeks, rounded jawline, wider forehead",
    "recommendedStyles": ["square", "rectangular", "angular"],
    "avoidStyles": ["round", "oversized"],
    "isActive": true
  },
  {
    "id": "square",
    "name": "square",
    "displayName": "Square Face",
    "description": "Square faces have strong jawlines",
    "characteristics": "Strong jawline, equal width and length, broad forehead",
    "recommendedStyles": ["round", "oval", "cat-eye"],
    "avoidStyles": ["square", "heavy-frames"],
    "isActive": true
  }
]
```

**脸型列表**：
1. Round（圆脸）
2. Square（方脸）
3. Oval（菱形脸）
4. Heart（心形脸）
5. Oblong（长脸）
6. Diamond（菱形脸）
7. Triangle（三角脸）

**字段说明**：
- `id`: 唯一标识符
- `name`: 脸型名称
- `displayName`: 显示名称
- `description`: 脸型描述
- `characteristics`: 脸型特征
- `recommendedStyles`: 推荐风格
- `avoidStyles`: 避免风格
- `isActive`: 是否激活

**目标数量**：5-7 个脸型

---

### 4. 类别数据 (`data/categories.json`)

```json
[
  {
    "id": "prescription",
    "name": "prescription",
    "displayName": "Prescription Glasses",
    "description": "Prescription glasses for vision correction",
    "isActive": true
  },
  {
    "id": "sunglasses",
    "name": "sunglasses",
    "displayName": "Sunglasses",
    "description": "Sunglasses for UV protection and style",
    "isActive": true
  }
]
```

**类别列表**：
1. Prescription（处方眼镜）
2. Sunglasses（太阳镜）
3. Reading（老花镜）
4. Computer（蓝光眼镜）
5. Sports（运动眼镜）
6. Fashion（时尚眼镜）
7. Vintage（复古眼镜）
8. Designer（设计师眼镜）
9. Budget（经济型眼镜）
10. Premium（高端眼镜）

**目标数量**：10-15 个类别

---

## 🔄 数据导入流程

### 步骤 1：准备 CSV 文件

**frames.csv**：
```
brand,model,displayName,description,imageUrl,category,style,material,color,price,faceShapes
rayban,rx5121,Ray-Ban RX5121,Classic clubmaster style,https://...,prescription,clubmaster,acetate,black,149.99,"round,oval,heart"
```

### 步骤 2：创建导入脚本

**`scripts/import-data.ts`**：
```typescript
import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as csv from 'csv-parse'

const prisma = new PrismaClient()

async function importFrames(filePath: string) {
  const records = []
  const parser = fs.createReadStream(filePath).pipe(csv.parse())
  
  for await (const record of parser) {
    records.push(record)
  }
  
  for (const record of records) {
    await prisma.glassesFrame.create({
      data: {
        brand: record.brand,
        model: record.model,
        name: record.displayName,
        description: record.description,
        imageUrl: record.imageUrl,
        category: record.category,
        isActive: true,
      },
    })
  }
}

// 运行导入
importFrames('data/frames.csv')
  .then(() => console.log('Import completed'))
  .catch(e => console.error(e))
```

### 步骤 3：运行导入

```bash
# 导入品牌
npx tsx scripts/import-data.ts brands

# 导入脸型
npx tsx scripts/import-data.ts face-shapes

# 导入类别
npx tsx scripts/import-data.ts categories

# 导入型号
npx tsx scripts/import-data.ts frames
```

---

## 📈 数据质量检查

### 检查清单

- [ ] 所有品牌都有唯一 ID
- [ ] 所有型号都关联到有效品牌
- [ ] 所有图片 URL 都可访问
- [ ] 所有脸型推荐都有效
- [ ] 没有重复数据
- [ ] 所有必填字段都已填充
- [ ] 价格格式正确
- [ ] 描述长度 50-200 字符

### 验证脚本

```typescript
// scripts/validate-data.ts
async function validateData() {
  const frames = await prisma.glassesFrame.findMany()
  
  for (const frame of frames) {
    if (!frame.brand) console.error(`Frame ${frame.id} missing brand`)
    if (!frame.imageUrl) console.error(`Frame ${frame.id} missing image`)
    if (!frame.description) console.error(`Frame ${frame.id} missing description`)
  }
  
  console.log(`Validated ${frames.length} frames`)
}
```

---

## 🎯 数据优先级

### 第 1 阶段（第 1-2 周）

- [ ] 50 个品牌
- [ ] 200 个型号
- [ ] 5 个脸型
- [ ] 10 个类别

### 第 2 阶段（第 3-4 周）

- [ ] 100 个品牌
- [ ] 400 个型号
- [ ] 7 个脸型
- [ ] 15 个类别

### 第 3 阶段（第 5+ 周）

- [ ] 150+ 个品牌
- [ ] 500+ 个型号
- [ ] 完整脸型覆盖
- [ ] 完整类别覆盖

---

## 📝 数据来源建议

### 品牌和型号

1. **官方网站**
   - Ray-Ban: ray-ban.com
   - Oliver Peoples: oliverpeoples.com
   - Warby Parker: warbyparker.com

2. **电商平台**
   - Amazon: amazon.com/s?k=glasses
   - Zenni: zennioptical.com
   - EyeBuyDirect: eyebuydirect.com

3. **评测网站**
   - Wirecutter: nytimes.com/wirecutter
   - Allure: allure.com
   - Vogue: vogue.com

### 图片

- 使用官方产品图片（高质量）
- 确保图片尺寸一致（400x400px 推荐）
- 使用 WebP 格式优化

---

## 🔗 相关文档

- [执行计划](./programmatic-seo-execution-plan.md)
- [技术实现指南](./programmatic-seo-technical-guide.md)


