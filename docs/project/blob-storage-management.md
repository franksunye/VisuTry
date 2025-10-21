# Blob Storage 管理功能文档

## 📅 实施日期
2025-10-21

## 🎯 功能概述

实现了完整的 Vercel Blob Storage 管理系统，帮助管理员有效管理存储空间、控制成本、清理孤立文件。

## ✅ 已实现功能

### 1. Storage 管理页面 (`/admin/storage`)

#### 存储统计仪表盘
- **Total Files**: 总文件数和总大小
- **Referenced Files**: 数据库中引用的文件数
- **Orphaned Files**: 孤立文件数和浪费的空间
- **Storage Usage**: 存储使用量和免费额度占比

#### 文件管理功能
- ✅ 文件列表展示（pathname, size, upload time）
- ✅ 搜索文件（按路径或 URL）
- ✅ 筛选显示（全部文件 / 仅孤立文件）
- ✅ 批量选择文件
- ✅ 批量删除文件（最多 100 个）
- ✅ 查看文件（在新标签页打开）

#### 孤立文件清理
- ✅ 一键检测孤立文件
- ✅ 预览清理结果（Dry Run）
- ✅ 执行清理操作
- ✅ 显示清理统计（文件数、释放空间）

### 2. API 端点

#### `/api/admin/blob/stats` (GET)
获取存储统计信息

**响应数据：**
```json
{
  "success": true,
  "data": {
    "totalFiles": 150,
    "totalSize": 52428800,
    "totalSizeMB": "50.00",
    "orphanedFiles": 12,
    "orphanedSize": 5242880,
    "orphanedSizeMB": "5.00",
    "referencedFiles": 138,
    "filesByType": {
      "jpg": 100,
      "png": 50
    },
    "topUsers": [
      { "userId": "user123", "count": 45 }
    ]
  }
}
```

#### `/api/admin/blob/list` (GET)
列出所有 Blob 文件

**查询参数：**
- `prefix`: 文件路径前缀（可选）
- `limit`: 返回数量限制（可选）
- `orphaned`: 仅显示孤立文件（true/false）

**响应数据：**
```json
{
  "success": true,
  "data": {
    "files": [
      {
        "url": "https://...",
        "pathname": "try-on/user123/1234567890-user.jpg",
        "size": 524288,
        "sizeMB": "0.50",
        "uploadedAt": "2025-10-21T10:00:00Z",
        "downloadUrl": "https://..."
      }
    ],
    "total": 150
  }
}
```

#### `/api/admin/blob/delete` (POST)
删除指定的文件

**请求体：**
```json
{
  "urls": [
    "https://blob.vercel-storage.com/...",
    "https://blob.vercel-storage.com/..."
  ]
}
```

**限制：**
- 最多一次删除 100 个文件
- 仅 ADMIN 角色可访问

**响应数据：**
```json
{
  "success": true,
  "data": {
    "deleted": 2
  }
}
```

#### `/api/admin/blob/cleanup` (POST)
清理孤立文件

**请求体：**
```json
{
  "dryRun": true  // true=预览, false=执行
}
```

**响应数据：**
```json
{
  "success": true,
  "data": {
    "dryRun": true,
    "orphanedFiles": 12,
    "orphanedSize": 5242880,
    "orphanedSizeMB": "5.00",
    "deletedCount": 0,
    "files": [
      {
        "url": "https://...",
        "pathname": "try-on/...",
        "size": 524288,
        "uploadedAt": "2025-10-21T10:00:00Z"
      }
    ]
  }
}
```

### 3. Try-On 任务管理

#### `/api/admin/try-on/[id]` (GET)
获取 Try-On 任务详情（包含图片 URL）

**响应数据：**
```json
{
  "success": true,
  "data": {
    "id": "task123",
    "userId": "user123",
    "userImageUrl": "https://...",
    "glassesImageUrl": "https://...",
    "resultImageUrl": "https://...",
    "status": "COMPLETED",
    "errorMessage": null,
    "createdAt": "2025-10-21T10:00:00Z",
    "updatedAt": "2025-10-21T10:05:00Z",
    "user": {
      "id": "user123",
      "name": "John Doe",
      "email": "john@example.com",
      "createdAt": "2025-01-01T00:00:00Z"
    }
  }
}
```

#### `/api/admin/try-on/[id]` (DELETE)
删除 Try-On 任务及其相关文件

**功能：**
1. 删除数据库中的任务记录
2. 删除 Blob Storage 中的相关文件（用户图片、眼镜图片、结果图片）

**响应数据：**
```json
{
  "success": true,
  "data": {
    "deletedTask": "task123",
    "deletedFiles": 3
  }
}
```

### 4. UI 组件

#### `StorageManager` 组件
**位置：** `src/components/admin/StorageManager.tsx`

**功能：**
- 显示存储统计卡片
- 文件列表和搜索
- 批量选择和删除
- 孤立文件清理

**状态管理：**
- `stats`: 存储统计数据
- `files`: 文件列表
- `selectedFiles`: 选中的文件
- `showOrphaned`: 是否只显示孤立文件
- `searchTerm`: 搜索关键词

#### `TryOnDetailDialog` 组件
**位置：** `src/components/admin/TryOnDetailDialog.tsx`

**功能：**
- 显示 Try-On 任务详情
- 显示用户信息
- 显示时间线
- 显示图片 URL
- 按需加载图片预览
- 删除任务和文件

**Props：**
```typescript
interface TryOnDetailDialogProps {
  taskId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}
```

#### `TryOnHistoryTable` 组件
**位置：** `src/components/admin/TryOnHistoryTable.tsx`

**功能：**
- 显示 Try-On 任务列表
- 添加"View Details"按钮
- 集成 TryOnDetailDialog

## 🔧 技术实现

### 孤立文件检测算法

```typescript
// 1. 获取所有 Blob 文件
const { blobs } = await list();

// 2. 获取数据库中所有图片 URL
const tasks = await prisma.tryOnTask.findMany({
  select: {
    userImageUrl: true,
    glassesImageUrl: true,
    resultImageUrl: true,
  },
});

// 3. 构建 URL 集合
const dbUrls = new Set<string>();
tasks.forEach(task => {
  if (task.userImageUrl) dbUrls.add(task.userImageUrl);
  if (task.glassesImageUrl) dbUrls.add(task.glassesImageUrl);
  if (task.resultImageUrl) dbUrls.add(task.resultImageUrl);
});

// 4. 找出孤立文件
const orphanedFiles = blobs.filter(blob => !dbUrls.has(blob.url));
```

### 批量删除实现

```typescript
// 分批删除（每批 100 个）
const batchSize = 100;
for (let i = 0; i < urlsToDelete.length; i += batchSize) {
  const batch = urlsToDelete.slice(i, i + batchSize);
  await del(batch);
}
```

### 权限控制

所有 API 端点都包含权限验证：

```typescript
const session = await getServerSession(authOptions);
if (!session || !session.user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

if (session.user.role !== 'ADMIN') {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

## 📊 使用场景

### 场景 1: 定期清理孤立文件
1. 访问 `/admin/storage`
2. 点击 "Cleanup Orphaned Files" 按钮
3. 查看预览结果（文件数、释放空间）
4. 确认后执行清理

### 场景 2: 查找特定用户的文件
1. 在搜索框输入用户 ID
2. 查看该用户的所有文件
3. 可选：批量删除

### 场景 3: 查看 Try-On 任务详情
1. 访问用户详情页 `/admin/users/[id]`
2. 在 Try-On History 列表中点击 "View Details"
3. 查看任务详情和图片
4. 可选：删除任务和文件

### 场景 4: 监控存储使用
1. 访问 `/admin/storage`
2. 查看统计卡片
3. 监控存储使用量和免费额度占比
4. 及时清理孤立文件

## 🔒 安全性

### 权限控制
- ✅ 所有 API 端点需要 ADMIN 角色
- ✅ 中间件自动验证 `/admin` 路由
- ✅ 客户端组件验证用户权限

### 数据保护
- ✅ 图片默认不显示（按需加载）
- ✅ 删除操作需要确认对话框
- ✅ 批量删除有数量限制（100 个）
- ✅ Dry Run 模式防止误删

### 操作日志
- ✅ 所有操作都有 console.log 记录
- ✅ 包含操作类型、文件数、用户信息

## 💰 成本优化

### Vercel Blob 定价
- **免费额度**: 1GB 存储 + 100GB 流量/月
- **超出后**: $0.15/GB 存储 + $0.30/GB 流量

### 优化策略
1. **定期清理孤立文件**
   - 建议：每周清理一次
   - 预期效果：节省 5-10% 存储空间

2. **监控存储使用**
   - 实时查看存储使用量
   - 接近免费额度时及时清理

3. **删除失败任务的文件**
   - 失败任务的图片通常不再需要
   - 可以手动删除释放空间

## 📈 未来改进

### 短期（1-2 周）
- [ ] 添加自动清理定时任务
- [ ] 添加存储使用趋势图表
- [ ] 添加文件大小排序
- [ ] 添加按日期筛选

### 中期（1-2 月）
- [ ] 添加存储成本预估
- [ ] 添加文件压缩功能
- [ ] 添加批量下载功能
- [ ] 添加操作审计日志

### 长期（3-6 月）
- [ ] 集成 CDN 缓存分析
- [ ] 添加智能清理建议
- [ ] 添加存储配额管理
- [ ] 添加多区域存储支持

## 🧪 测试建议

### 功能测试
1. ✅ 测试存储统计数据准确性
2. ✅ 测试孤立文件检测准确性
3. ✅ 测试批量删除功能
4. ✅ 测试 Try-On 详情查看
5. ✅ 测试权限控制

### 性能测试
1. 测试大量文件（1000+）的列表性能
2. 测试批量删除性能
3. 测试孤立文件检测性能

### 安全测试
1. 测试非 ADMIN 用户访问
2. 测试批量删除限制
3. 测试 SQL 注入防护

## 📝 使用文档

### 管理员操作指南

#### 如何清理孤立文件
```
1. 登录 Admin 面板
2. 访问 Storage 页面
3. 点击 "Cleanup Orphaned Files"
4. 查看预览结果
5. 确认后点击 "Cleanup Now"
```

#### 如何查看用户的 Try-On 图片
```
1. 访问用户详情页
2. 滚动到 Try-On History 部分
3. 点击任务的 "View Details" 按钮
4. 点击 "Show Images" 查看图片
```

#### 如何批量删除文件
```
1. 访问 Storage 页面
2. 使用搜索框筛选文件
3. 勾选要删除的文件
4. 点击 "Delete Selected"
5. 确认删除
```

## 🎉 总结

本次实现完成了完整的 Blob Storage 管理系统，主要成就：

1. **功能完整性**: 实现了存储管理的所有核心功能
2. **用户体验**: 直观的 UI 和清晰的操作流程
3. **安全性**: 完善的权限控制和操作确认
4. **成本控制**: 有效的孤立文件检测和清理
5. **可维护性**: 清晰的代码结构和完善的文档

Storage 管理功能现已完全可用，可以有效帮助管理员控制存储成本和管理文件。

