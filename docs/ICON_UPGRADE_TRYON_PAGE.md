# Try-On 页面图片上传区域 ICON 升级

## 📋 概述

升级 try-on 页面的图片上传区域，将通用的图片 ICON 替换为更具体的人像和眼镜 ICON，使界面更加直观，易于新用户理解上传的图像类型。

## 🎯 改进点

### 之前
- 两个上传区域都使用通用的图片 ICON（`Image`）
- 用户可能不清楚每个区域应该上传什么类型的图片

### 之后
- **人像上传区域**：使用 `User` ICON（👤）
- **眼镜上传区域**：使用 `Glasses` ICON（👓）
- 界面更加直观，新用户能快速理解每个区域的用途

## 📝 技术实现

### 1. 修改 ImageUpload 组件

**文件**: `src/components/upload/ImageUpload.tsx`

#### 添加新的 prop
```typescript
interface ImageUploadProps {
  // ... 其他 props
  iconType?: "image" | "user" | "glasses"  // 新增
}
```

#### 导入新的 ICON
```typescript
import { Upload, X, Image as ImageIcon, Loader2, User, Glasses } from "lucide-react"
```

#### 创建 getIcon 函数
```typescript
const getIcon = () => {
  switch (iconType) {
    case "user":
      return <User className="w-7 h-7 text-blue-600" />
    case "glasses":
      return <Glasses className="w-7 h-7 text-blue-600" />
    default:
      return <ImageIcon className="w-7 h-7 text-blue-600" />
  }
}
```

### 2. 更新 TryOnInterface 组件

**文件**: `src/components/try-on/TryOnInterface.tsx`

#### 人像上传区域
```typescript
<ImageUpload
  onImageSelect={handleUserImageSelect}
  onImageRemove={handleUserImageRemove}
  currentImage={userImage?.preview}
  label="Your Photo"
  description="Clear front-facing photo"
  loading={isProcessing}
  height="h-[300px]"
  iconType="user"  // 新增
/>
```

#### 眼镜上传区域
```typescript
<ImageUpload
  onImageSelect={handleGlassesImageSelect}
  onImageRemove={handleGlassesImageRemove}
  currentImage={glassesImage?.preview}
  label="Glasses"
  description="Clear image of glasses"
  loading={isProcessing}
  height="h-[180px]"
  iconType="glasses"  // 新增
/>
```

### 3. 更新测试文件

**文件**: `tests/unit/components/upload/ImageUpload.test.tsx`

- 在 mock 中添加了 `User` 和 `Glasses` ICON
- 添加了三个新的测试用例：
  - `should render user icon when iconType is "user"`
  - `should render glasses icon when iconType is "glasses"`
  - `should render image icon when iconType is "image" or not provided`

## ✅ 向后兼容性

- `iconType` prop 有默认值 `"image"`
- 现有的 ImageUpload 使用不需要任何修改
- 完全向后兼容

## 🧪 测试

运行测试来验证新功能：
```bash
npm test -- tests/unit/components/upload/ImageUpload.test.tsx
```

## 📊 文件变更总结

| 文件 | 变更 | 说明 |
|------|------|------|
| `src/components/upload/ImageUpload.tsx` | 修改 | 添加 iconType prop 和 getIcon 函数 |
| `src/components/try-on/TryOnInterface.tsx` | 修改 | 为两个 ImageUpload 传递 iconType |
| `tests/unit/components/upload/ImageUpload.test.tsx` | 修改 | 更新 mock 和添加新测试用例 |

## 🎨 UI 效果

- 拖拽时：显示 Upload ICON（保持不变）
- 空状态：显示对应的 ICON（User 或 Glasses）
- 已上传：显示预览图片（保持不变）

## 📱 响应式设计

- 所有 ICON 大小和样式保持一致
- 在所有设备上都能正确显示
- 移动端和桌面端体验一致

